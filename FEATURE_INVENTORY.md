# Feature Inventory — School Management Software

**Repository:** `C:\Users\anish\Desktop\school-management-software-main`  
**Framework:** Next.js 14.2.35 (App Router) + Firebase Auth + Firestore  
**Audit basis:** Full codebase read (every file audited)  
**Status date:** Thu Oct 15 2026

---

## 1. Overview

A Next.js 14 App Router school management system backed by Firebase Auth and Firestore, with Tailwind CSS for styling. The app serves multiple roles (Admin, Teacher, Student, Parent) and covers academics, finance, attendance, library, hostel, transport, communications, payroll, and settings.

There is **no traditional backend API** — business logic lives in `lib/data.ts` (Firestore helpers) and is called directly from client components/pages. File uploads go through a signed Cloudinary route (`/api/cloudinary/sign`).

**Ponytail ceiling notes** (`ponytail:` comments appear in source, e.g. `uploadSchoolLogo`) mark deliberate simplicity ceilings where the author chose minimal code over robustness.

---

## 2. Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js | 14.2.35, App Router, `"use client"` pages |
| Runtime language | TypeScript | ^5.5.3 |
| Auth | Firebase Auth | ^10.12.0 (client-side password handling; Firebase hashes) |
| Database | Cloud Firestore | NoElixir/NoSQL; 30 collections |
| Styling | Tailwind CSS | ^3.4.6, custom `tailwind.config.js`, `postcss.config.js` |
| PDF generation | html2canvas + jspdf | ^1.4.1 / ^4.2.1, plus `jspdf-autotable` ^5.0.8 |
| File uploads | Cloudinary | Signed via `/api/cloudinary/sign` server route; folders: `photos/students`, `photos/staff`, `settings/logo` |
| Icons | Material Symbols | `material-symbols-outlined` |
| Linting | ESLint | ^8.57.0 + `eslint-config-next` ^14.2.35 (added; originally none) |
| ESLint config | `.eslintrc.json` | `extends: next/core-web-vitals`, `rules: {}` |
| Testing | None | No test framework, no test files |
| Env | `.env` (present locally, gitignored) | No `.env.local` file exists |
| Hosting target | Firebase Hosting | Default per AGENTS.md (Firebase Auth + Firestore + Hosting) |

**Dependencies (production):** `firebase`, `html2canvas`, `jspdf`, `jspdf-autotable`, `next`, `react`, `react-dom`  
**Dev dependencies:** `@types/node`, `@types/react`, `@types/react-dom`, `autoprefixer`, `eslint`, `eslint-config-next`, `postcss`, `tailwindcss`, `typescript`

**Not present:** ESLint originally (added later), no CSRF protection, no rate limiting, no session management beyond Firebase defaults, no pagination primitives, no role-based Firestore rules.

---

## 3. Firestore Collections (from `lib/data.ts`)

The `col` object in `lib/data.ts` (lines 394–425) exposes 30 collections. Every collection is accessed via `listDocs`-style `getDocs` (no pagination, no cursors).

