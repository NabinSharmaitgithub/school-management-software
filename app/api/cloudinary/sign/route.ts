import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, validateCsrfToken, generateCsrfToken } from "@/lib/security";

export const runtime = "nodejs";

const CSRF_COOKIE_NAME = "csrf_token";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** GET: issue a fresh CSRF token for the client to use on the sign endpoint. */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`csrf:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const token = generateCsrfToken();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}

/** POST: sign a Cloudinary upload (rate-limited + CSRF protected). */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`sign:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // CSRF double-submit validation
  const token = req.headers.get("x-csrf-token") ?? null;
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
  if (!validateCsrfToken(token, cookieToken)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token." }, { status: 403 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured." },
      { status: 500 }
    );
  }

  const { folder, publicId } = await req.json().catch(() => ({}));
  if (typeof folder !== "string" || !folder) {
    return NextResponse.json({ error: "folder is required." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = publicId || `${folder}/${Date.now()}`;

  const str = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(str, "utf8").digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    public_id,
  });
}
