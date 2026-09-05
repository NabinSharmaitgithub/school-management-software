import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Student = {
  id: string;
  name: string;
  roll_number: string;
  class_id: string;
  className?: string;
  gender?: string;
  email?: string;
  phone?: string;
  guardian?: string;
  father_name?: string;
  mother_name?: string;
  dob?: string;
  address?: string;
  photo_url?: string;
  createdAt?: unknown;
};

export type Class = {
  id: string;
  name: string;
  section: string;
};

export type Subject = {
  id: string;
  name: string;
  code?: string;
  description?: string;
};

export type Mark = {
  id: string;
  student_id: string;
  class_id?: string;
  subject_id: string;
  exam_term: string;
  marks_obtained: number;
  max_marks: number;
  has_practical?: boolean;
  max_practical_marks?: number;
  practical_marks?: number;
};

export type BulkMarkStatus = "marked" | "absent" | "exempt";

export type BulkMarkEntry = {
  student_id: string;
  subject_id: string;
  class_id: string;
  section?: string;
  exam_term: string;
  academic_year: string;
  max_marks: number;
  marks_obtained?: number;
  has_practical?: boolean;
  max_practical_marks?: number;
  practical_marks?: number;
  percentage?: number;
  grade?: string;
  status: BulkMarkStatus;
  remarks?: string;
};

export type AttendanceEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  class_id: string;
  student_id: string;
  status: "present" | "absent" | "late";
};

export type Payment = {
  id: string;
  student_id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  method: string;
  invoice_id?: string;
  receipt_number?: string;
  transaction_ref?: string;
  recorded_by?: string;
};

export type FeeInvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";

export type FeeInvoice = {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string;
  class_name: string;
  academic_year: string;
  month: string; // "2024-10"
  fee_items: { name: string; amount: number }[];
  total: number; // sum of fee_items, before discount/late fee
  discount: number;
  late_fee: number;
  payable: number; // total - discount + late_fee
  paid: number; // sum of payments against this invoice
  due_date: string; // YYYY-MM-DD
  status: FeeInvoiceStatus;
};

export type Discount = {
  id: string;
  student_id: string;
  type: "PERCENT" | "FIXED";
  value: number;
  reason: string;
  approved_by: string;
  active: boolean;
};

export type LateFee = {
  grace_days: number;
  penalty_type: "PERCENT" | "FIXED";
  penalty_value: number;
};

export type UserRole = "Admin" | "Teacher" | "Student" | "Parent";

export type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
  student_id?: string;
};

export type Staff = {
  id: string;
  name: string;
  role: string; // designation e.g. "Teacher", "Administrator"
  department: string;
  email?: string;
  phone?: string;
  joined?: string; // YYYY-MM-DD
  status: "active" | "on_leave" | "inactive";
  photo_url?: string;
};

export type LeaveRequest = {
  id: string;
  staff_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason: string;
  status: "pending" | "approved" | "rejected";
};

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt?: unknown;
};

export type Assignment = {
  id: string;
  type: "class_teacher" | "subject_teacher";
  class_id: string;
  subject_id?: string;
  email: string;
  name?: string;
};

export type TeacherRoles = {
  /** Classes the user is class teacher of (roster + attendance access). */
  classIds: string[];
  /** Subjects teachable per class. Class teachers get every subject in their class. */
  subjectByClass: Record<string, string[]>;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre: string;
  copies: number;
};

export type Loan = {
  id: string;
  book_id: string;
  student_id: string;
  issued_date: string; // YYYY-MM-DD
  due_date: string; // YYYY-MM-DD
  returned_date?: string; // set when returned
  fine?: number; // computed at return or when fine collected, रु
  fine_paid?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "staff" | "parents" | "class";
  class_id?: string;
  priority: "high" | "normal" | "low";
  draft: boolean;
  author: string; // display name of the issuing office
  date: string; // YYYY-MM-DD publish date
  createdAt?: unknown;
};

export type Broadcast = {
  id: string;
  subject: string;
  body: string;
  channel: "inapp" | "sms" | "email";
  groups: string[]; // recipient group names
  count: number;
  status: "delivered" | "pending" | "failed";
  createdAt?: unknown;
};

export type ThreadMessage = {
  id?: string;
  text: string;
  from: string;
  at: string; // ISO timestamp
  mine: boolean;
};

export type Thread = {
  id: string;
  name: string;
  participants: string[];
  unread: number;
  online?: boolean;
  messages: ThreadMessage[];
};

export type HostelRoom = {
  id: string;
  block: "A" | "B" | "C";
  floor: number;
  room_number: string;
  capacity: number;
  occupants: string[]; // student ids
};

export type HostelFee = {
  id: string;
  student_id: string;
  room_id: string;
  fee_plan: string; // e.g. "Term (Fall)", "Monthly (Oct)", "Annual"
  rent: number;
  mess: number;
  laundry: number;
  due_date: string; // YYYY-MM-DD
  paid_date?: string; // set once collected
};

export type BusStop = {
  name: string;
  stop_time: string; // e.g. "8:00 AM"
};

export type Route = {
  id: string;
  name: string;
  bus_id?: string;
  driver_name?: string;
  capacity: number; // max students
  stops: BusStop[];
  status: "active" | "delayed";
};

