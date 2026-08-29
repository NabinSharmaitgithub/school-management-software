// Seeder: signs in via Firebase Auth REST, then writes demo data via Firestore
// REST (rules allow writes for any authenticated user).
// Run: node scripts/seed.mjs  (reads .env.local)
import { readFileSync } from "node:fs";

const SEED_EMAIL = "admin@school.local";
const SEED_PASS = "admin123!";
// Separate staff/teacher login (also needs provisioning)
const TEACHER_EMAIL = "teacher@school.local";
const TEACHER_PASS = "teacher123!";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function authCall(path, email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/${path}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) throw new Error(JSON.stringify(data));
  return data;
}

async function ensureUser(email, password) {
  try {
    await authCall("accounts:signInWithPassword", email, password);
    return false;
  } catch {
    // Not created yet → create it
    await authCall("accounts:signUp", email, password).catch(() => {});
    return true;
  }
}

async function getToken() {
  await ensureUser(SEED_EMAIL, SEED_PASS);
  await ensureUser(TEACHER_EMAIL, TEACHER_PASS);
  return (await authCall("accounts:signInWithPassword", SEED_EMAIL, SEED_PASS)).idToken;
}

function fields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "number") out[k] = { integerValue: v };
    else if (typeof v === "boolean") out[k] = { booleanValue: v };
    else out[k] = { stringValue: String(v) };
  }
  return out;
}

async function writeDoc(token, collectionPath, docId, data) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collectionPath}?documentId=${docId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: fields(data) }),
  });
  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    throw new Error(`Write ${collectionPath}/${docId} failed (${res.status}): ${body}`);
  }
  // 409 = doc already exists → skip (keeps seeding idempotent)
}

const classes = [
  ["c7a", "Grade 7", "A"],
  ["c8a", "Grade 8", "A"],
  ["c9a", "Grade 9", "B"],
];

const students = [
  ["s_1", "Aarav Sharma", "S-047", "c7a", "Male", "Raj Sharma", "9841001001", "aarav@school.edu", "Kathmandu"],
  ["s_2", "Meera Joshi", "S-052", "c7a", "Female", "Kiran Joshi", "9841001002", "meera@school.edu", "Lalitpur"],
  ["s_3", "Rohan Thapa", "S-103", "c8a", "Male", "Bikash Thapa", "9841001003", "rohan@school.edu", "Pokhara"],
  ["s_4", "Anisha Rai", "S-204", "c9a", "Female", "Sunil Rai", "9841001004", "anisha@school.edu", "Biratnagar"],
];

const subjects = [
  ["subj_math", "Mathematics", "MAT-101", "Algebra & geometry"],
  ["subj_eng", "English", "ENG-101", "Language & literature"],
  ["subj_sci", "Science", "SCI-101", "Physics & biology"],
];

const marks = [
  ["m_1", "s_1", "subj_math", "Mid-term", 82, 100],
  ["m_2", "s_1", "subj_eng", "Mid-term", 71, 100],
  ["m_3", "s_2", "subj_math", "Mid-term", 95, 100],
  ["m_4", "s_3", "subj_sci", "Final", 66, 100],
  ["m_5", "s_4", "subj_eng", "Unit Test", 48, 50],
];

const payments = [
  ["p_1", "s_1", "Tuition fee — March", 8500, "Cash"],
  ["p_2", "s_2", "Tuition fee — March", 8500, "UPI"],
  ["p_3", "s_3", "Exam fee — Final", 1200, "Card"],
];

async function main() {
  const token = await getToken();
  const today = new Date().toISOString().slice(0, 10);

  for (const [id, name, section] of classes) {
    await writeDoc(token, "classes", id, { name, section });
  }

  for (const [id, name, roll, cls, gender, guardian, phone, email, address] of students) {
    await writeDoc(token, "students", id, {
      name, roll_number: roll, class_id: cls, gender, guardian, phone, email, address,
    });
    await writeDoc(token, "attendance", `${id}_${today}`, {
      class_id: cls, student_id: id, date: today,
      status: Math.random() > 0.15 ? "present" : "absent",
    });
  }

  for (const [id, name, code, desc] of subjects) {
    await writeDoc(token, "subjects", id, { name, code, description: desc });
  }

  for (const [id, sid, subj, term, obt, max] of marks) {
    await writeDoc(token, "marks", id, {
      student_id: sid, subject_id: subj, exam_term: term, marks_obtained: obt, max_marks: max,
    });
  }

  for (const [id, sid, desc, amt, method] of payments) {
    await writeDoc(token, "payments", id, {
      student_id: sid, description: desc, amount: amt, method, date: today,
    });
  }

  // Teacher role assignments: teacher@school.local is class teacher of Grade 7-A
  // and subject teacher for Mathematics (7-A) and Science (8-A).
  await writeDoc(token, "assignments", "ct_c7a", {
    type: "class_teacher", class_id: "c7a", email: TEACHER_EMAIL, name: "Teacher login",
  });
  for (const [classId, subjectId] of [
    ["c7a", "subj_math"],
    ["c8a", "subj_sci"],
  ]) {
    await writeDoc(token, "assignments", `st_${classId}_${subjectId}`, {
      type: "subject_teacher", class_id: classId, subject_id: subjectId,
      email: TEACHER_EMAIL, name: "Teacher login",
    });
  }

  console.log(
    "Seeded:", classes.length, "classes,", students.length, "students,",
    subjects.length, "subjects,", marks.length, "marks,", payments.length, "payments,"
    + " teacher assignments."
  );
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});