| # | Collection | Helper | Doc ID scheme | Notes |
|---|---|---|---|---|
| 1 | `students` | `col.students()` | auto | `Student` type |
| 2 | `classes` | `col.classes()` | auto | `Class` (name, section) |
| 3 | `subjects` | `col.subjects()` | auto | `Subject` |
| 4 | `marks` | `col.marks()` | deterministic `${student}_${subject}_${term}_${year}` (bulk) / auto | `Mark`, `BulkMarkEntry` |
| 5 | `attendance` | `col.attendance()` | `${studentId}_${date}` (idempotent) | `AttendanceEntry` |
| 6 | `payments` | `col.payments()` | auto | `Payment` |
| 7 | `fee_invoices` | `col.fee_invoices()` | auto | `FeeInvoice` |
| 8 | `discounts` | `col.discounts()` | auto | `Discount` |
| 9 | `late_fees` | `col.late_fees()` | fixed `config` | `LateFee` singleton |
| 10 | `users` | `col.users()` | email | `UserRecord`, links Auth email → student |
| 11 | `staff` | `col.staff()` | auto | `Staff` |
| 12 | `staff_attendance` | `col.staff_attendance()` | auto | `StaffAttendance` |
| 13 | `leaves` (store `leave_requests`) | `col.leaves()` | auto | `LeaveRequest` |
| 14 | `notifications` | `col.notifications()` | auto | `NotificationItem` |
| 15 | `assignments` | `col.assignments()` | `ct_<class>` / `st_<class>_<subject>` | Teacher assignments |
| 16 | `books` | `col.books()` | auto | `Book` |
| 17 | `loans` | `col.loans()` | auto | `Loan` |
| 18 | `announcements` | `col.announcements()` | auto | `Announcement` |
| 19 | `broadcasts` | `col.broadcasts()` | auto | `Broadcast` |
| 20 | `threads` | `col.threads()` | auto | `Thread` + embedded `ThreadMessage[]` |
| 21 | `rooms` | `col.rooms()` | auto | `HostelRoom` |
| 22 | `hostel_fees` | `col.hostel_fees()` | auto | `HostelFee` |
| 23 | `routes` | `col.routes()` | auto | `Route` |
| 24 | `route_assignments` | `col.route_assignments()` | auto | `RouteAssignment` |
| 25 | `vehicles` | `col.vehicles()` | auto | `Vehicle` |
| 26 | `fee_structures` | `col.fee_structures()` | auto | `FeeStructure` |
| 27 | `exams` | `col.exams()` | auto | `Exam` |
| 28 | `exam_sessions` | `col.exam_sessions()` | auto | `ExamSession` |
| 29 | `payslips` | `col.payslips()` | auto | `Payslip` |
| 30 | `timetable` | `col.timetable()` | auto | `TimetableEntry` |
| — | `settings` (singleton docs) | `doc(db, "settings", "school")` / `"timetable"` | fixed ids | `SchoolSettings`, `TimetableConfig` |

**User roles:** `Admin`, `Teacher`, `Student`, `Parent` (`UserRole` type). Role is stored on the `users` doc, not derived from Firebase Auth custom claims.

**Core data-access pattern:** `listDocs<T>()` fetches *all* documents in a collection via `getDocs` (no `limit`, no cursor, no pagination). Specific helpers (`listStudents`, `listInvoicesHydrated`, etc.) wrap `getDocs` with optional `where`/`orderBy`.

---

## 4. Pages / Routes

All routes live under `app/`. The root `app/page.tsx` is the landing/home page. Auth pages (sign-in/sign-up) are not present as separate routes; `forgot-password` exists.