export type RouteAssignment = {
  id: string;
  student_id: string;
  route_id?: string;
  pickup_stop?: string;
  drop_stop?: string;
  monthly_fee: number;
  status: "pending" | "draft" | "assigned" | "conflict";
};

export type VehicleService = {
  date: string; // YYYY-MM-DD
  type: string;
  cost: number;
};

export type Vehicle = {
  id: string;
  vehicle_no: string; // e.g. "BUS-42"
  plate: string;
  status: "active" | "maintenance";
  capacity_seats: number;
  route_id?: string;
  driver_name?: string;
  driver_phone?: string;
  insurance_expiry: string; // YYYY-MM-DD
  permit_expiry: string; // YYYY-MM-DD
  services: VehicleService[];
};

export type SchoolSettings = {
  id: string;
  school_name: string;
  school_address: string;
  timezone: string;
  currency: string;
  primary_color: string;
  fee_clearance_date: string; // "YYYY-MM-DD" cutoff for admit-card issuance; empty = unset
  logo_url: string; // Firebase Storage download URL for the school logo; empty = unset
};

export type FeeItem = {
  name: string;
  kind: string; // e.g. "Tuition Fee", "Transport Fee"
  amount: number;
  frequency: "Monthly" | "Quarterly" | "Annual";
};

export type FeeStructure = {
  id: string;
  class_id: string;
  name: string;
  academic_year: string;
  fees: FeeItem[];
};

export type Exam = {
  id: string;
  name: string; // e.g. "Mid-Term 2026"
  academic_year: string;
};

export type ExamSession = {
  id: string;
  exam_id: string;
  subject_id: string;
  class_ids: string[];
  date: string; // YYYY-MM-DD
  start: string; // "09:00"
  end: string; // "12:00"
  room?: string;
  invigilator?: string;
};

export type Payslip = {
  id: string;
  staff_id: string;
  staff_name: string;
  department: string;
  month: string; // "2024-10"
  basic: number;
  allowances: number;
  deductions: number;
  status: "paid" | "pending";
  payment_date?: string;
};

export type TimetableEntry = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher: string;
  day: string; // "Mon".."Sat"
  start: string; // "08:00"
  end: string; // "08:45"
  room?: string;
};

const col = {
  students: () => collection(db!, "students"),
  classes: () => collection(db!, "classes"),
  subjects: () => collection(db!, "subjects"),
  marks: () => collection(db!, "marks"),
  attendance: () => collection(db!, "attendance"),
  payments: () => collection(db!, "payments"),
  fee_invoices: () => collection(db!, "fee_invoices"),
  discounts: () => collection(db!, "discounts"),
  late_fees: () => collection(db!, "late_fees"),
  users: () => collection(db!, "users"),
  staff: () => collection(db!, "staff"),
  leaves: () => collection(db!, "leave_requests"),
  notifications: () => collection(db!, "notifications"),
  assignments: () => collection(db!, "assignments"),
  books: () => collection(db!, "books"),
  loans: () => collection(db!, "loans"),
  announcements: () => collection(db!, "announcements"),
  broadcasts: () => collection(db!, "broadcasts"),
  threads: () => collection(db!, "threads"),
  rooms: () => collection(db!, "rooms"),
  hostel_fees: () => collection(db!, "hostel_fees"),
  routes: () => collection(db!, "routes"),
  route_assignments: () => collection(db!, "route_assignments"),
  vehicles: () => collection(db!, "vehicles"),
  fee_structures: () => collection(db!, "fee_structures"),
  exams: () => collection(db!, "exams"),
  exam_sessions: () => collection(db!, "exam_sessions"),
  payslips: () => collection(db!, "payslips"),
  timetable: () => collection(db!, "timetable"),
};

/** List all docs in a collection, ordered by name when available. */
export async function listDocs<T>(c: ReturnType<typeof col[keyof typeof col]>): Promise<
  (T & { id: string })[]
> {
  const snap = await getDocs(c);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

export async function listStudents(): Promise<Student[]> {
  const q = query(col.students(), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Student), id: d.id }));
}

export async function studentsInClass(classId: string): Promise<Student[]> {
  const q = query(col.students(), where("class_id", "==", classId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as Student), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listClasses(): Promise<Class[]> {
  const q = query(col.classes(), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Class), id: d.id }));
}

export async function listSubjects(): Promise<Subject[]> {
  const q = query(col.subjects(), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Subject), id: d.id }));
}

export async function getStudent(id: string): Promise<Student | null> {
  const snap = await getDoc(doc(db!, "students", id));
  return snap.exists() ? ({ ...(snap.data() as Student), id: snap.id } as Student) : null;
}

