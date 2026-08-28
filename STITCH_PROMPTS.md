# Stitch UI Prompts — School Management System (Glassmorphism)

How to use:
1. Paste the **Design System Prompt** into Stitch first (or prepend it to every screen prompt) so all screens stay visually consistent.
2. Generate one screen at a time using the prompts below.
3. Export Stitch output (HTML/CSS or Figma) and hand it to OpenCode with a note like: "Implement this Stitch design as a Next.js component using our existing design tokens, connect it to Supabase table `<table>`."

---

## 🎨 Design System Prompt (paste first, reuse every time)

```
Design style: Modern glassmorphism for a school management web app (desktop-first, responsive down to tablet/mobile).

Visual language:
- Frosted-glass cards: semi-transparent white/dark backgrounds (8-15% opacity), backdrop-blur 20-40px, 1px translucent border (rgba white 20%), soft 24px rounded corners
- Layered depth: soft ambient gradient background (indigo/violet/teal blobs, blurred), floating glass panels casting subtle diffused shadows
- Color palette: primary indigo/violet (#6366F1–#8B5CF6), accent teal/cyan for success states, amber for warnings, rose for errors/overdue, neutral slate for text on a light or dark base (support both light and dark mode)
- Typography: Inter or similar geometric sans-serif; bold headings, comfortable line height, clear hierarchy
- Navigation: fixed left sidebar (glass panel) with icon + label nav, collapsible; top bar with glass search field, notification bell, role-based avatar/profile menu
- Components: glass cards for stats/widgets, pill-shaped glass buttons with subtle hover glow, glass modals/drawers, soft-glow focus states on inputs, glass dropdowns and tables with alternating translucent row tints
- Data viz: soft gradient-filled charts (line/bar/donut) inside glass containers
- Micro-interactions: subtle hover lift + glow, smooth 200ms transitions
- Accessibility: maintain WCAG AA contrast for text despite translucency (use solid-enough text color, not pure glass text)

Apply this exact style to the following screen:
```

---

## 1. Authentication & Core

**1.1 Login (role-based)**
```
Design a login screen for a school management system. Centered glass card (max-width 420px) floating over an ambient gradient background with blurred indigo/violet shapes. Inside the card: school logo placeholder, "Welcome Back" heading, role selector as 4 glass pill tabs (Admin / Teacher / Student / Parent), email/username input, password input with show/hide toggle, "Remember me" checkbox, "Forgot password?" link, full-width gradient glass "Sign In" button, divider "or continue with", SSO buttons (Google, Microsoft) as glass icon buttons. Small footer text with school name and support link.
```

**1.2 Forgot / Reset Password**
```
Design a two-step password recovery flow as glass cards. Step 1 "Forgot Password": glass card with lock icon illustration, heading, email input, "Send Reset Link" gradient button, back-to-login link. Step 2 "Reset Password": glass card with new password + confirm password fields, password-strength meter (glass segmented bar), "Reset Password" button, success state showing a checkmark animation placeholder and "Continue to Login" button.
```

**1.3 Dashboard (role-specific)**
```
Design a role-based dashboard shell with fixed glass sidebar (nav items: Dashboard, Students, Academics, Attendance, Staff, Finance, Communication, Library, Transport, Hostel, Settings — icons + labels), glass top bar with search, notifications, profile menu. Main area: row of 4 glass stat cards with icon, big number, trend arrow (e.g. Total Students, Attendance Today %, Fees Collected, Pending Tasks) — vary the 4 metrics per role (Admin: school-wide KPIs; Teacher: my classes/attendance/assignments due; Student: my attendance/grades/homework due; Parent: child's attendance/fees due/announcements). Below: 2-column layout — left a glass line/bar chart card (e.g. attendance trend or performance), right a glass "Recent Announcements" list and a glass "Upcoming Events" mini-calendar widget. Bottom: glass activity feed / quick-links row.
```

---

## 2. Student Management

**2.1 Student List / Search**
```
Design a student directory screen. Glass toolbar with search input, filter dropdowns (Class, Section, Status), "Add Student" gradient button, view toggle (table/grid). Main content: glass data table with columns Photo, Name, Roll No, Class-Section, Guardian, Contact, Status (glass status pill: Active/Inactive/Alumni), row actions (view/edit/delete icons). Pagination footer as glass pill controls. Include an alternate "grid view" of student photo cards for reference.
```

