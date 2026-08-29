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
    else if (Array.isArray(v)) {
      out[k] = {
        arrayValue: {
          values: v.map((item) =>
            item && typeof item === "object"
              ? { mapValue: { fields: fields(item) } }
              : typeof item === "number"
                ? { integerValue: item }
                : typeof item === "boolean"
                  ? { booleanValue: item }
                  : { stringValue: String(item) }
          ),
        },
      };
    } else out[k] = { stringValue: String(v) };
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

const books = [
  ["b_gatsby", "The Great Gatsby", "F. Scott Fitzgerald", "978-0-7432-7356-5", "Fiction", 3],
  ["b_mockingbird", "To Kill a Mockingbird", "Harper Lee", "978-0-06-112008-4", "Fiction", 2],
  ["b_calculus", "Advanced Calculus", "James Stewart", "978-0-534-39365-2", "Science", 1],
  ["b_1984", "1984", "George Orwell", "978-0-451-52493-5", "Science Fiction", 2],
  ["b_history", "A History of Modern India", "Bipan Chandra", "978-0-14-345681-4", "History", 2],
];

const loans = [
  ["l_1", "b_gatsby", "s_1"],
  ["l_2", "b_calculus", "s_3"],
];

const announcements = [
  [
    "a_emergency",
    "Emergency Campus Closure Due to Severe Weather",
    "All students and staff: the campus will be closed today due to expected severe weather. All in-person classes are canceled. Online sessions may proceed at the discretion of the instructor.",
    "all", null, "high", false, "Principal's Office",
  ],
  [
    "a_registration",
    "Fall Semester Registration Opens Next Week",
    "Registration for the upcoming semester will open on Monday at 8:00 AM. Please ensure all outstanding fees are cleared before attempting to register.",
    "all", null, "normal", false, "Registrar's Office",
  ],
  [
    "a_library",
    "Library Weekend Hours Update",
    "Starting this weekend, the main library will extend its hours until 10:00 PM on Saturdays for students preparing for exams.",
    "staff", null, "low", false, "Library Services",
  ],
  [
    "a_faculty_draft",
    "Faculty Meeting Rescheduled",
    "The monthly faculty meeting has been moved to Thursday at 3:30 PM in the main conference room.",
    "staff", null, "normal", true, "Faculty Office",
  ],
];

