# Firebase Setup — School Management Software

**Default backend: Firebase** (ponytail + stitch + firebase)

**Project:** `school-mgmt-glass-2025` — School Management Software
**Web App:** `1:62274083254:web:c2710c6f5f3936be94c917` — School Management Web
**Region:** us-central (Firestore)

## 1. Firestore Schema + Security Rules

Rules already deployed in `firestore.rules`:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Scoped to `authenticated` — mirrors prior Supabase RLS `authenticated` policy.

### Collections (mirrors Supabase tables: classes, students, subjects, marks)

- `classes` : { id (auto), name: string, section: string, createdAt: timestamp }
- `students` : { id, name, roll_number, class_id (ref classes), createdAt }
- `subjects` : { id, name, code?, description? }
- `marks` : { id, student_id (ref students), subject_id (ref subjects), exam_term: string, marks_obtained: number, max_marks: number }

Create via Firebase Console > Firestore > Start in **production mode** (rules above) or via SDK:
```js
import { doc, setDoc } from "firebase/firestore";
// example: add class
await setDoc(doc(db, "classes", id), { name, section, createdAt: serverTimestamp() });
```

**Indexes:** `firestore.indexes.json` auto-generated — add composite indexes for queries like `marks where student_id == X && exam_term == Y` via console prompt.

## 2. Auth

Enabled: Email/Password (`auth.providers.emailPassword: true` in firebase.json)

Enable in Console: Authentication > Sign-in method > Email/Password → Enable

**Seed admin login:** `admin@school.local` / `admin123!` — created by `node scripts/seed.mjs`.

Seed data (optional): run `node scripts/seed.mjs` from repo root (reads `.env.local`) to
populate demo classes/subjects/students/attendance/marks/payments via Firestore REST.

## 3. Hosting

`firebase.json` hosting.public = `out` (for Next.js static export) or `build` if using `next build`.

For Next.js App Router + Firebase Hosting, use `firebase apphosting` or deploy via Vercel/Firebase Hosting with `next export`:
```bash
npm run build
firebase deploy --only hosting --project school-mgmt-glass-2025
```

## 4. Env Vars

Copy `.env.local.example` → `.env.local` and fill (already has API key for web app). For Next.js client SDK, all `NEXT_PUBLIC_` vars are required.

## 5. Local Dev (Next.js + Firebase)

```bash
cd school-management-software
npm install firebase  # + next, react, tailwind
npm run dev  # reads .env.local
```

See `lib/firebase.ts` (to be created) for initialization:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 6. Supabase Legacy

Previous Supabase project `eduadmin` (delplyuxwjcjljeconjj, ap-southeast-1) still exists with tables `classes`, `students`, `subjects`, `marks` and RLS. Keep as backup or migrate data to Firestore via script. Supabase is no longer default.

## 7. Deploy

- **Firebase Hosting (default):** `firebase deploy --project school-mgmt-glass-2025`
- **Vercel (alternative):** `vercel --prod` with same `NEXT_PUBLIC_FIREBASE_*` env vars in Vercel dashboard.