**2.2 Student Profile**
```
Design a student profile page. Header glass banner with student photo (large circular avatar), name, class-section, ID number, and quick action buttons (Edit, Generate ID Card, Print). Tabbed glass nav below header: Personal Info, Guardian Details, Academic History, Documents, Attendance, Fees. Personal Info tab content: two-column glass form-style display of DOB, gender, blood group, address, contact, emergency contact. Guardian Details tab: glass cards per guardian with photo, relation, occupation, contact. Documents tab: glass file cards (birth certificate, transfer certificate, photo) with upload/download icons.
```

**2.3 Admission / Enrollment Form**
```
Design a multi-step admission form wizard inside a large glass card. Top progress stepper (glass pill steps: Student Info → Guardian Info → Academic Details → Documents → Review) with active step highlighted via gradient glow. Step content example (Student Info): photo upload circle, name, DOB, gender, blood group, nationality, address fields in a clean 2-column glass form. Bottom navigation: "Back" ghost-glass button and "Next" gradient button. Include a final "Review & Submit" step showing a summary in read-only glass panels.
```

**2.4 ID Card Generation**
```
Design an ID card generator screen. Left panel: glass form to select student(s), template style, and toggle fields to include (photo, QR code, blood group, emergency contact, validity date). Right panel: live glass-card preview of the ID card itself in a credit-card aspect ratio with school logo, student photo, name, class, ID number, QR code, and a subtle glass/holographic sheen texture. Bottom action bar: "Generate Bulk", "Print", "Export PDF" gradient buttons.
```

**2.5 Student Promotion / Transfer**
```
Design a bulk promotion/transfer screen. Top glass filter bar: From Class-Section, To Class-Section (for promotion) or Transfer Certificate toggle. Main area: glass checklist table listing students with checkboxes, current class, result status (Pass/Fail glass pill), new class dropdown per row, and a "select all passed" quick action. Bottom summary glass card showing counts (Promoted / Retained / Transferred) and a "Confirm Promotion" gradient button with confirmation modal.
```

---

## 3. Academic

**3.1 Class & Section Management**
```
Design a class/section management screen. Glass card grid, one card per class (e.g. "Grade 5") showing section chips (A, B, C) with student-count badges, assigned class-teacher avatar, and "Manage" button. "Add Class" and "Add Section" glass modals with fields for name, capacity, class teacher dropdown, and academic year.
```

**3.2 Subject Management**
```
Design a subject management screen. Glass table listing subjects with columns: Subject Name, Code, Type (Core/Elective glass pill), Applicable Classes, Assigned Teachers (avatar stack), Actions. "Add Subject" glass modal with name, code, type toggle, class multi-select chips, and teacher multi-select.
```

**3.3 Timetable / Routine**
```
Design a weekly timetable/routine builder. Glass grid table: rows = time periods, columns = weekdays (Mon–Sat), each cell a small glass chip showing Subject + Teacher, color-coded by subject. Top controls: Class-Section selector, "Edit Mode" toggle, "Auto-generate" button. Include a drag-handle affordance on cells to suggest editability, and a side glass panel listing unassigned periods/conflicts.
```

**3.4 Syllabus Management**
```
Design a syllabus tracker. Left glass sidebar tree: Class > Subject list. Main area: glass accordion list of chapters/units, each row showing chapter title, planned dates, completion progress bar (gradient glass fill), and a status pill (Not Started/In Progress/Completed). "Add Chapter" gradient button and inline edit affordances.
```

**3.5 Homework / Assignment**
```
Design a homework/assignment module with two views. Teacher view: glass card list of assignments with title, class-subject, due date, attachment icon, submission count ("18/30 submitted"), and "Create Assignment" gradient button opening a glass modal (title, description rich-text area, class-subject select, due date picker, file attach, max marks). Student view: glass card list of assignments split into "Pending" and "Submitted" tabs, each card with due-date countdown badge and "Submit" button opening an upload glass modal.
```