const broadcasts = [
  {
    id: "bc_weekly",
    subject: "Weekly Newsletter",
    body: "A roundup of this week's achievements, events, and reminders for all parents.",
    channel: "email", groups: ["Parents"], count: 210, status: "delivered",
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "bc_bus",
    subject: "Bus Route 4 Delay",
    body: "Bus route 4 is running 15 minutes late today due to road works. Parents please plan pickups accordingly.",
    channel: "sms", groups: ["Bus Route 4 Parents"], count: 42, status: "pending",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "bc_meeting",
    subject: "Staff Meeting Cancelled",
    body: "Today's scheduled staff meeting has been cancelled. A new date will be announced shortly.",
    channel: "inapp", groups: ["Staff"], count: 142, status: "failed",
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

const threads = [
  {
    id: "th_alex",
    name: "Alex Johnson",
    participants: ["You", "Alex Johnson"],
    unread: 2,
    online: true,
    messages: [
      { text: "Hi, are you available later?", from: "Alex Johnson", at: new Date(Date.now() - 55 * 60000).toISOString(), mine: false },
      { text: "Yes, I have some free time after 2 PM. What do you need help with?", from: "You", at: new Date(Date.now() - 50 * 60000).toISOString(), mine: true },
      { text: "Can we review the physics assignment today? I'm stuck on question 4 regarding momentum.", from: "Alex Johnson", at: new Date(Date.now() - 45 * 60000).toISOString(), mine: false },
    ],
  },
  {
    id: "th_study",
    name: "Math Study Group",
    participants: ["You", "Emma", "Nisha"],
    unread: 0,
    online: false,
    messages: [
      { text: "Shall we go over the quadratic word problems on Thursday?", from: "Emma", at: new Date(Date.now() - 26 * 3600000).toISOString(), mine: false },
      { text: "Sounds like a plan. See you all tomorrow.", from: "You", at: new Date(Date.now() - 25 * 3600000).toISOString(), mine: true },
    ],
  },
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

  for (const [id, title, author, isbn, genre, copies] of books) {
    await writeDoc(token, "books", id, { title, author, isbn, genre, copies });
  }

  // Seed loans: due dates spread around today (one overdue to seed a fine).
  const dueDates = [
    new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
  ];
  for (let i = 0; i < loans.length; i++) {
    const [id, bookId, studentId] = loans[i];
    await writeDoc(token, "loans", id, {
      book_id: bookId,
      student_id: studentId,
      issued_date: today,
      due_date: dueDates[i],
      returned_date: null,
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

  for (const [id, title, body, audience, classId, priority, draft, author] of announcements) {
    await writeDoc(token, "announcements", id, {
      title, body, audience, class_id: classId, priority, draft, author,
      date: today,
    });
  }

  for (const b of broadcasts) {
    await writeDoc(token, "broadcasts", b.id, b);
  }

  for (const t of threads) {
    await writeDoc(token, "threads", t.id, {
      name: t.name, participants: t.participants, unread: t.unread,
      online: t.online, messages: t.messages,
    });
  }

  // Hostel rooms and allocations across the three blocks.
  const rooms = [
    { id: "r_a101", block: "A", floor: 1, room_number: "101", capacity: 4, occupants: ["s_1"] },
    { id: "r_a102", block: "A", floor: 1, room_number: "102", capacity: 4, occupants: ["s_3"] },
    { id: "r_a103", block: "A", floor: 2, room_number: "201", capacity: 4, occupants: [] },
    { id: "r_a104", block: "A", floor: 2, room_number: "202", capacity: 4, occupants: [] },
    { id: "r_b201", block: "B", floor: 1, room_number: "301", capacity: 4, occupants: [] },
    { id: "r_b202", block: "B", floor: 1, room_number: "302", capacity: 4, occupants: [] },
    { id: "r_c301", block: "C", floor: 1, room_number: "401", capacity: 4, occupants: ["s_2", "s_4"] },
    { id: "r_c302", block: "C", floor: 1, room_number: "402", capacity: 4, occupants: [] },
  ];
  for (const r of rooms) {
    await writeDoc(token, "rooms", r.id, r);
  }

  const feeDate = (offsetDays) =>
    new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
  const hostelFees = [
    { id: "hf_s1", student_id: "s_1", room_id: "r_a101", fee_plan: "Term", rent: 8000, mess: 1500, laundry: 500, due_date: feeDate(12) },
    { id: "hf_s3", student_id: "s_3", room_id: "r_a102", fee_plan: "Term", rent: 8000, mess: 1500, laundry: 500, due_date: feeDate(-6) },
    { id: "hf_s2", student_id: "s_2", room_id: "r_c301", fee_plan: "Monthly", rent: 3000, mess: 1500, laundry: 500, due_date: feeDate(-3), paid_date: feeDate(-3) },
    { id: "hf_s4", student_id: "s_4", room_id: "r_c301", fee_plan: "Annual", rent: 24000, mess: 4500, laundry: 1500, due_date: feeDate(20) },
  ];
  for (const f of hostelFees) {
    await writeDoc(token, "hostel_fees", f.id, f);
  }

  // Transport: vehicles, routes, and per-student route assignments.
  const fmtDate = (d) => d.toISOString().slice(0, 10);
  const vehicles = [
    {
      id: "v_bus42", vehicle_no: "BUS-42", plate: "ABC-1234", status: "active",
      capacity_seats: 72, route_id: "r_north", driver_name: "John Smith", driver_phone: "555-0192",
      insurance_expiry: fmtDate(new Date(Date.now() + 56 * 86400000)),
      permit_expiry: fmtDate(new Date(Date.now() + 120 * 86400000)),
      services: [
        { date: fmtDate(new Date(Date.now() - 100 * 86400000)), type: "Oil Change", cost: 125 },
        { date: fmtDate(new Date(Date.now() - 45 * 86400000)), type: "Brake Pads", cost: 450 },
      ],
    },
    {
      id: "v_bus15", vehicle_no: "BUS-15", plate: "XYZ-9876", status: "maintenance",
      capacity_seats: 52, route_id: null,
      insurance_expiry: fmtDate(new Date(Date.now() + 200 * 86400000)),
      permit_expiry: fmtDate(new Date(Date.now() - 10 * 86400000)),
      services: [
        { date: fmtDate(new Date(Date.now() - 6 * 86400000)), type: "Engine Repair", cost: 900 },
      ],
    },
    {
      id: "v_bus08", vehicle_no: "BUS-08", plate: "LMN-4567", status: "active",
      capacity_seats: 36, route_id: "r_east", driver_name: "Maria Rodriguez", driver_phone: "555-0211",
      insurance_expiry: fmtDate(new Date(Date.now() + 400 * 86400000)),
      permit_expiry: fmtDate(new Date(Date.now() + 90 * 86400000)),
      services: [
        { date: fmtDate(new Date(Date.now() - 200 * 86400000)), type: "Annual Inspection", cost: 85 },
      ],
    },
  ];
  for (const v of vehicles) {
    await writeDoc(token, "vehicles", v.id, v);
  }

  const routes = [
    {
      id: "r_north", name: "North Campus Express", bus_id: "v_bus42", driver_name: "John Smith",
      capacity: 72, status: "active",
      stops: [
        { name: "Main St & 4th", stop_time: "7:45 AM" },
        { name: "Oakwood Park", stop_time: "8:00 AM" },
        { name: "Community Center", stop_time: "8:10 AM" },
        { name: "School Gate A", stop_time: "8:20 AM" },
      ],
    },
    {
      id: "r_south", name: "South Valley Route", bus_id: "v_bus15", driver_name: "Sarah Jenkins",
      capacity: 52, status: "delayed",
      stops: [
        { name: "Riverside Junction", stop_time: "7:50 AM" },
        { name: "Hilltop View", stop_time: "8:05 AM" },
        { name: "School Gate B", stop_time: "8:25 AM" },
      ],
    },
    {
      id: "r_east", name: "Eastside Loop", bus_id: "v_bus08", driver_name: "Michael Chang",
      capacity: 36, status: "active",
      stops: [
        { name: "Oakwood Park", stop_time: "7:40 AM" },
        { name: "Liberty Court", stop_time: "7:55 AM" },
        { name: "School Gate A", stop_time: "8:15 AM" },
      ],
    },
  ];
  for (const r of routes) {
    await writeDoc(token, "routes", r.id, r);
  }

  const assignments = [
    {
      id: "a_s1", student_id: "s_1", route_id: "r_north", pickup_stop: "Main St & 4th",
      drop_stop: "School Gate A", monthly_fee: 50, status: "assigned",
    },
    {
      id: "a_s2", student_id: "s_2", route_id: "r_east", pickup_stop: "Liberty Court",
      drop_stop: "School Gate A", monthly_fee: 45, status: "draft",
    },
    {
      id: "a_s3", student_id: "s_3", route_id: null, pickup_stop: null, drop_stop: "School Gate B",
      monthly_fee: 50, status: "pending",
    },
    {
      id: "a_s4", student_id: "s_4", route_id: "r_east", pickup_stop: "Oakwood Park",
      drop_stop: "School Gate A", monthly_fee: 45, status: "conflict",
    },
  ];
  for (const a of assignments) {
    await writeDoc(token, "route_assignments", a.id, a);
  }

  // Settings: school profile + fee structures.
  await writeDoc(token, "settings", "school", {
    school_name: "Greenwood International School",
    school_address: "123 Education Boulevard, Knowledge City",
    timezone: "(GMT+05:30) India Standard Time",
    currency: "INR (₹)",
    primary_color: "#6366F1",
  });
  const structures = [
    {
      id: "fs_c9a_standard", class_id: "c9a", name: "Standard Academic Curriculum", academic_year: "2024 - 2025",
      fees: [
        { name: "Tuition Fee", kind: "Tuition Fee", amount: 1200, frequency: "Monthly" },
        { name: "Transport Fee", kind: "Transport Fee", amount: 350, frequency: "Quarterly" },
        { name: "Library Fee", kind: "Library Fee", amount: 150, frequency: "Annual" },
      ],
    },
    {
      id: "fs_c8a_board", class_id: "c8a", name: "Board Examination Year", academic_year: "2024 - 2025",
      fees: [
        { name: "Tuition Fee", kind: "Tuition Fee", amount: 1350, frequency: "Monthly" },
        { name: "Lab Fee", kind: "Lab Fee", amount: 400, frequency: "Quarterly" },
        { name: "Examination Fee", kind: "Exam Fee", amount: 500, frequency: "Annual" },
      ],
    },
  ];
  for (const s of structures) {
    await writeDoc(token, "fee_structures", s.id, s);
  }

  console.log(
    "Seeded:", classes.length, "classes,", students.length, "students,",
    subjects.length, "subjects,", marks.length, "marks,", payments.length, "payments,"
    + " teacher assignments."
  );
  console.log("Library:", books.length, "books,", loans.length, "loans.");
  console.log("Communications:", announcements.length, "announcements,", broadcasts.length, "broadcasts,", threads.length, "threads.");
  console.log("Hostel:", rooms.length, "rooms,", hostelFees.length, "fee records.");
  console.log("Transport:", vehicles.length, "vehicles,", routes.length, "routes,", assignments.length, "assignments.");
  console.log("Settings:", structures.length, "fee structures.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});