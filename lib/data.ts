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
  address?: string;
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
  subject_id: string;
  exam_term: string;
  marks_obtained: number;
  max_marks: number;
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

const col = {
  students: () => collection(db!, "students"),
  classes: () => collection(db!, "classes"),
  subjects: () => collection(db!, "subjects"),
  marks: () => collection(db!, "marks"),
  attendance: () => collection(db!, "attendance"),
  payments: () => collection(db!, "payments"),
  staff: () => collection(db!, "staff"),
  leaves: () => collection(db!, "leave_requests"),
  notifications: () => collection(db!, "notifications"),
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
  await setDoc(ref, data);
  return ref.id;
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