**3.6 Exam Schedule**
```
Design an exam schedule screen. Top glass card: exam term selector (e.g. "Mid-Term 2026") and "Create Exam" button. Main: glass table/calendar hybrid listing Date, Time, Subject, Class, Room/Hall, Invigilator, with color-coded subject chips. Include a printable "Exam Routine" preview card styled as a formal glass document layout.
```

**3.7 Marks Entry / Gradebook**
```
Design a marks entry / gradebook screen. Top glass filter bar: Class, Section, Subject, Exam selector. Main: glass spreadsheet-style table with student names as rows, marks input cells (glass inline-editable fields) per assessment column, auto-calculated Total and Grade columns (color-coded grade pills A/B/C), "Save" and "Publish Results" gradient buttons, and a progress indicator for entry completeness.
```

**3.8 Report Card Generation**
```
Design a report card generator and preview. Left glass panel: filters for Class, Section, Exam Term, template style selector, and options toggles (include attendance, include remarks, include rank). Right panel: live preview of a formal report card in a glass document frame — school header, student photo/info, subject-wise marks table, grade summary, attendance %, teacher remarks box, signature lines. Bottom: "Generate for Class" and "Download PDF" gradient buttons.
```

**3.9 Result Analysis / Ranking**
```
Design a result analytics dashboard. Top glass stat cards: Class Average, Pass %, Top Scorer, Subject with Lowest Average. Main charts in glass containers: bar chart comparing section-wise averages, line chart of performance trend across exams, donut chart of grade distribution. Below: a glass ranking table with student name, total marks, percentage, rank badge (gold/silver/bronze glass medallion icons for top 3).
```

---

## 4. Attendance

**4.1 Daily Attendance (Student)**
```
Design a daily student attendance marking screen. Top glass bar: Class-Section selector, date picker (defaults today). Main: glass list of students with photo, name, roll number, and a 3-way glass toggle per row (Present / Absent / Late), color-coded (teal/rose/amber). "Mark All Present" quick action and "Save Attendance" gradient button, with a live summary glass chip showing counts.
```

**4.2 Staff Attendance**
```
Design a staff attendance screen, similar layout to student attendance but for teachers/staff: glass list with photo, name, department, check-in/check-out time fields (auto-filled from biometric/manual), status pill (Present/Absent/On Leave/Late), and a top summary glass card row (Present Today, On Leave, Late Arrivals).
```

**4.3 Attendance Reports**
```
Design an attendance analytics/report screen. Top filters: Class/Department, date range picker. Glass stat cards: Overall Attendance %, Chronic Absentees count, Best Attendance Section. Main chart: glass-container calendar heatmap showing daily attendance % (color intensity gradient), plus a line chart of trend over the term. Bottom: exportable glass table of individual attendance percentages with low-attendance rows highlighted in soft rose tint.
```

---

## 5. Staff / HR

**5.1 Teacher/Staff List**
```
Design a staff directory screen. Glass toolbar with search, department filter, role filter, "Add Staff" gradient button. Glass table/grid of staff cards: photo, name, designation, department, contact, status pill (Active/On Leave), action icons.
```

**5.2 Staff Profile**
```
Design a staff profile page. Header glass banner: photo, name, designation, department, employee ID, quick actions (Edit, Message). Tabbed sections: Personal Info, Employment Details (joining date, contract type, qualifications), Documents, Leave History, Payroll Summary — each in glass panels with clean 2-column layout.
```

**5.3 Leave Management**
```
Design a leave management screen with two views. Staff view: glass card showing leave balance summary (Sick/Casual/Earned as glass progress rings), "Apply for Leave" button opening a glass modal (leave type, date range, reason textarea, attach document), and a history table with status pills (Pending/Approved/Rejected). Admin/approver view: glass list of pending leave requests with staff photo, dates, reason preview, and inline Approve/Reject glass buttons.
```

**5.4 Payroll / Salary**
```
Design a payroll management screen. Top glass filter bar: month/year selector, department filter, "Run Payroll" gradient button. Main: glass table listing staff with columns Basic Salary, Allowances, Deductions, Net Pay, Payment Status pill (Paid/Pending), and a "View Payslip" action opening a formal glass payslip document preview with itemized earnings/deductions and net total highlighted.
```

**5.5 Staff Timetable**
```
Design an individual staff timetable view. Glass weekly grid similar to class timetable but centered on one teacher: rows = periods, columns = days, cells show Class-Section + Subject being taught, with free periods shown as empty glass cells with a subtle "Free" label. Top selector to switch between staff members.
```