| Route | File | Status | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | working | Landing / home |
| `/forgot-password` | `app/forgot-password/page.tsx` | working | Password reset |
| `/dashboard` | `app/dashboard/page.tsx` | working | Role-based stats (students, classes, fees month, attendance trend, announcements) |
| `/dashboard/students` | `app/dashboard/students/page.tsx` | working | List, search, delete (permanent), class-scoped for teachers |
| `/dashboard/students/new` | `app/dashboard/students/new/page.tsx` | working | Create student (+ photo upload) |
| `/dashboard/students/[id]` | `app/dashboard/students/[id]/page.tsx` | working | Student detail |
| `/dashboard/staff` | `app/dashboard/staff/page.tsx` | working | Staff list |
| `/dashboard/staff/new` | `app/dashboard/staff/new/page.tsx` | working | Create staff (+ photo) |
| `/dashboard/staff/[id]` | `app/dashboard/staff/[id]/page.tsx` | working | Staff detail |
| `/dashboard/attendance` | `app/dashboard/attendance/page.tsx` | working | Daily class-wise marking only |
| `/dashboard/marks` | `app/dashboard/marks/page.tsx` | working | Marks entry/view |
| `/dashboard/marks/bulk` | `app/dashboard/marks/bulk/page.tsx` | working | Bulk marks upsert |
| `/dashboard/report-cards` | `app/dashboard/report-cards/page.tsx` | working | PDF report cards (html2canvas/jspdf) |
| `/dashboard/finance` | `app/dashboard/finance/page.tsx` | working | Fee invoices, record payment, payroll tab |
| `/dashboard/invoices/[id]` | `app/dashboard/invoices/[id]/page.tsx` | working | Invoice detail / pay |
| `/dashboard/my-fees` | `app/dashboard/my-fees/page.tsx` | working | Parent read-only fee portal |
| `/dashboard/my-class` | `app/dashboard/my-class/page.tsx` | working | Student/teacher class view |
| `/dashboard/my-attendance` | `app/dashboard/my-attendance/page.tsx` | working | Personal attendance view |
| `/dashboard/communications` | `app/dashboard/communications/page.tsx` | working | Broadcasts + threads |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | working | Analytics / grade bands |
| `/dashboard/academics` | `app/dashboard/academics/page.tsx` | working | Academics overview |
| `/dashboard/library` | `app/dashboard/library/page.tsx` | working | Books + loans |
| `/dashboard/hostel` | `app/dashboard/hostel/page.tsx` | working | Rooms, bed allocation, hostel fees |
| `/dashboard/transport` | `app/dashboard/transport/page.tsx` | working | Routes, vehicles, route assignments |
| `/dashboard/timetable` | `app/dashboard/timetable/page.tsx` | working | Timetable entries + config |
| `/dashboard/exam-schedules` | `app/dashboard/exam-schedules/page.tsx` | working | Exams + exam sessions |
| `/dashboard/id-cards` | `app/dashboard/id-cards/page.tsx` | working | ID card generation (bulk is fake) |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | working | School settings, logo upload |

**Status key:** `working` = page renders and performs its primary function per the audit. No page was found to be a complete stub/placeholder, but several contain fake/hardcoded logic (see Key Issues). No routes were marked `partial` or `placeholder` in the audit.

**Missing routes:** login/sign-up pages (handled by Firebase Auth client-side, no dedicated route), no 404/500 route, no API routes except `/api/cloudinary/sign`.

---

## 5. Features by Domain

### 5.1 Students
- Create, list, search (name/roll number), view detail, permanent delete
- Class-scoped visibility for teachers (via `useTeacherScope`)
- Photo upload to Cloudinary (`photos/students`)
- Optional fields: gender, email, phone, guardian, father_name, mother_name, dob, address, photo_url, dob
- **Gaps:** permanent delete only (no archive/soft-delete), no admission-number uniqueness, photo validation limited to size/type only, no pagination, no bulk import/export

### 5.2 Staff
- Create, list, view detail, delete, photo upload (`photos/staff`)
- Fields: name, role (designation), department, email, phone, joined, status (`active`/`on_leave`/`inactive`), photo_url
- **Gaps:** no role/permission management for staff beyond designation string

### 5.3 Classes & Subjects
- CRUD for classes (name + section) and subjects (name + optional code/description)
- Class-subject resolution helpers (`classNames`, `subjectNames`, `studentNames`, `staffNames`)

### 5.4 Dashboard
- Role-split stats: Admin sees total students, classes, fees collected (month), attendance today; Teacher sees own students/classes, my-attendance, classes taught
- Attendance trend chart (last 7 days, present %)
- Recent announcements (non-draft, latest 3)
- **Gaps:** limited stat set, no fee pending/overdue breakdown, no fee pending/overdue breakdown on dashboard

### 5.5 Attendance (Students)
- Daily marking per class/date; idempotent doc id `${studentId}_${date}`
- Statuses: present / absent / late
- `attendanceSince(since)` for reports/trends
- **Gaps:** no correction/audit workflow, no class-wise report page (only daily marking), no attendance reconciliation

