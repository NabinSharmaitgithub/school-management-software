"use client";

/**
 * Admin Settings — 6-tab configuration page per the Academix admin settings spec.
 * Accents are blue (#2563EB) per spec; the surrounding app shell stays the app's teal.
 * Config persists to Firestore settings/admin_settings (one slice per tab).
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Save, Search, Bell, Moon, Sun, GraduationCap, Upload, Pencil,
  Trash2, Mail, AlertTriangle, Check, UserCog, Shield, Users,
} from "lucide-react";
import {
  getAdminSettings, saveAdminSettings, listUsers, listClasses, listSubjects,
} from "@/lib/data";
import type { UserRecord, Class, Subject } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

type Cfg = Record<string, unknown>;const TABS = ["General", "Users & Roles", "Academic", "Notifications", "Security", "Backup"] as const;
type Tab = (typeof TABS)[number];

export default function AdminSettingsPage() {
  const scope = useTeacherScope();
  const [tab, setTab] = useState<Tab>("General");
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");

  // Per-tab config slices (spec defaults; merged with stored config on load)
  const [general, setGeneral] = useState<Cfg>(GENERIC_DEFAULTS.general);
  const [academic, setAcademic] = useState<Cfg>(GENERIC_DEFAULTS.academic);
  const [notifications, setNotifications] = useState<Cfg>(GENERIC_DEFAULTS.notifications);
  const [security, setSecurity] = useState<Cfg>(GENERIC_DEFAULTS.security);
  const [backup, setBackup] = useState<Cfg>(GENERIC_DEFAULTS.backup);
  const [grades, setGrades] = useState(STRUCTURED_DEFAULTS.grades);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stored, u, c, s] = await Promise.all([
          getAdminSettings(), listUsers(), listClasses(), listSubjects(),
        ]);
        if (cancelled) return;
        setGeneral({ ...GENERIC_DEFAULTS.general, ...(stored.general ?? {}) });
        setAcademic({ ...GENERIC_DEFAULTS.academic, ...(stored.academic ?? {}) });
        setNotifications({ ...GENERIC_DEFAULTS.notifications, ...(stored.notifications ?? {}) });
        setSecurity({ ...GENERIC_DEFAULTS.security, ...(stored.security ?? {}) });
        setBackup({ ...GENERIC_DEFAULTS.backup, ...(stored.backup ?? {}) });
        if (stored.academic?.grades) setGrades(stored.academic.grades as typeof grades);
        setUsers(u);
        setClasses(c);
        setSubjects(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setTabCfg = (which: Tab) => {
    if (which === "General") return [general, setGeneral] as const;
    if (which === "Academic") return [academic, setAcademic] as const;
    if (which === "Notifications") return [notifications, setNotifications] as const;
    if (which === "Security") return [security, setSecurity] as const;
    return [backup, setBackup] as const;
  };

  const setField = (which: Tab, key: string, value: unknown) => {
    const [, setter] = setTabCfg(which);
    (setter as (fn: (c: Cfg) => Cfg) => void)((c) => ({ ...c, [key]: value }));
  };

  async function onSave(which: Tab) {
    setSaving(true);
    setSaved("");
    try {
      if (which === "Academic") {
        await saveAdminSettings("academic", { ...academic, grades });
      } else {
        const [form] = setTabCfg(which);
        await saveAdminSettings(which.toLowerCase(), form as Cfg);
      }
      setSaved(`${which} settings saved.`);
    } catch (err) {
      setSaved((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const roleCounts = useMemo(() => {
    const c: Record<string, number> = { Admin: 0, Teacher: 0, Student: 0, Parent: 0 };
    for (const u of users) if (u.role in c) c[u.role]++;
    return c;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = scope.isAdmin ? users : users.filter(() => false);
    if (!t) return base;
    return base.filter((u) =>
      (u.email ?? "").toLowerCase().includes(t) || u.role.toLowerCase().includes(t) || (u.student_id ?? "").toLowerCase().includes(t)
    );
  }, [users, q, scope]);

  const groupedClasses = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of classes) {
      const list = m.get(c.name) ?? [];
      list.push(c.section);
      m.set(c.name, list);
    }
    return Array.from(m.entries()).map(([name, sections]) => ({ name, sections: sections.join(", ") }));
  }, [classes]);

  if (loading || !scope.ready) {
    return <p className="text-sm text-slate-500 p-8 text-center">Loading admin settings…</p>;
  }

  const cardCls = "bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl p-5";
  void cardCls;
  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className={`min-h-screen space-y-4 ${dark ? "bg-slate-900" : "bg-[#F8FAFC]"} rounded-xl p-4 md:p-6`}>
        {/* Top header bar (this section's navy shell) */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#0F172A] px-4 py-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search settings..."
              aria-label="Search settings"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/communications" className="relative p-2 text-slate-300 hover:text-white" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white grid place-items-center">3</span>
            </Link>
            <button onClick={() => setDark(!dark)} className="p-2 text-slate-300 hover:text-white" aria-label="Toggle dark mode">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-bold">{(scope.email ?? "A")[0].toUpperCase()}</span>
              <span className="hidden sm:block leading-tight">
                <span className="block text-xs font-semibold text-white">Admin</span>
                <span className="block text-[10px] text-slate-400">Administrator</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 grid place-items-center text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Settings</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage system configuration, users, and platform settings</p>
            </div>
          </div>
          <button
            onClick={() => onSave(tab)}
            disabled={saving || tab === "Users & Roles"}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : tab === "General" ? "Save All Changes" : "Save Changes"}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-1 border-b border-[#E2E8F0] dark:border-slate-700">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? "border-[#2563EB] text-[#2563EB] font-semibold" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {saved && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
            <Check className="h-4 w-4" /> {saved}
          </div>
        )}

        {tab === "General" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="System Information" subtitle="Basic information about your school and system" q={q} labels={["school name motto academic year logo"]}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="School Name *" value={general.school_name} onChange={(v) => setField("General", "school_name", v)} />
                <Input label="School Motto" value={general.motto} onChange={(v) => setField("General", "motto", v)} />
                <Select label="Academic Year" value={general.academic_year} onChange={(v) => setField("General", "academic_year", v)} options={["2025 - 2026", "2026 - 2027"]} />
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border-2 border-dashed border-[#E2E8F0] flex flex-col items-center justify-center gap-1 p-4 text-center">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-slate-400">SVG, PNG, JPG (max 2MB)</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 flex items-center justify-center">
                    <SchoolLogo />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Contact Information" subtitle="School contact details and address" q={q} labels={["email phone address website timezone"]}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Email Address *" value={general.email} onChange={(v) => setField("General", "email", v)} />
                <Input label="Phone Number *" value={general.phone} onChange={(v) => setField("General", "phone", v)} />
                <div className="sm:col-span-2"><Input label="Address" value={general.address} onChange={(v) => setField("General", "address", v)} /></div>
                <Input label="Website" value={general.website} onChange={(v) => setField("General", "website", v)} />
                <Input label="Timezone" value={general.timezone} onChange={(v) => setField("General", "timezone", v)} />
              </div>
            </Card>

            <Card title="Features & Modules" q={q} labels={["student registration online fee payment attendance exam notifications parent portal"]}>
              <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {FEATURES.map((f) => (
                  <ToggleRow
                    key={f.key}
                    icon={<f.Icon className={`h-4 w-4 ${f.cls}`} />}
                    title={f.title}
                    desc={f.desc}
                    on={general[f.key] as boolean}
                    onChange={(v) => setField("General", f.key, v)}
                  />
                ))}
              </div>
            </Card>

            <Card title="Default Settings" subtitle="Default values for the system" q={q} labels={["default class section attendance exam grading passing"]}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Default Class" value={general.default_class} onChange={(v) => setField("General", "default_class", v)} options={classes.map((c) => c.name)} />
                <Select label="Default Section" value={general.default_section} onChange={(v) => setField("General", "default_section", v)} options={["A", "B", "C"]} />
                <Select label="Default Attendance Status" value={general.default_attendance} onChange={(v) => setField("General", "default_attendance", v)} options={["Present", "Late", "Absent"]} />
                <Select label="Default Exam Type" value={general.default_exam} onChange={(v) => setField("General", "default_exam", v)} options={["Mid Term", "Final Term", "Unit Test"]} />
                <Select label="Marks Grading System" value={general.grading_system} onChange={(v) => setField("General", "grading_system", v)} options={["Percentage (100)", "GPA (4.0)", "GPA (5.0)"]} />
                <Input label="Passing Percentage" value={general.passing_pct} onChange={(v) => setField("General", "passing_pct", v)} type="number" />
              </div>
            </Card>

            <Card title="Admin Account" subtitle="Your account info" q={q} labels={["admin account name email change password"]}>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">Admin</p>
                  <p className="text-xs text-slate-500">{scope.email ?? ""}</p>
                </div>
                <Link href="/dashboard/my-account" className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">
                  Change Password
                </Link>
              </div>
            </Card>

            <Card title="Recent Activity" subtitle="Latest system activities" q={q} labels={["recent activity logs"]}>
              <div className="space-y-3">
                {[
                  ["bg-blue-500", "Admin updated school settings", "2 hours ago"],
                  ["bg-emerald-500", "New teacher account created", "5 hours ago"],
                  ["bg-purple-500", "System backup completed", "1 day ago"],
                  ["bg-orange-500", "Admin logged in", "1 day ago"],
                ].map(([dot, text, when]) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{text}</span>
                    <span className="text-[10px] text-slate-400">{when}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "Users & Roles" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <RoleStat icon={<UserCog className="h-5 w-5 text-blue-600" />} bg="bg-blue-50" count={roleCounts.Admin} title="Administrators" desc="Full system access" />
              <RoleStat icon={<GraduationCap className="h-5 w-5 text-purple-600" />} bg="bg-purple-50" count={roleCounts.Teacher} title="Teachers" desc="Manage classes & marks" />
              <RoleStat icon={<Users className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-50" count={roleCounts.Student} title="Students" desc="Access own records" />
              <RoleStat icon={<Users className="h-5 w-5 text-orange-600" />} bg="bg-orange-50" count={roleCounts.Parent} title="Parents" desc="View children's progress" />
            </div>
            <Card title="User Management" q={q} labels={["user management search users table"]}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search users by name, email or role..."
                    className="w-full rounded-lg border border-[#E2E8F0] pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <Link href="/dashboard/settings" className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add User</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-[#E2E8F0]">
                      <th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Status</th><th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-500">No users yet — student accounts are created automatically at sign-in.</td></tr>
                    )}
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#E2E8F0] hover:bg-slate-50">
                        <td className="py-3 pr-4 text-slate-800 dark:text-slate-200">{u.email}</td>
                        <td className="py-3 pr-4"><Badge>{u.role === "Admin" ? "Administrator" : u.role}</Badge></td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href="/dashboard/settings" aria-label={`Manage ${u.email}`} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <span title="Deletion is managed in Settings → user linking" className="p-2 rounded-lg text-slate-300 cursor-not-allowed">
                              <Trash2 className="h-4 w-4" />
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">Showing {filteredUsers.length} of {users.length} users</p>
            </Card>
            <Card title="Admin Account" q={q} labels={["admin account name email change password"]}>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[180px]"><Input label="Name" value="Admin" onChange={() => {}} readOnly /></div>
                <div className="flex-1 min-w-[220px]"><Input label="Email" value={scope.email ?? ""} onChange={() => {}} readOnly /></div>
                <Link href="/dashboard/my-account" className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50">Change Password</Link>
              </div>
            </Card>
          </div>
        )}

        {tab === "Academic" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Academic Configuration" q={q} labels={["academic year semester session start end date"]}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Academic Year" value={academic.academic_year} onChange={(v) => setField("Academic", "academic_year", v)} options={["2025 - 2026", "2026 - 2027"]} />
                <Select label="Current Semester" value={academic.semester} onChange={(v) => setField("Academic", "semester", v)} options={["1st Semester", "2nd Semester"]} />
                <Input label="Session Start Date" type="date" value={academic.session_start} onChange={(v) => setField("Academic", "session_start", v)} />
                <Input label="Session End Date" type="date" value={academic.session_end} onChange={(v) => setField("Academic", "session_end", v)} />
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => onSave("Academic")} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Changes</button>
              </div>
            </Card>

            <Card title="Classes & Sections" q={q} labels={["classes sections table"]} action={<Link href="/dashboard/academics" className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add Class</Link>}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-[#E2E8F0]"><th className="pb-3 pr-4">Class</th><th className="pb-3 pr-4">Sections</th><th className="pb-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {groupedClasses.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-500">No classes yet.</td></tr>}
                  {groupedClasses.map((g) => (
                    <tr key={g.name} className="border-b border-[#E2E8F0]">
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{g.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{g.sections}</td>
                      <td className="py-3 text-right">
                        <Link href="/dashboard/academics" aria-label={`Edit ${g.name}`} className="inline-flex p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></Link>
                        <Link href="/dashboard/academics" aria-label={`Delete ${g.name}`} className="inline-flex p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Subjects" q={q} labels={["subjects table"]} action={<Link href="/dashboard/academics" className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add Subject</Link>}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-[#E2E8F0]"><th className="pb-3 pr-4">Subject Name</th><th className="pb-3 pr-4">Classes</th><th className="pb-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {subjects.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-500">No subjects yet.</td></tr>}
                  {subjects.map((s) => (
                    <tr key={s.id} className="border-b border-[#E2E8F0]">
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">{s.name}</td>
                      <td className="py-3 pr-4 text-slate-600">{s.code ?? "All classes"}</td>
                      <td className="py-3 text-right">
                        <Link href="/dashboard/academics" aria-label={`Edit ${s.name}`} className="inline-flex p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></Link>
                        <Link href="/dashboard/academics" aria-label={`Delete ${s.name}`} className="inline-flex p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card title="Grading System" q={q} labels={["grading system grade marks range description"]} action={
              <button onClick={() => { const next = [...grades, { grade: "New", range: "0 - 0", description: "" }]; setGrades(next); }} className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">+ Add Grade</button>
            }>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-[#E2E8F0]"><th className="pb-3 pr-4">Grade</th><th className="pb-3 pr-4">Marks Range</th><th className="pb-3 pr-4">Description</th><th className="pb-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {grades.map((g, i) => (
                    <tr key={i} className="border-b border-[#E2E8F0]">
                      <td className="py-3 pr-4 font-bold text-blue-600">{g.grade}</td>
                      <td className="py-3 pr-4 text-slate-600">{g.range}</td>
                      <td className="py-3 pr-4 text-slate-600">{g.description}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => { const next = grades.filter((_, x) => x !== i); setGrades(next); }} aria-label="Remove grade" className="inline-flex p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">Save on the Academic tab persists grade rows.</p>
            </Card>
          </div>
        )}

        {tab === "Notifications" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card title="Email Notifications (SMTP)" subtitle="Manage how and when the system sends notifications" q={q} labels={["email notifications smtp host port username password from"]}>
                <ToggleRow
                  icon={<Mail className="h-4 w-4 text-blue-600" />}
                  title="Enable email notifications"
                  on={notifications.email_enabled as boolean}
                  onChange={(v) => setField("Notifications", "email_enabled", v)}
                  dense
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Input label="SMTP Host" value={notifications.smtp_host} onChange={(v) => setField("Notifications", "smtp_host", v)} />
                  <Input label="SMTP Port" type="number" value={notifications.smtp_port} onChange={(v) => setField("Notifications", "smtp_port", v)} />
                  <Input label="Email Username" value={notifications.smtp_user} onChange={(v) => setField("Notifications", "smtp_user", v)} />
                  <Input label="Email Password" type="password" value={notifications.smtp_pass} onChange={(v) => setField("Notifications", "smtp_pass", v)} />
                  <Input label="From Name" value={notifications.from_name} onChange={(v) => setField("Notifications", "from_name", v)} />
                  <Input label="From Email" value={notifications.from_email} onChange={(v) => setField("Notifications", "from_email", v)} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {notifications.smtp_host ? "Email settings are configured" : "Email settings incomplete"}
                  </span>
                  <button onClick={() => onSave("Notifications")} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Test Email</button>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="In-App Notifications" subtitle="Control in-app notification behavior" q={q} labels={["notification types registration payment results attendance messages updates"]}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Notification Types</p>
                <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                  {NOTIF_TYPES.map((n) => (
                    <ToggleRow key={n.key} icon={<Bell className="h-4 w-4 text-blue-600" />} title={n.title} hideDesc on={notifications[n.key] as boolean} onChange={(v) => setField("Notifications", n.key, v)} dense />
                  ))}
                </div>
              </Card>
              <Card title="Notification Templates" q={q} labels={["templates welcome fee reminder exam result"]} action={<span className="text-xs text-slate-400">Manage Templates</span>}>
                <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                  {[
                    ["Welcome Email", "Welcome to Academix School"],
                    ["Fee Reminder", "Your fee payment is due"],
                    ["Exam Result", "Your exam results are now available"],
                  ].map(([t, s]) => (
                    <div key={t} className="flex items-center gap-3 py-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t}</p>
                        <p className="text-xs text-slate-500">{s}</p>
                      </div>
                      <span className="text-xs text-slate-400">Edit</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "Security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card title="Authentication Settings" q={q} labels={["two factor session expiry login attempts lockout"]}>
                <ToggleRow
                  icon={<Shield className="h-4 w-4 text-blue-600" />}
                  title="Enable Two-Factor Authentication (2FA)"
                  desc="Recommended for admin accounts"
                  on={security.two_fa as boolean}
                  onChange={(v) => setField("Security", "two_fa", v)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <Input label="Session Expiry (hours)" type="number" value={security.session_expiry} onChange={(v) => setField("Security", "session_expiry", v)} />
                  <Input label="Allowed Login Attempts" type="number" value={security.login_attempts} onChange={(v) => setField("Security", "login_attempts", v)} />
                  <Input label="Lockout Duration (minutes)" type="number" value={security.lockout} onChange={(v) => setField("Security", "lockout", v)} />
                </div>
              </Card>
              <Card title="Access Control" q={q} labels={["restrict admin access ip addresses"]}>
                <ToggleRow
                  icon={<Shield className="h-4 w-4 text-blue-600" />}
                  title="Restrict admin access to specific IPs"
                  on={security.ip_restrict as boolean}
                  onChange={(v) => setField("Security", "ip_restrict", v)}
                />
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Allowed IP Addresses</label>
                  <textarea
                    value={security.current_ips as string}
                    onChange={(e) => setField("Security", "current_ips", e.target.value)}
                    placeholder="e.g. 192.168.1.1, 192.168.1.0/24"
                    className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-blue-500 min-h-24"
                  />
                </div>
              </Card>
              <Card title="Security Logs" q={q} labels={["security logs view logs"]}>
                <div className="flex items-center justify-between">
                  <Shield className="h-6 w-6 text-slate-400" />
                  <span className="rounded-lg border border-[#2563EB] px-4 py-2 text-sm font-semibold text-[#2563EB]">View Logs</span>
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Password Policy" q={q} labels={["password policy length uppercase lowercase number special"]}>
                <div className="mb-4"><Input label="Minimum password length" type="number" value={security.pw_length} onChange={(v) => setField("Security", "pw_length", v)} /></div>
                <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                  {[
                    ["pw_upper", "Require uppercase letter"],
                    ["pw_lower", "Require lowercase letter"],
                    ["pw_number", "Require number"],
                    ["pw_special", "Require special character"],
                  ].map(([k, t]) => (
                    <ToggleRow key={k} icon={<Shield className="h-4 w-4 text-blue-600" />} title={t} hideDesc on={security[k] as boolean} onChange={(v) => setField("Security", k, v)} dense />
                  ))}
                </div>
              </Card>
              <Card title="Data Privacy" q={q} labels={["hide student personal data audit logs export"]}>
                <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                  {[
                    ["hide_pii", "Hide student personal data from non-admins"],
                    ["audit_logs", "Enable audit logs"],
                    ["allow_export", "Allow data export"],
                  ].map(([k, t], i) => (
                    <ToggleRow key={k} icon={<Shield className="h-4 w-4 text-blue-600" />} title={t} desc={i === 2 ? "Requires admin permission" : undefined} hideDesc={!i && false} on={security[k] as boolean} onChange={(v) => setField("Security", k, v)} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "Backup" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Card title="Backup & Restore (Manual)" subtitle="Create backups of your data or restore from previous" q={q} labels={["create backup manual type"]}>
                <p className="text-xs font-semibold text-slate-500 mb-2">Create Backup</p>
                <p className="text-[10px] text-slate-400 mb-0">Create a manual backup of your entire system data.</p>
                <div className="grid gap-4 mt-4">
                  <Select label="Backup Type" value={backup.backup_type} onChange={(v) => setField("Backup", "backup_type", v)} options={["Full Backup (Database + Files)", "Database Only", "Files Only"]} />
                  <span className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white">Create Backup</span>
                </div>
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                  Firestore backups are managed from the Firebase console (this button is a control placeholder).
                </div>
              </Card>
              <Card title="Restore Data" subtitle="Restore your system from a previous backup." q={q} labels={["restore data select backup overwrite"]}>
                <Select label="Select Backup" value={backup.restore_target} onChange={(v) => setField("Backup", "restore_target", v)} options={["No backups available"]} />
                <span className="mt-4 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white opacity-50 cursor-not-allowed">Restore</span>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-[#FEF3C7] border border-amber-300 px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  This will overwrite current data. Make sure you have a recent backup.
                </div>
              </Card>
            </div>
            <div className="space-y-4">
              <Card title="Automatic Backups" subtitle="Schedule automated backups" q={q} labels={["automatic backups frequency time retention"]}>
                <ToggleRow
                  icon={<Shield className="h-4 w-4 text-blue-600" />}
                  title="Enable automatic backups"
                  on={backup.auto as boolean}
                  onChange={(v) => setField("Backup", "auto", v)}
                />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Select label="Frequency" value={backup.frequency} onChange={(v) => setField("Backup", "frequency", v)} options={["Daily", "Weekly", "Monthly"]} />
                  <Input label="Time" value={backup.time} onChange={(v) => setField("Backup", "time", v)} />
                </div>
                <div className="mt-4"><Select label="Retention Period" value={backup.retention} onChange={(v) => setField("Backup", "retention", v)} options={["7 days", "30 days", "90 days", "1 year"]} /></div>
                <div className="mt-4 flex justify-end">
                  <button onClick={() => onSave("Backup")} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save Changes</button>
                </div>
              </Card>
              <Card title="Recent Backups" q={q} labels={["recent backups table download"]}>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-[#E2E8F0]"><th className="pb-3 pr-4">Date & Time</th><th className="pb-3 pr-4">Type</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Size</th><th className="pb-3 text-right">Actions</th></tr></thead>
                  <tbody>
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-xs">No cloud backups recorded — Firestore backups are managed in the Firebase console.</td></tr>
                  </tbody>
                </table>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small building blocks ---------- */

const GENERIC_DEFAULTS = {
  general: { school_name: "Academix Higher Secondary School", motto: "Knowledge Builds Tomorrow", academic_year: "2025 - 2026", email: "info@academix.edu.np", phone: "+977 9812345678", address: "Pokhara-17, Kaski, Nepal", website: "https://academix.edu.np", timezone: "Asia/Kathmandu", student_registration: true, online_payment: true, attendance_system: true, exam_management: true, notifications_feature: true, parent_portal: false, default_class: "Grade 10", default_section: "A", default_attendance: "Present", default_exam: "Mid Term", grading_system: "Percentage (100)", passing_pct: "40" } as Cfg,
  academic: { academic_year: "2025 - 2026", semester: "2nd Semester", session_start: "2025-04-01", session_end: "2026-03-31" } as Cfg,
  notifications: { email_enabled: true, smtp_host: "smtp.gmail.com", smtp_port: "587", smtp_user: "info@academix.edu.np", smtp_pass: "••••••••••••••••", from_name: "Academix School", from_email: "info@academix.edu.np", new_student: true, fee_payment: true, exam_results: true, attendance_alerts: true, message_received: true, system_updates: true } as Cfg,
  security: { two_fa: true, session_expiry: "8", login_attempts: "5", lockout: "30", pw_length: "8", pw_upper: true, pw_lower: true, pw_number: true, pw_special: true, ip_restrict: true, current_ips: "", hide_pii: true, audit_logs: true, allow_export: true } as Cfg,
  backup: { backup_type: "Full Backup (Database + Files)", auto: true, frequency: "Daily", time: "02:00 AM", retention: "30 days", restore_target: "" } as Cfg,
};

const STRUCTURED_DEFAULTS = {
  grades: [
    { grade: "A+", range: "90 - 100", description: "Excellent" },
    { grade: "A", range: "80 - 89", description: "Very Good" },
    { grade: "B+", range: "70 - 79", description: "Good" },
    { grade: "B", range: "60 - 69", description: "Satisfactory" },
    { grade: "C", range: "50 - 59", description: "Basic" },
    { grade: "D", range: "40 - 49", description: "Below Average" },
  ],
};

const FEATURES = [
  { key: "student_registration", title: "Student Registration", desc: "Allow new student registrations", Icon: UserCog, cls: "text-blue-600" },
  { key: "online_payment", title: "Online Fee Payment", desc: "Enable eSewa / online payments", Icon: Users, cls: "text-purple-600" },
  { key: "attendance_system", title: "Attendance System", desc: "Enable attendance tracking", Icon: Check, cls: "text-emerald-600" },
  { key: "exam_management", title: "Exam Management", desc: "Enable exam and result management", Icon: Pencil, cls: "text-orange-600" },
  { key: "notifications_feature", title: "Notifications", desc: "Send email and in-app notifications", Icon: Bell, cls: "text-blue-600" },
  { key: "parent_portal", title: "Parent Portal", desc: "Allow parents to access student information", Icon: Shield, cls: "text-orange-600" },
] as const;

const NOTIF_TYPES = [
  { key: "new_student", title: "New student registration" },
  { key: "fee_payment", title: "Fee payment received" },
  { key: "exam_results", title: "Exam results published" },
  { key: "attendance_alerts", title: "Attendance alerts" },
  { key: "message_received", title: "Message received" },
  { key: "system_updates", title: "System updates" },
] as const;

function Card({ title, subtitle, q, labels = [], action, children }: { title: string; subtitle?: string; q: string; labels?: string[]; action?: React.ReactNode; children: React.ReactNode }) {
  const haystack = (labels.join(" ") + " " + title).toLowerCase();
  const visible = !q.trim() || haystack.includes(q.trim().toLowerCase());
  if (!visible) return null;
  return (
    <section className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text", readOnly = false }: { label: string; value: unknown; onChange: (v: string) => void; type?: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>
      <input
        type={type}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-blue-500 ${readOnly ? "bg-slate-50 text-slate-500" : ""}`}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: unknown; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</span>
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`w-10 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-[#2563EB]" : "bg-slate-300"}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5 ml-0.5" : "ml-0.5"}`} />
    </button>
  );
}

function ToggleRow({ icon, title, desc, on, onChange, hideDesc = false, dense = false }: { icon: React.ReactNode; title: string; desc?: string; on: boolean; onChange: (v: boolean) => void; hideDesc?: boolean; dense?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${dense ? "py-2.5" : "py-3"}`}>
      <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 grid place-items-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{title}</p>
        {!hideDesc && desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{children}</span>;
}

function RoleStat({ icon, bg, count, title, desc }: { icon: React.ReactNode; bg: string; count: number; title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl p-4 flex items-center gap-3">
      <span className={`w-10 h-10 rounded-lg ${bg} grid place-items-center`}>{icon}</span>
      <div>
        <p className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">{count}</p>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{title}</p>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function SchoolLogo() {
  return (
    <div className="text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-blue-600 grid place-items-center text-white">
        <GraduationCap className="h-7 w-7" />
      </div>
      <p className="mt-1.5 text-[11px] font-bold tracking-wide text-slate-700 dark:text-slate-200">ACADEMIX</p>
      <p className="text-[9px] text-slate-400">EST. 2025</p>
    </div>
  );
}