---

## 6. Finance

**6.1 Fee Structure Setup**
```
Design a fee structure configuration screen. Glass card list grouped by Class, each showing fee heads (Tuition, Transport, Library, Exam, etc.) as line items with amount and frequency (Monthly/Quarterly/Annual) tags. "Add Fee Head" and "Create Structure" glass modals with dropdowns for class, fee category, amount input, due-date rule, and late-fee percentage.
```

**6.2 Fee Collection / Invoice**
```
Design a fee collection screen. Left glass panel: student search/select showing photo, name, class, and outstanding balance highlighted in rose. Right panel: itemized glass invoice showing fee heads, amounts, discounts field, total due, payment method selector (Cash/Card/Online glass pill toggle), "Collect Payment" gradient button. Include a printable glass receipt preview with transaction ID and QR code.
```

**6.3 Due / Pending Fees**
```
Design a pending fees dashboard. Top glass stat cards: Total Outstanding, Overdue Count, Collection Rate %. Main: glass table of students with dues, columns Name, Class, Amount Due, Due Date, Days Overdue (rose badge if overdue), and bulk actions "Send Reminder" (SMS/Email icon buttons) and "Export List".
```

**6.4 Expense Tracking**
```
Design an expense tracking screen. Top glass filter bar: category filter, date range, "Add Expense" gradient button opening a modal (category dropdown, vendor, amount, date, receipt upload, notes). Main: glass table/list of expenses with category icon, vendor, amount, date, approval status pill. Side glass summary card: total expenses this month with a category-wise donut chart.
```

**6.5 Financial Reports**
```
Design a financial reports dashboard. Top glass stat cards: Total Revenue, Total Expenses, Net Balance, Collection Efficiency %. Main charts in glass containers: income vs expense bar chart by month, fee-collection trend line chart, category-wise expense donut chart. Bottom: a glass table for detailed ledger view with export (PDF/Excel) buttons.
```

---

## 7. Communication

**7.1 Notice Board / Announcements**
```
Design a notice board screen. Top "Create Announcement" gradient button opening a glass modal (title, rich-text body, audience selector chips [All/Class/Staff/Parents], attachment, schedule date, priority toggle). Main feed: glass announcement cards with title, timestamp, priority badge (color-coded), short preview text, and pin icon for important notices.
```

**7.2 Messaging (SMS/Email/In-app)**
```
Design a messaging/broadcast composer screen. Left glass panel: channel tabs (In-App / SMS / Email), recipient selector (individual, class, role-based group chips with count). Right panel: message composer with subject (for email), rich-text/plain body, character-count for SMS, template dropdown, "Send" gradient button and "Schedule" option. Bottom: sent-history glass table with delivery status pills (Delivered/Failed/Pending).
```

**7.3 Parent-Teacher Chat**
```
Design a real-time chat interface. Left glass sidebar: conversation list with avatar, name, last message preview, unread badge. Right main panel: glass chat bubbles (sender messages right-aligned gradient bubbles, receiver left-aligned frosted bubbles), timestamp labels, attachment support icon, message input bar with emoji/attach/send glass icon buttons at bottom.
```

**7.4 Events / Calendar**
```
Design a school events calendar screen. Top glass toolbar: month/week/day view toggle, "Add Event" gradient button. Main: full glass calendar grid with color-coded event chips per day (Holiday/Exam/Meeting/Sports categorized by color), hover/click reveals event detail popover glass card with title, time, location, description, and RSVP option for relevant events.
```

---

## 8. Library

**8.1 Book Catalog**
```
Design a library catalog screen. Top glass search bar with filters (Genre, Author, Availability). Main: glass grid of book cards with cover thumbnail, title, author, availability status pill (Available/Issued), "View" button. "Add Book" gradient button opening a glass modal (title, author, ISBN, genre, copies count, cover upload).
```

**8.2 Issue / Return Books**
```
Design a book issue/return screen. Left glass panel: "Issue Book" form — scan/search book, select student/staff, due date auto-calculated, "Issue" gradient button. Right glass panel: "Return Book" form — scan/search issued book, auto-shows borrower and days overdue, fine auto-calculated if late, "Return" button. Bottom: glass table of currently issued books with borrower, issue date, due date, status pill.
```