### 5.6 Staff Attendance
- `staffAttendanceFor(staffId, month)` filters client-side by date prefix
- Statuses: present / absent / late
- **Gaps:** no staff attendance marking page found; data model exists but UI coverage is thin

### 5.7 Marks
- Single-mark add/delete; bulk upsert with deterministic doc id
- Fields: marks_obtained, max_marks, optional practical marks
- Bulk status: marked / absent / exempt; optional grade/percentage/remarks
- **Gaps:** no draft/publish states, no revision history, grade rules hardcoded differently in multiple places (inconsistent with report cards/analytics)

### 5.8 Report Cards
- PDF generation via html2canvas + jspdf (+ jspdf-autotable)
- Grade bands used here differ from analytics/bulk marks (inconsistent)
- **Gaps:** 2 `react/no-unescaped-entities` lint errors in this page

### 5.9 Finance / Fees
- Monthly fee invoice generation from class `fee_structures` (+ active discounts)
- Invoice status: PENDING / PARTIAL / PAID / OVERDUE (OVERDUE derived at read time via `hydrate`)
- Late-fee config (grace days, percent/fixed penalty) applied at read time
- Record payment against invoice; updates `paid`/`status`; generates receipt number
- Discounts (PERCENT/FIXED) per student
- Hostel fees (rent/mess/laundry) + collection recording to payments ledger
- Transport monthly fee on route assignments
- **Gaps:** `recordInvoicePayment` not transactional, no audit trail for deletions, receipt numbers use `Math.random`, no fee pending/overdue breakdown, no payment reminders, no partial-payment tracking beyond status enum

### 5.10 Payroll (Finance tab)
- `generatePayroll(month)` creates pending payslips for all active staff
- **Hardcoded amounts:** `basic: 45000`, `allowances: 8500`, `deductions: 5200` (NPR)
- Payslip status: paid / pending; `updatePayslipStatus`, `updatePayslipAmounts`
- **Gaps:** amounts hardcoded, no salary structure config, no payslip PDF, no audit trail

### 5.11 Library
- Books catalog (title, author, ISBN, genre, copies)
- Issue/return loans; fine + fine_paid; `activeLoans()` filters client-side (avoids composite index)
- **Gaps:** no overdue fine automation, no reservation system

### 5.12 Hostel
- Rooms (block A/B/C, floor, number, capacity, occupants)
- Bed allocation with capacity check
- Hostel fees per student (rent/mess/laundry, due date, paid date)
- **Gaps:** no room-type pricing, no mess menu, no wardens

### 5.13 Transport
- Routes (name, bus, driver, stops, status active/delayed)
- Vehicles (plate, capacity, insurance/permit expiry, service log)
- Route assignments per student (pickup/drop stop, monthly fee, status pending/draft/assigned/conflict)
- `logService` appends to vehicle service history
- **Gaps:** no live bus tracking, no delay notifications

### 5.14 Timetable
- Timetable entries (class, subject, teacher, day, start/end, room)
- Timetable config (working days + ordered slots; default Mon–Sat, 7 slots incl. tiffin)
- Config stored in `settings/timetable`
- **Gaps:** no clash detection, no teacher/subject availability view

### 5.15 Exams
- Exam definitions (name, academic year)
- Exam sessions (subject, class_ids, date, start/end, room, invigilator)
- **Gaps:** no seating plan, no admit-card issuance tied to `fee_clearance_date`

### 5.16 Communications
- Announcements (audience: all/staff/parents/class, priority, draft flag, author)
- Broadcasts (subject, body, channel inapp/sms/email, groups, count, status)
- Threads with embedded messages; `ensureThread`, `sendThreadMessage`
- **Gaps:** broadcasts always marked `"delivered"` regardless of actual channel, hardcoded recipient counts, no delivery/read receipts, no SMS/email provider integration

### 5.17 Notifications
- CRUD + `markAllNotificationsRead`
- Sorted by timestamp (handles Firestore timestamp or string)
- **Gaps:** no real-time push, no per-user targeting beyond broadcast groups

