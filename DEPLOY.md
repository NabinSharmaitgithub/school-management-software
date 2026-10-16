# Deployment — School Management System

This is a Next.js 14 App Router application backed by Firebase (Auth + Firestore +
Cloudinary). It is designed for server-side rendering, so the recommended live
hosting is **Firebase App Hosting** or **Vercel** (both support Next.js App Router
natively). Static export (`next export`) is NOT used because the app has dynamic
routes (`/dashboard/invoices/[id]`, `/dashboard/staff/[id]`,
`/dashboard/students/[id]`) that require request-time data.

## Prerequisites

1. A Firebase project with:
   - Authentication (Email/Password provider enabled)
   - Firestore (production mode)
   - Cloud Storage (optional; profile photos use Cloudinary)
2. A Cloudinary account (for photo/logo uploads).
3. The `.env.local` file (gitignored) populated with the values below.

## Environment variables (`.env.local`)

Copy the Firebase web-app config from the Firebase Console
(Project Settings → General → Your apps → Firebase SDK snippet → Config) and the
Cloudinary credentials from the Cloudinary Console:

```
# Firebase (from Firebase Console web app config)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Cloudinary (from Cloudinary Console dashboard)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

> Never commit `.env.local`. It is gitignored.

## Firestore security rules

Deploy the rules from `firestore.rules` (role-based access):

```
firebase deploy --only firestore:rules --project <YOUR_PROJECT>
```

The rules enforce:
- Reads: any authenticated user
- Writes: admin-only for staff, classes, subjects, fees, settings, etc.
- Append-only audit logs (`fee_audit_logs`, `attendance_corrections`,
  `mark_revisions`, `promotion_history`)
- Students: admin-only create/update/delete (archive/restore via update)

## Option A — Firebase App Hosting (recommended for Firebase)

Firebase App Hosting hosts Next.js App Runner with SSR, connects to your
Firebase project, and manages builds/deploys from GitHub.

1. In the Firebase Console, go to **App Hosting** → **Get started**.
2. Connect your GitHub repository.
3. Set the build command to `npm run build` and the runtime to Node.js.
4. Add the `NEXT_PUBLIC_FIREBASE_*` and Cloudinary env vars in the App Hosting
   environment configuration.
5. Deploy on push to your default branch.

App Hosting provisions a URL like `https://<project>-<hash>.uc.r.appspot.com`.

## Option B — Vercel

1. Push the repo to GitHub.
2. In Vercel, **Add New Project** → import the repository.
3. Framework preset: Next.js (detected automatically).
4. Add the same `NEXT_PUBLIC_*` and Cloudinary env vars in
   Project Settings → Environment Variables.
5. Deploy.

Vercel provisions a URL like `https://<project>.vercel.app`.

## Local development

```
npm install            # install dependencies
cp .env.example .env.local  # (create .env.local with real values)
npm run dev            # http://localhost:3000
```

## Seed data (optional)

To populate demo classes, students, staff, fees, etc., run:

```
node scripts/seed.mjs   # reads .env.local
```

Creates `admin@school.local` / `admin123!` and
`teacher@school.local` / `teacher123!`.

## Verification before deploy

```
npm run build   # production build (must succeed)
npm run lint    # ESLint (must be clean)
npx tsc --noEmit # TypeScript check (must be clean)
npm test        # Vitest suite
```

## Security notes

- The `/api/cloudinary/sign` route is rate-limited (30 req/min/IP) and CSRF
  protected (double-submit cookie `csrf_token` + `X-CSRF-Token` header).
- Security middleware adds `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  CSP, and HSTS (production).
- Do **not** hardcode credentials, API keys, or student data in the client
  bundle. All secrets are server-side only (`CLOUDINARY_API_SECRET` is never
  exposed to the browser).