**8.3 Library Fines**
```
Design a library fines management screen. Glass table listing students/staff with overdue books, columns: Borrower, Book Title, Days Overdue, Fine Amount (rose highlight), Payment Status pill. "Collect Fine" action opening a small glass modal with amount confirmation and payment method selector. Top summary glass card: Total Outstanding Fines, Collected This Month.
```

---

## 9. Transport

**9.1 Route Management**
```
Design a transport route management screen. Glass card list, one per route, showing route name, number of stops (mini map-pin icons), assigned vehicle, driver name, student count, and "Manage Stops" button. "Add Route" modal with route name, stop list builder (add/remove stops with order drag-handles), and estimated timing per stop.
```

**9.2 Vehicle Management**
```
Design a vehicle fleet management screen. Glass grid of vehicle cards with vehicle photo/icon, registration number, capacity, assigned route, driver name/contact, maintenance status pill (Active/Under Maintenance), and "View Details" button revealing a glass panel with insurance/permit expiry dates and maintenance history log.
```

**9.3 Student-Route Assignment**
```
Design a student-to-route assignment screen. Left glass panel: student search/filter by class. Right glass panel: route and stop selector dropdowns. Main: glass table showing assigned students with columns Name, Class, Route, Pickup Stop, Drop Stop, Monthly Fee, and bulk-assign action for multiple selected students.
```

---

## 10. Hostel (if applicable)

**10.1 Room Allocation**
```
Design a hostel room allocation screen. Left glass panel: hostel block/floor selector showing a visual grid of room glass tiles color-coded by occupancy (Empty/Partial/Full). Right panel: selected room detail card showing bed capacity, current occupants (avatar list), "Allocate Student" button opening a search-and-assign glass modal.
```

**10.2 Hostel Fee**
```
Design a hostel fee management screen, styled consistently with the Fee Collection module: glass table of hostel residents with columns Name, Room No, Fee Plan (monthly/term), Amount Due, Status pill (Paid/Due/Overdue), and "Collect Payment" action opening an itemized glass invoice modal (room rent, mess fee, other charges).
```

---

## 11. Administration

**11.1 User / Role Management**
```
Design a user & role management screen. Glass table of system users: Name, Role (Admin/Teacher/Student/Parent/Staff glass pill), Email, Status (Active/Suspended), last login, action icons (edit/deactivate). "Add User" modal with role selector and permission checkboxes grouped by module in a glass accordion (e.g. Students: View/Edit/Delete; Finance: View/Collect/Refund).
```

**11.2 Settings / Configuration**
```
Design a settings screen with a glass sidebar sub-nav (General, Academic Year, Notifications, Payment Gateway, SMS/Email Provider, Branding, Backup) and a main glass panel showing form fields relevant to the selected section — e.g. General: school name, logo upload, address, timezone, currency; Branding: color theme picker (glass swatches), logo/favicon upload preview.
```

**11.3 Reports & Analytics (overall)**
```
Design a school-wide analytics dashboard. Top row of glass KPI cards: Total Students, Total Staff, Fee Collection Rate, Overall Attendance %. Main: grid of glass chart cards — enrollment trend line chart, revenue vs expense bar chart, attendance heatmap, performance distribution donut — each with a small export icon. Filter bar at top for academic year/term selection.
```

**11.4 Backup / Data Export**
```
Design a backup & data export screen. Glass card showing last backup timestamp, backup frequency setting (toggle daily/weekly), "Run Backup Now" gradient button, and a history table of past backups with size, date, and download icon. Separate glass card for "Export Data" with module checkboxes (Students, Staff, Finance, Attendance) and format selector (CSV/Excel/PDF), "Export" gradient button.
```

---

## Tip for OpenCode handoff
After generating each screen in Stitch, export it and give OpenCode a prompt like:

```
Implement the attached Stitch design as a reusable React/Next.js component under /components/<module>/<ScreenName>.tsx.
Use Tailwind CSS matching the glassmorphism tokens already defined in our design system (backdrop-blur, translucent borders, gradient backgrounds).
Wire it to Supabase table `<table_name>` for data, and follow our existing auth/role-guard pattern for access control.
```