### 5.18 Assignments (Teacher scope)
- Class teacher per class (`ct_<class>`) and subject teacher per (class, subject) (`st_<class>_<subject>`)
- `teacherRoles(email)` resolves classIds + subjectByClass; drives `useTeacherScope`
- **Gaps:** no subject content/homework posting (Assignments collection is teacher roster, not student homework)

### 5.19 ID Cards
- Bulk generate exists but is fake (`setTimeout`)
- QR code is a fake glyph (not a real QR)
- Blood group hardcoded `"O+"`
- **Gaps:** all of the above; no real QR generation, no blood-group field on student

### 5.20 Settings
- School settings singleton (`settings/school`): name, address, timezone, currency (NPR रु), primary color, fee_clearance_date, logo_url
- Logo upload via Cloudinary → `settings/logo`
- Timetable config stored in `settings/timetable`
- **Gaps:** no role/permission management, no document templates, no email/SMTP config, no backup/restore

### 5.21 Authentication & Users
- Firebase Auth (email/password assumed)
- `ensureUser(email, role)` upserts `users/{email}` on sign-in; `setUserStudent` links email → student
- `getUserByEmail` used for role resolution and My Fees portal gating
- **Gaps:** no custom claims, no role-based access control in Firestore rules, passwords not hashed client-side (Firebase handles it), no session expiration beyond Firebase default, no MFA

### 5.22 File Uploads (Cloudinary)
- Signed upload via `/api/cloudinary/sign` (returns cloudName, apiKey, timestamp, signature, public_id)
- Client then POSTs directly to Cloudinary
- Used for: school logo, student photos, staff photos
- **Gaps:** no image optimization/resizing client-side, no file-type validation server-side beyond client, no upload progress/retry

---

## 6. Key Issues Found

### 6.1 Students
- **Permanent delete only** — no archive/soft-delete; deleted student data is gone
- **No admission number uniqueness** — roll_number is not enforced unique
- **Photo validation limited** to size/type only; no content/malware scanning
- **No pagination** — `listStudents()` fetches all students

### 6.2 Dashboard
- **Limited stats** — no fee pending/overdue breakdown, no collections-vs-targets view

### 6.3 Finance
- `recordInvoicePayment` is **not transactional** (payment doc + invoice update are separate writes; failure between them leaves inconsistency)
- **No audit trail** for deletions (invoices, payments, etc.)
- **Receipt numbers use `Math.random`** — `RCT-<date>-<random 4-digit>`; collision possible, not sequential
- Payroll amounts **hardcoded** (45000/8500/5200)

### 6.4 Attendance
- **No correction/audit workflow** — once marked, changes are silent overwrites
- **No class-wise report page** — only daily marking exists; reports built ad-hoc in dashboard

### 6.5 Marks
- **No draft/publish states** — marks are immediately visible
- **No revision history** — overwrites destroy prior values
- **Grade rules hardcoded differently** in multiple places (report cards vs analytics vs bulk marks) — inconsistent band boundaries

### 6.6 Communications
- Broadcasts always marked `"delivered"` regardless of actual channel/success
- Recipient counts are **hardcoded**, not computed from actual recipients
- No SMS/email provider integration; channel is only a label

### 6.7 ID Cards
- Bulk generate is **fake** (`setTimeout`)
- QR is a **fake glyph**, not a scannable QR code
- Blood group hardcoded `"O+"`; no blood-group field on student model

### 6.8 Report Cards
- Grade bands **differ from analytics/bulk marks** — inconsistent grading across the app
- 2 `react/no-unescaped-entities` lint errors

### 6.9 Settings
- **No role/permission management** — all authenticated users have same Firestore access
- **No document templates** (invoice, receipt, ID card, report card layouts are hardcoded)