export async function addStudent(data: Omit<Student, "id">) {
  const ref = doc(col.students());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateStudent(id: string, data: Partial<Student>) {
  await updateDoc(doc(db!, "students", id), data);
}

export async function deleteStudent(id: string) {
  await deleteDoc(doc(db!, "students", id));
}

export async function addClass(data: Omit<Class, "id">) {
  const ref = doc(col.classes());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateClass(id: string, data: Partial<Class>) {
  await updateDoc(doc(db!, "classes", id), data);
}

export async function deleteClass(id: string) {
  await deleteDoc(doc(db!, "classes", id));
}

export async function addSubject(data: Omit<Subject, "id">) {
  const ref = doc(col.subjects());
  await setDoc(ref, data);
  return ref.id;
}

export async function updateSubject(id: string, data: Partial<Subject>) {
  await updateDoc(doc(db!, "subjects", id), data);
}

export async function deleteSubject(id: string) {
  await deleteDoc(doc(db!, "subjects", id));
}

/** Convenience: reference classes by id inside students to resolve names. */
export async function classNames(): Promise<Record<string, string>> {
  const classes = await listClasses();
  return Object.fromEntries(classes.map((c) => [c.id, `${c.name} ${c.section}`.trim()]));
}

/** Attendance records for one class on one date. Keyed by student_id. */
export async function attendanceFor(
  classId: string,
  date: string
): Promise<Record<string, AttendanceEntry["status"]>> {
  const q = query(
    col.attendance(),
    where("class_id", "==", classId),
    where("date", "==", date)
  );
  const snap = await getDocs(q);
  const out: Record<string, AttendanceEntry["status"]> = {};
  snap.docs.forEach((d) => {
    const a = d.data() as AttendanceEntry;
    out[a.student_id] = a.status;
  });
  return out;
}

/** Attendance records since a date (inclusive). */
export async function attendanceSince(since: string): Promise<AttendanceEntry[]> {
  const q = query(col.attendance(), where("date", ">=", since), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as AttendanceEntry), id: d.id }));
}

/** Upsert a student's status for a date. Doc id = `${studentId}_${date}` for idempotency. */
export async function setAttendance(
  classId: string,
  studentId: string,
  date: string,
  status: AttendanceEntry["status"]
) {
  const ref = doc(col.attendance(), `${studentId}_${date}`);
  await setDoc(ref, { class_id: classId, student_id: studentId, date, status });
}

export async function listPayments(): Promise<Payment[]> {
  const q = query(col.payments(), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Payment), id: d.id }));
}

export async function addPayment(data: Omit<Payment, "id">) {
  const ref = doc(col.payments());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deletePayment(id: string) {
  await deleteDoc(doc(db!, "payments", id));
}

/** --- Fee & Billing --- */

export async function listInvoices(): Promise<FeeInvoice[]> {
  const snap = await getDocs(col.fee_invoices());
  return snap.docs.map((d) => ({ ...(d.data() as FeeInvoice), id: d.id }));
}

async function getDiscount(studentId: string): Promise<Discount | null> {
  const snap = await getDocs(col.discounts());
  const list = snap.docs.map((d) => ({ ...(d.data() as Discount), id: d.id }));
  const act = list.find((x) => x.student_id === studentId && x.active);
  return act ?? null;
}

export async function listDiscounts(): Promise<Discount[]> {
  const snap = await getDocs(col.discounts());
  return snap.docs.map((d) => ({ ...(d.data() as Discount), id: d.id }));
}

export async function addDiscount(data: Omit<Discount, "id">) {
  const ref = doc(col.discounts());
  await setDoc(ref, { ...data, active: data.active ?? true });
  return ref.id;
}

async function getLateFee(): Promise<LateFee> {
  const ref = doc(db!, "late_fees", "config");
  const snap = await getDoc(ref);
  if (!snap.exists()) return { grace_days: 0, penalty_type: "FIXED", penalty_value: 0 };
  return snap.data() as LateFee;
}

export async function setLateFee(data: LateFee) {
  await setDoc(doc(db!, "late_fees", "config"), data);
}

/** Default due date = 10th of the invoice's month. */
function dueDateFor(month: string): string {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 10).toISOString().slice(0, 10);
}

/** Hydrate an invoice with late fee + OVERDUE derived at read time. */
function hydrate(inv: FeeInvoice, today: string, lf: LateFee): FeeInvoice {
  let lateFee = inv.late_fee;
  let status = inv.status;
  const due = new Date(inv.due_date);
  due.setDate(due.getDate() + (lf.grace_days || 0));
  if (inv.status !== "PAID" && today > due.toISOString().slice(0, 10)) {
    status = "OVERDUE";
    const base = inv.total - inv.discount;
    lateFee = lf.penalty_type === "PERCENT" ? Math.round((base * (lf.penalty_value || 0)) / 100) : lf.penalty_value || 0;
  }
  return { ...inv, late_fee: lateFee, payable: inv.total - inv.discount + lateFee, status };
}

/** Generate monthly fee invoices from the class fee structure (+ discounts). Pass studentId for one student. */
export async function generateInvoices(classId: string, month: string, studentId?: string): Promise<number> {
  const [cls, fees, students, invs, discounts] = await Promise.all([
    listClasses(),
    listFeeStructures(),
    studentId ? (await listStudents()).filter((s) => s.id === studentId) : studentsInClass(classId),
    listInvoices(),
    listDiscounts(),
  ]);
  const klass = cls.find((c) => c.id === classId);
  const struct = fees.find((f) => f.class_id === classId);
  if (!struct || !struct.fees.length) return 0;
  const have = new Set(invs.filter((i) => i.month === month && i.student_id === (studentId ?? "")).map((i) => i.student_id));
  const classDis = discounts.filter((d) => d.active);
  let created = 0;
  for (const s of students) {
    if (have.has(s.id)) continue;
    const total = struct.fees.reduce((sum, f) => sum + f.amount, 0);
    const dis = classDis.find((d) => d.student_id === s.id);
    const discount = dis ? (dis.type === "PERCENT" ? Math.round((total * dis.value) / 100) : Math.min(dis.value, total)) : 0;
    await setDoc(doc(col.fee_invoices()), {
      student_id: s.id,
      student_name: s.name,
      class_id: classId,
      class_name: klass ? `${klass.name}${klass.section ? ` - ${klass.section}` : ""}` : "",
      academic_year: struct.academic_year,
      month,
      fee_items: struct.fees.map((f) => ({ name: f.name, amount: f.amount })),
      total,
      discount,
      late_fee: 0,
      payable: total - discount,
      paid: 0,
      due_date: dueDateFor(month),
      status: "PENDING",
    });
    created++;
  }
  return created;
}

