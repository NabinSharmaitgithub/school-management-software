import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
