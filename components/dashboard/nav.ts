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
  { label: "ID Cards", icon: "credit_card", href: "/dashboard/id-cards" },
  { label: "Analytics", icon: "query_stats", href: "/dashboard/analytics" },
  { label: "Settings", icon: "settings", href: "/dashboard/settings" },
];

const ADMIN_ONLY = [
  "/dashboard/assignments",
  "/dashboard/finance",
  "/dashboard/library",
  "/dashboard/transport",
  "/dashboard/hostel",
  "/dashboard/exam-schedules",
  "/dashboard/timetable",
  "/dashboard/report-cards",
  "/dashboard/id-cards",
  "/dashboard/analytics",
  "/dashboard/settings",
];

export function navItemsFor(email?: string | null) {
  const isTeacher = email === "teacher@school.local";
  return isTeacher ? NAV_ITEMS.filter((i) => !ADMIN_ONLY.includes(i.href)) : NAV_ITEMS;
}

export function isRestrictedFor(email: string | null | undefined, pathname: string) {
  return email === "teacher@school.local" && ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