/** List invoices, optionally filtered, with OVERDUE/late-fee derived from today. */
export async function listInvoicesHydrated(month?: string, classId?: string, status?: string): Promise<FeeInvoice[]> {
  const [invs, lf] = await Promise.all([listInvoices(), getLateFee()]);
  const today = new Date().toISOString().slice(0, 10);
  return invs
    .map((i) => hydrate(i, today, lf))
    .filter((i) => (!month || i.month === month) && (!classId || i.class_id === classId) && (!status || i.status === status))
    .sort((a, b) => a.student_name.localeCompare(b.student_name));
}

/** Record a manual payment against an invoice; updates paid/status + generates receipt number. */
export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method: string,
  date: string,
  transactionRef?: string,
  recordedBy?: string
): Promise<string> {
  const inv = await listInvoices();
  const target = inv.find((i) => i.id === invoiceId);
  if (!target) throw new Error("Invoice not found.");
  const receipt = `RCT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  await addPayment({
    student_id: target.student_id,
    description: `Fee payment · ${target.month} · ${target.student_name}`,
    amount,
    date,
    method,
    invoice_id: invoiceId,
    receipt_number: receipt,
    transaction_ref: transactionRef,
    recorded_by: recordedBy,
  });
  const paid = (target.paid || 0) + amount;
  const status = paid >= target.total - target.discount ? "PAID" : "PARTIAL";
  await updateDoc(doc(db!, "fee_invoices", invoiceId), { paid, status });
  return receipt;
}

export async function deleteInvoice(id: string) {
  await deleteDoc(doc(db!, "fee_invoices", id));
}

/** --- User ↔ student linking (for the read-only My Fees portal) --- */

// Upsert a users/{email} record on sign-in so admins can link a student later.
export async function ensureUser(email: string, role: UserRole = "Parent") {
  const ref = doc(col.users(), email);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { email, role, createdAt: serverTimestamp() });
  }
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const snap = await getDoc(doc(col.users(), email));
  return snap.exists() ? ({ ...(snap.data() as UserRecord), id: email }) : null;
}

export async function listUsers(): Promise<UserRecord[]> {
  const snap = await getDocs(col.users());
  return snap.docs.map((d) => ({ ...(d.data() as UserRecord), id: d.id }));
}

export async function setUserStudent(email: string, studentId: string) {
  await updateDoc(doc(col.users(), email), { student_id: studentId });
}


/** Resolve student names to a map of id → name for displays. */
export async function studentNames(): Promise<Record<string, string>> {
  const students = await listStudents();
  return Object.fromEntries(students.map((s) => [s.id, s.name]));
}

export async function listMarks(): Promise<Mark[]> {
  const q = query(col.marks(), orderBy("student_id"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Mark), id: d.id }));
}

export async function addMark(data: Omit<Mark, "id">) {
  const ref = doc(col.marks());
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
  );
  await setDoc(ref, clean);
  return ref.id;
}

/** Upsert marks for a whole roster. Deterministic doc id per student+subject+term+year. */
export async function bulkSetMarks(entries: BulkMarkEntry[]) {
  await Promise.all(
    entries.map((e) => {
      const id = `${e.student_id}_${e.subject_id}_${e.exam_term}_${e.academic_year}`
        .replace(/[^A-Za-z0-9._-]/g, "_");
      const clean = Object.fromEntries(
        Object.entries(e).filter(([, v]) => v !== undefined && v !== null)
      );
      return setDoc(doc(col.marks(), id), clean);
    })
  );
}

export async function deleteMark(id: string) {
  await deleteDoc(doc(db!, "marks", id));
}

/** Resolve subject names to a map of id → name. */
export async function subjectNames(): Promise<Record<string, string>> {
  const subjects = await listSubjects();
  return Object.fromEntries(subjects.map((s) => [s.id, s.name]));
}

export async function listStaff(): Promise<Staff[]> {
  const q = query(col.staff(), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Staff), id: d.id }));
}

export async function getStaff(id: string): Promise<Staff | null> {
  const snap = await getDoc(doc(db!, "staff", id));
  return snap.exists() ? ({ ...(snap.data() as Staff), id: snap.id } as Staff) : null;
}

export async function addStaff(data: Omit<Staff, "id">) {
  const ref = doc(col.staff());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateStaff(id: string, data: Partial<Staff>) {
  await updateDoc(doc(db!, "staff", id), data);
}

export async function deleteStaff(id: string) {
  await deleteDoc(doc(db!, "staff", id));
}

/** Resolve staff names to a map of id → name. */
export async function staffNames(): Promise<Record<string, string>> {
  const staff = await listStaff();
  return Object.fromEntries(staff.map((s) => [s.id, s.name]));
}

export async function listLeaves(): Promise<LeaveRequest[]> {
  const q = query(col.leaves(), orderBy("start_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as LeaveRequest), id: d.id }));
}

export async function addLeave(data: Omit<LeaveRequest, "id">) {
  const ref = doc(col.leaves());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateLeave(id: string, data: Partial<LeaveRequest>) {
  await updateDoc(doc(db!, "leave_requests", id), data);
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const snap = await getDocs(col.announcements());
  const items = snap.docs.map((d) => ({ ...(d.data() as Announcement), id: d.id }));
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addAnnouncement(data: Omit<Announcement, "id">) {
  const ref = doc(col.announcements());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db!, "announcements", id));
}

export async function listBroadcasts(): Promise<Broadcast[]> {
  const snap = await getDocs(col.broadcasts());
  const items = snap.docs.map((d) => ({ ...(d.data() as Broadcast), id: d.id }));
  const ts = (b: Broadcast) => {
    const t = b.createdAt;
    if (t && typeof t === "object" && "seconds" in t) return Number((t as { seconds: number }).seconds);
    if (typeof t === "string") return new Date(t).getTime() / 1000;
    return 0;
  };
  return items.sort((a, b) => ts(b) - ts(a));
}

export async function addBroadcast(data: Omit<Broadcast, "id">) {
  const ref = doc(col.broadcasts());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

/** List messaging threads with their stored messages, most recently active first. */
export async function listThreads(): Promise<Thread[]> {
  const snap = await getDocs(col.threads());
  const items = snap.docs.map((d) => {
    const t = d.data() as Thread;
    return { ...t, id: d.id, messages: t.messages ?? [] };
  });
  return items.sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.at ?? "";
    const lb = b.messages[b.messages.length - 1]?.at ?? "";
    return lb.localeCompare(la);
  });
}

/** Append a message to a thread. */
export async function sendThreadMessage(threadId: string, message: Omit<ThreadMessage, "id">) {
  const ref = doc(db!, "threads", threadId);
  const snap = await getDoc(ref);
  const cur = (snap.data() as Thread | undefined)?.messages ?? [];
  await updateDoc(ref, { messages: [...cur, message] });
}

/** Find a thread by conversation name, creating it if missing. Returns the thread id. */
export async function ensureThread(name: string): Promise<string> {
  const snap = await getDocs(col.threads());
  const hit = snap.docs.find((d) => (d.data() as Thread).name === name);
  if (hit) return hit.id;
  const ref = doc(col.threads());
  await setDoc(ref, { name, participants: [name], unread: 0, online: false, messages: [] });
  return ref.id;
}

/** All hostel rooms, by block then room number. */
export async function listRooms(): Promise<HostelRoom[]> {
  const snap = await getDocs(col.rooms());
  const items = snap.docs.map((d) => ({
    ...(d.data() as HostelRoom),
    id: d.id,
    occupants: (d.data() as HostelRoom).occupants ?? [],
  }));
  return items.sort((a, b) =>
    a.block === b.block
      ? a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
      : a.block.localeCompare(b.block)
  );
}

export async function addRoom(data: Omit<HostelRoom, "id" | "occupants">) {
  const ref = doc(col.rooms());
  await setDoc(ref, { ...data, occupants: [] });
  return ref.id;
}

export async function deleteRoom(id: string) {
  await deleteDoc(doc(db!, "rooms", id));
}

/** Assign a student to a free bed in a room. */
export async function allocateBed(roomId: string, studentId: string) {
  const ref = doc(db!, "rooms", roomId);
  const snap = await getDoc(ref);
  const cur = (snap.data() as HostelRoom | undefined)?.occupants ?? [];
  if ((cur.length ?? 0) >= (snap.data() as HostelRoom)?.capacity) {
    throw new Error("That room has no free beds.");
  }
  await updateDoc(ref, { occupants: [...cur, studentId] });
}

export async function removeOccupant(roomId: string, studentId: string) {
  const ref = doc(db!, "rooms", roomId);
  const snap = await getDoc(ref);
  const cur = (snap.data() as HostelRoom | undefined)?.occupants ?? [];
  await updateDoc(ref, { occupants: cur.filter((s) => s !== studentId) });
}

/** All hostel fee entries. */
export async function listHostelFees(): Promise<HostelFee[]> {
  const snap = await getDocs(col.hostel_fees());
  return snap.docs.map((d) => ({ ...(d.data() as HostelFee), id: d.id }));
}

export async function addHostelFee(data: Omit<HostelFee, "id">) {
  const ref = doc(col.hostel_fees());
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteHostelFee(id: string) {
  await deleteDoc(doc(db!, "hostel_fees", id));
}

/** Mark a hostel fee as collected and record it in the payments ledger. */
export async function collectHostelFee(id: string, method: string) {
  const ref = doc(db!, "hostel_fees", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Fee record not found.");
  const fee = snap.data() as HostelFee;
  const amount = fee.rent + fee.mess + fee.laundry;
  await updateDoc(ref, { paid_date: new Date().toISOString().slice(0, 10) });
  await addPayment({
    student_id: fee.student_id,
    description: `Hostel fee — ${fee.fee_plan}`,
    amount,
    date: new Date().toISOString().slice(0, 10),
    method,
  });
}

/** All transport routes. */
export async function listRoutes(): Promise<Route[]> {
  const snap = await getDocs(col.routes());
  return snap.docs.map((d) => {
    const r = d.data() as Route;
    return { ...r, id: d.id, stops: r.stops ?? [] };
  });
}

export async function addRoute(data: Omit<Route, "id">) {
  const ref = doc(col.routes());
  await setDoc(ref, { ...data, stops: data.stops ?? [] });
  return ref.id;
}

export async function deleteRoute(id: string) {
  await deleteDoc(doc(db!, "routes", id));
}

/** All route assignments (bus ridership per student). */
export async function listRouteAssignments(): Promise<RouteAssignment[]> {
  const snap = await getDocs(col.route_assignments());
  return snap.docs.map((d) => ({ ...(d.data() as RouteAssignment), id: d.id }));
}

/** Pick a route + stops for one student's transport record. */
export async function updateAssignment(
  id: string,
  data: Partial<Pick<RouteAssignment, "route_id" | "pickup_stop" | "drop_stop" | "monthly_fee" | "status">>
) {
  await updateDoc(doc(db!, "route_assignments", id), data);
}

export async function addAssignment(data: Omit<RouteAssignment, "id">) {
  const ref = doc(col.route_assignments());
  await setDoc(ref, data);
  return ref.id;
}

export async function deleteAssignment(id: string) {
  await deleteDoc(doc(db!, "route_assignments", id));
}

/** All transport vehicles. */
export async function listVehicles(): Promise<Vehicle[]> {
  const snap = await getDocs(col.vehicles());
  return snap.docs.map((d) => {
    const v = d.data() as Vehicle;
    return { ...v, id: d.id, services: v.services ?? [] };
  });
}

export async function addVehicle(data: Omit<Vehicle, "id" | "services">) {
  const ref = doc(col.vehicles());
  await setDoc(ref, { ...data, services: [] });
  return ref.id;
}

export async function deleteVehicle(id: string) {
  await deleteDoc(doc(db!, "vehicles", id));
}

/** Append a maintenance-log entry to a vehicle's service history. */
export async function logService(vehicleId: string, service: VehicleService) {
  const ref = doc(db!, "vehicles", vehicleId);
  const snap = await getDoc(ref);
  const cur = (snap.data() as Vehicle | undefined)?.services ?? [];
  await updateDoc(ref, { services: [...cur, service] });
}

const SETTINGS_DEFAULTS: Omit<SchoolSettings, "id"> = {
  school_name: "Greenwood International School",
  school_address: "123 Education Boulevard, Knowledge City",
  timezone: "(GMT+05:30) India Standard Time",
  currency: "NPR (रु)",
  primary_color: "#6366F1",
  fee_clearance_date: "",
  logo_url: "",
};

/** School-wide profile + branding settings. */
export async function getSchoolSettings(): Promise<SchoolSettings> {
  const snap = await getDoc(doc(db!, "settings", "school"));
  if (!snap.exists()) return { id: "school", ...SETTINGS_DEFAULTS };
  return { id: "school", ...SETTINGS_DEFAULTS, ...(snap.data() as Partial<SchoolSettings>) };
}

export async function updateSchoolSettings(data: Partial<SchoolSettings>) {
  await setDoc(doc(db!, "settings", "school"), data, { merge: true });
}

/** Upload to Cloudinary (signed via server route) and return the secure URL. */
async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Upload failed.");
  }
  const { cloudName, apiKey, timestamp, signature, public_id } = await res.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("public_id", public_id);
  form.append("folder", folder);

  const up = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  if (!up.ok) {
    const text = await up.text().catch(() => "");
    throw new Error(text || "Upload failed.");
  }
  const data = await up.json();
  return data.secure_url as string;
}

/** Upload the school logo and persist its URL in settings. */
export async function uploadSchoolLogo(file: File): Promise<string> {
  const url = await uploadToCloudinary(file, "settings/logo"); // ponytail: newest-URL trick; point all readers at settings.logo_url so old blobs can be GC'd later
  await updateSchoolSettings({ logo_url: url });
  return url;
}

/** Upload a student profile photo and return its URL (caller stores it on the doc). */
export async function uploadStudentPhoto(file: File): Promise<string> {
  return uploadToCloudinary(file, "photos/students");
}

/** Upload a staff profile photo and return its URL (caller stores it on the doc). */
export async function uploadStaffPhoto(file: File): Promise<string> {
  return uploadToCloudinary(file, "photos/staff");
}

/** Fee structures (templates applied per class / academic year). */
export async function listFeeStructures(): Promise<FeeStructure[]> {
  const snap = await getDocs(col.fee_structures());
  return snap.docs.map((d) => {
    const x = d.data() as FeeStructure;
    return { ...x, id: d.id, fees: x.fees ?? [] };
  });
}

export async function addFeeStructure(data: Omit<FeeStructure, "id">) {
  const ref = doc(col.fee_structures());
  await setDoc(ref, { ...data, fees: data.fees ?? [] });
  return ref.id;
}

export async function updateFeeStructure(id: string, data: Partial<Omit<FeeStructure, "id">>) {
  await updateDoc(doc(db!, "fee_structures", id), data);
}

export async function deleteFeeStructure(id: string) {
  await deleteDoc(doc(db!, "fee_structures", id));
}

/** All attendance records (for reports/analytics). */
export async function listAttendance(): Promise<AttendanceEntry[]> {
  const snap = await getDocs(col.attendance());
  return snap.docs.map((d) => ({ ...(d.data() as AttendanceEntry), id: d.id }));
}

/** Exam definitions (selector) and their scheduled sessions. */
export async function listExams(): Promise<Exam[]> {
  const snap = await getDocs(col.exams());
  return snap.docs.map((d) => ({ ...(d.data() as Exam), id: d.id }));
}

export async function addExam(data: Omit<Exam, "id">) {
  const ref = doc(col.exams());
  await setDoc(ref, data);
  return ref.id;
}

export async function listExamSessions(): Promise<ExamSession[]> {
  const snap = await getDocs(col.exam_sessions());
  return snap.docs.map((d) => ({ ...(d.data() as ExamSession), id: d.id }));
}

export async function addExamSession(data: Omit<ExamSession, "id">) {
  const ref = doc(col.exam_sessions());
  const clean: Record<string, unknown> = { ...data, class_ids: data.class_ids ?? [] };
  Object.keys(clean).forEach((k) => clean[k] === undefined && delete clean[k]);
  await setDoc(ref, clean);
  return ref.id;
}

export async function updateExamSession(id: string, data: Partial<ExamSession>) {
  await updateDoc(doc(db!, "exam_sessions", id), data);
}

export async function deleteExamSession(id: string) {
  await deleteDoc(doc(db!, "exam_sessions", id));
}

/** Payroll: monthly payslips per staff member. */
export async function getPayslips(): Promise<Payslip[]> {
  const snap = await getDocs(col.payslips());
  return snap.docs.map((d) => ({ ...(d.data() as Payslip), id: d.id }));
}

/** Create a pending payslip for every active staff member without one in `month`. */
export async function generatePayroll(month: string): Promise<number> {
  const staff = await listStaff();
  const slips = await getPayslips();
  const have = new Set(slips.filter((p) => p.month === month).map((p) => p.staff_id));
  let created = 0;
  for (const s of staff) {
    if (have.has(s.id) || s.status !== "active") continue;
    await setDoc(doc(col.payslips()), {
      staff_id: s.id,
      staff_name: s.name,
      department: s.department,
      month,
      basic: 45000,
      allowances: 8500,
      deductions: 5200,
      status: "pending",
    });
    created++;
  }
  return created;
}

export async function updatePayslipStatus(id: string, status: Payslip["status"]) {
  await updateDoc(doc(db!, "payslips", id), {
    status,
    payment_date: status === "paid" ? new Date().toISOString().slice(0, 10) : deleteField(),
  });
}

export async function updatePayslipAmounts(id: string, basic: number, allowances: number, deductions: number) {
  await updateDoc(doc(db!, "payslips", id), { basic, allowances, deductions });
}

/** Weekly timetable: one entry per class.slot (period). */
export async function listTimetable(): Promise<TimetableEntry[]> {
  const snap = await getDocs(col.timetable());
  return snap.docs.map((d) => ({ ...(d.data() as TimetableEntry), id: d.id }));
}

export async function addTimetableEntry(data: Omit<TimetableEntry, "id">) {
  const ref = doc(col.timetable());
  await setDoc(ref, { ...data, room: data.room ?? "" });
  return ref.id;
}

export async function updateTimetableEntry(id: string, data: Partial<Omit<TimetableEntry, "id">>) {
  await updateDoc(doc(db!, "timetable", id), data);
}

export async function deleteTimetableEntry(id: string) {
  await deleteDoc(doc(db!, "timetable", id));
}

/** Timetable layout config: working days + ordered slots (periods and tiffins). */
export type TimetableSlot = {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  kind: "period" | "tiffin";
};

export type TimetableConfig = {
  days: string[]; // e.g. ["Mon","Tue","Wed","Thu","Fri","Sat"]
  slots: TimetableSlot[];
};

export const TIMETABLE_DEFAULTS: TimetableConfig = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  slots: [
    { start: "08:00", end: "08:45", kind: "period" },
    { start: "09:00", end: "09:45", kind: "period" },
    { start: "10:00", end: "10:45", kind: "period" },
    { start: "11:00", end: "11:30", kind: "tiffin" },
    { start: "11:30", end: "12:15", kind: "period" },
    { start: "13:00", end: "13:45", kind: "period" },
  ],
};

export async function getTimetableConfig(): Promise<TimetableConfig> {
  const snap = await getDoc(doc(db!, "settings", "timetable"));
  if (!snap.exists()) return TIMETABLE_DEFAULTS;
  const d = snap.data() as Partial<TimetableConfig>;
  return {
    days: Array.isArray(d.days) && d.days.length ? d.days : TIMETABLE_DEFAULTS.days,
    slots: Array.isArray(d.slots) && d.slots.length ? d.slots : TIMETABLE_DEFAULTS.slots,
  };
}

export async function saveTimetableConfig(cfg: TimetableConfig) {
  await setDoc(doc(db!, "settings", "timetable"), cfg);
}

/** List all books in the catalog, ordered by title. */
export async function listBooks(): Promise<Book[]> {
  const q = query(col.books(), orderBy("title"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Book), id: d.id }));
}

export async function addBook(data: Omit<Book, "id">) {
  const ref = doc(col.books());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function deleteBook(id: string) {
  await deleteDoc(doc(db!, "books", id));
}

/** All loans ever, newest first. Fill in book/student names via join maps. */
export async function listLoans(): Promise<Loan[]> {
  const q = query(col.loans(), orderBy("issued_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Loan), id: d.id }));
}

/** Active (not returned) loans. Filtered client-side to avoid a composite Firestore index. */
export async function activeLoans(): Promise<Loan[]> {
  const snap = await getDocs(col.loans());
  return snap.docs
    .map((d) => ({ ...(d.data() as Loan), id: d.id }))
    .filter((l) => !l.returned_date)
    .sort((a, b) => b.issued_date.localeCompare(a.issued_date));
}

/** Issue a book to a student. Duplicate active loan of the same book is rejected in UI. */
export async function issueBook(
  bookId: string,
  studentId: string,
  issuedDate: string,
  dueDate: string
) {
  const ref = doc(col.loans());
  await setDoc(ref, {
    book_id: bookId,
    student_id: studentId,
    issued_date: issuedDate,
    due_date: dueDate,
    returned_date: null,
  });
  return ref.id;
}

/** Return a loan: set the return date and any overdue fine (रु). */
export async function returnLoan(
  id: string,
  returnDate: string,
  fine: number,
  finePaid: boolean
) {
  await updateDoc(doc(db!, "loans", id), {
    returned_date: returnDate,
    fine,
    fine_paid: finePaid,
  });
}

/** Record collection of an overdue fine without returning the book. */
export async function collectLoanFine(id: string, fine: number) {
  await updateDoc(doc(db!, "loans", id), { fine, fine_paid: true });
}

export async function listNotifications(): Promise<NotificationItem[]> {
  const snap = await getDocs(col.notifications());
  const items = snap.docs.map((d) => ({ ...(d.data() as NotificationItem), id: d.id }));
  const ts = (n: NotificationItem) =>
    n.createdAt && typeof n.createdAt === "object" && "seconds" in n.createdAt
      ? Number((n.createdAt as { seconds: number }).seconds)
      : 0;
  return items.sort((a, b) => ts(b) - ts(a));
}

export async function addNotification(data: Omit<NotificationItem, "id">) {
  const ref = doc(col.notifications());
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function markAllNotificationsRead() {
  const items = await listNotifications();
  await Promise.all(
    items.filter((n) => !n.read).map((n) => updateDoc(doc(db!, "notifications", n.id), { read: true }))
  );
}

export async function listAssignments(): Promise<Assignment[]> {
  const snap = await getDocs(col.assignments());
  return snap.docs.map((d) => ({ ...(d.data() as Assignment), id: d.id }));
}

/** One class teacher per class. Reassigning (or empty email to unassign) overwrites the doc. */
export async function assignClassTeacher(classId: string, email: string, name?: string) {
  const id = `ct_${classId}`;
  if (!email) return deleteDoc(doc(col.assignments(), id));
  await setDoc(doc(col.assignments(), id), {
    type: "class_teacher",
    class_id: classId,
    email,
    name: name || email,
  });
}

/** Subject teacher per (class, subject). Reassigning (or empty email to unassign) overwrites. */
export async function assignSubjectTeacher(
  classId: string,
  subjectId: string,
  email: string,
  name?: string
) {
  const id = `st_${classId}_${subjectId}`;
  if (!email) return deleteDoc(doc(col.assignments(), id));
  await setDoc(doc(col.assignments(), id), {
    type: "subject_teacher",
    class_id: classId,
    subject_id: subjectId,
    email,
    name: name || email,
  });
}

export async function unassignAssignment(id: string) {
  await deleteDoc(doc(col.assignments(), id));
}

export async function assignmentsFor(email: string): Promise<Assignment[]> {
  const q = query(col.assignments(), where("email", "==", email));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Assignment), id: d.id }));
}

/**
 * Resolve a teacher's access from their assignments.
 * Class teachers manage the whole class (marks for every subject), so their class
 * gets every subject listed in `allSubjects`.
 */
export async function teacherRoles(
  email: string,
  allSubjects: Subject[] = []
): Promise<TeacherRoles> {
  const all = await assignmentsFor(email);
  const classIds: string[] = [];
  const subjectByClass: Record<string, string[]> = {};
  for (const a of all) {
    if (a.type === "class_teacher") {
      if (!classIds.includes(a.class_id)) classIds.push(a.class_id);
      subjectByClass[a.class_id] = allSubjects.map((s) => s.id) ?? [];
    } else if (a.type === "subject_teacher" && a.subject_id) {
      if (!subjectByClass[a.class_id]) subjectByClass[a.class_id] = [];
      if (!subjectByClass[a.class_id].includes(a.subject_id)) {
        subjectByClass[a.class_id].push(a.subject_id);
      }
    }
  }
  return { classIds, subjectByClass };
}