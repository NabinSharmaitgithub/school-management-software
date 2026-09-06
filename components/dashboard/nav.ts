export const NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "My Class", icon: "groups", href: "/dashboard/my-class" },
  { label: "Students", icon: "group", href: "/dashboard/students" },
  { label: "Academics", icon: "menu_book", href: "/dashboard/academics" },
  { label: "Attendance", icon: "event_available", href: "/dashboard/attendance" },
  { label: "Marks", icon: "school", href: "/dashboard/marks" },
  { label: "Staff", icon: "badge", href: "/dashboard/staff" },
  { label: "Assign Teachers", icon: "assignment_ind", href: "/dashboard/assignments" },
  { label: "Finance", icon: "payments", href: "/dashboard/finance" },
  { label: "Communications", icon: "campaign", href: "/dashboard/communications" },
  { label: "My Fees", icon: "receipt_long", href: "/dashboard/my-fees" },
  { label: "Library", icon: "local_library", href: "/dashboard/library" },
  { label: "Transport", icon: "directions_bus", href: "/dashboard/transport" },
  { label: "Hostel", icon: "apartment", href: "/dashboard/hostel" },
  { label: "Exam Schedules", icon: "event_note", href: "/dashboard/exam-schedules" },
  { label: "Timetable", icon: "calendar_month", href: "/dashboard/timetable" },
  { label: "Report Cards", icon: "description", href: "/dashboard/report-cards" },
  { label: "Analytics", icon: "query_stats", href: "/dashboard/analytics" },
  { label: "Settings", icon: "settings", href: "/dashboard/settings" },
];

const ADMIN_ONLY = [
  "/dashboard/academics",
  "/dashboard/assignments",
  "/dashboard/finance",
  "/dashboard/my-fees",
  "/dashboard/library",
  "/dashboard/transport",
  "/dashboard/hostel",
  "/dashboard/exam-schedules",
  "/dashboard/timetable",
  "/dashboard/report-cards",
  "/dashboard/analytics",
  "/dashboard/settings",
];

const TEACHER_ONLY = ["/dashboard/my-class"];
const STUDENT_ONLY = ["/dashboard/my-fees"];
export type NavRole = "Admin" | "Teacher" | "Student" | "Parent" | null;

export function navItemsFor(role: NavRole) {
  if (role === "Teacher") return NAV_ITEMS.filter((i) => !ADMIN_ONLY.includes(i.href));
  if (role === "Student" || role === "Parent")
    return NAV_ITEMS.filter((i) => i.href === "/dashboard" || STUDENT_ONLY.includes(i.href));
  return NAV_ITEMS.filter((i) => !TEACHER_ONLY.includes(i.href) && !STUDENT_ONLY.includes(i.href));
}

export function isRestrictedFor(role: NavRole, pathname: string) {
  const blocked = (list: string[]) => list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (role === "Teacher") return blocked(ADMIN_ONLY);
  if (role === "Student" || role === "Parent")
    return pathname !== "/dashboard" && !blocked(STUDENT_ONLY);
  return blocked([...TEACHER_ONLY, ...STUDENT_ONLY]);
}