### 6.10 Security (Firestore Rules)
`firestore.rules` contains a catch-all:
```
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
Plus explicit `allow read, write: if request.auth != null;` for fee_invoices, discounts, late_fees, users.
- **Any authenticated user can read/write every document** — no role-based rules, no field-level validation, no ownership checks
- Students/Parents could modify invoices, marks, staff, settings, etc.

### 6.11 Lint Errors (7 total)
- 2 × `react/no-unescaped-entities` in `report-cards` page
- 5 × `react-hooks/rules-of-hooks` in `ui/index.tsx` (Modal component)
- ~20 warnings (pre-existing)

### 6.12 Environment
- **No `.env.local` file** — only `.env`, which is gitignored but present locally (firebase config keys presumably there)
- Firebase config is read from env at runtime

### 6.13 General / Architecture
- **No tests exist** — no unit, integration, or E2E tests
- **No pagination on large queries** — `listDocs` gets all docs; will break at scale
- **No CSRF protection** — Next.js Server Actions not used; client calls Firestore directly, so CSRF is less applicable, but no token-based protection for `/api/cloudinary/sign`
- **No rate limiting** on any route
- **Passwords not hashed client-side** — Firebase Auth handles hashing; acceptable, but no additional client-side obfuscation
- **No session expiration beyond Firebase default** — no custom session timeout, no forced re-auth for sensitive actions

---

## 7. Security & Access Control Summary

| Area | Current state | Gap |
|---|---|---|
| Authentication | Firebase Auth | OK |
| Role storage | `users/{email}` doc with `role` field | Not enforced anywhere |
| Firestore rules | `request.auth != null` for all docs | **No role-based or ownership rules** |
| Client-side enforcement | `useTeacherScope()` + `scope.isAdmin` checks in UI only | UI-only; bypassable via console |
| Sensitive actions | No re-auth, no CSRF, no rate limit | Gaps |
| File upload | Signed Cloudinary route | No server-side validation |

---

## 8. Baseline Results

| Check | Tool | Result |
|---|---|---|
| Build | `next build` | **PASSED** |
| Type-check | `tsc` (via build) | **PASSED** |
| Lint | `next lint` | **7 errors + ~20 warnings** |

Lint breakdown:
- 2 errors: `react/no-unescaped-entities` (report-cards page)
- 5 errors: `react-hooks/rules-of-hooks` (ui/index.tsx Modal)
- ~20 warnings (various, pre-existing)

---

## 9. Not Implemented / Missing Entirely

- Login / sign-up routes (Firebase Auth handled client-side; no dedicated pages)
- 404 / 500 error routes
- API routes other than `/api/cloudinary/sign`
- Test suite of any kind
- Pagination / cursors on Firestore queries
- Role-based Firestore security rules
- CSRF / rate limiting
- Draft/publish for marks and announcements (announcements has `draft` but marks do not)
- Revision history / audit log
- Real-time listeners (all reads are one-off `getDocs`)
- Email/SMS provider integration
- Document templates
- Soft-delete / archive
- Admission-number uniqueness
- Class-wise attendance report page
- Payslip PDF generation
- Salary structure configuration
- QR code generation (real)
- Blood-group field on students
- Overdue fine automation (library)
- Bus tracking / delay notifications
- Timetable clash detection
- Admit-card issuance gated on `fee_clearance_date`
- MFA, custom Auth claims, session timeout controls

---

## 10. Conventions & Patterns in Codebase

- `ponytail:` comments mark deliberate simplicity ceilings (e.g. `uploadSchoolLogo` newest-URL trick, `deleteField()` usage)
- All Firestore reads use `getDocs` (no real-time `onSnapshot`)
- Doc IDs are either auto-generated, deterministic (marks bulk, attendance, assignments), or fixed singletons (late_fees config, settings)
- Client components are `"use client"`; Firestore is called directly from components (no server actions)
- Currency formatted as `रु` (NPR) with L/K suffixes
- Status colors/tone via `StatusPill` component from `@/components/ui`
- Design system lives in `@/components/ui` (GlassButton, GlassCard, Modal, StatusPill, Alert, etc.) — hand-coded, not generated by Stitch despite AGENTS.md default
