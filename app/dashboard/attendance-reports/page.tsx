"use client";

import { useEffect, useMemo, useState } from "react";
import { listStudents, listClasses, listAttendance, listAttendanceCorrections } from "@/lib/data";
import type { Student, Class, AttendanceEntry, AttendanceCorrectionLog } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { Card, Button, Select, StatusPill, Alert, EmptyState } from "@/components/ui";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function monthOptions() {
  const months: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export default function AttendanceReportsPage() {
  const scope = useTeacherScope();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [view, setView] = useState<"class" | "student">("class");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c, a, corr] = await Promise.all([
          listStudents(),
          listClasses(),
          listAttendance(),
          listAttendanceCorrections(),
        ]);
        if (cancelled) return;
        setStudents(s);
        setClasses(c);
        setAttendance(a);
        setCorrections(corr);
        setError("");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const allowedClasses = useMemo(
    () =>
      scope.isAdmin
        ? classes
        : classes.filter((c) => scope.classIds.includes(c.id)),
    [classes, scope]
  );

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      if (classFilter !== "all" && a.class_id !== classFilter) return false;
      if (dateFrom && a.date < dateFrom) return false;
      if (dateTo && a.date > dateTo) return false;
      return true;
    });
  }, [attendance, classFilter, dateFrom, dateTo]);

  const classSummary = useMemo(() => {
    const byClass = new Map<string, { total: number; present: number; absent: number; late: number }>();
    for (const a of filteredAttendance) {
      const cur = byClass.get(a.class_id) ?? { total: 0, present: 0, absent: 0, late: 0 };
      cur.total += 1;
      if (a.status === "present") cur.present += 1;
      else if (a.status === "absent") cur.absent += 1;
      else cur.late += 1;
      byClass.set(a.class_id, cur);
    }
    return Array.from(byClass.entries()).map(([cid, counts]) => {
      const cls = classes.find((c) => c.id === cid);
      const pct = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;
      return {
        classId: cid,
        className: cls ? `${cls.name} ${cls.section}` : cid,
        ...counts,
        pct,
      };
    });
  }, [filteredAttendance, classes]);

  const studentSummary = useMemo(() => {
    const byStudent = new Map<string, { total: number; present: number; absent: number; late: number; class_id: string }>();
    for (const a of filteredAttendance) {
      const cur = byStudent.get(a.student_id) ?? { total: 0, present: 0, absent: 0, late: 0, class_id: a.class_id };
      cur.total += 1;
      if (a.status === "present") cur.present += 1;
      else if (a.status === "absent") cur.absent += 1;
      else cur.late += 1;
      cur.class_id = a.class_id;
      byStudent.set(a.student_id, cur);
    }
    return Array.from(byStudent.entries()).map(([sid, counts]) => {
      const st = students.find((s) => s.id === sid);
      const pct = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;
      return {
        studentId: sid,
        studentName: st?.name ?? sid,
        rollNumber: st?.roll_number ?? "",
        classId: counts.class_id,
        className: classes.find((c) => c.id === counts.class_id)?.name ?? "",
        ...counts,
        pct,
      };
    });
  }, [filteredAttendance, students, classes]);

  const recentCorrections = corrections.slice(0, 10);

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading attendance reports…
      </Card>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  return (
    <div className="space-y-6">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Attendance Reports</h1>
          <p className="text-sm text-slate-500">
            Class-wise and student-wise attendance with date filtering
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setView("class")} className={view === "class" ? "bg-teal-50 text-teal-700" : ""}>
            Class Summary
          </Button>
          <Button variant="ghost" onClick={() => setView("student")} className={view === "student" ? "bg-teal-50 text-teal-700" : ""}>
            Student Summary
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Class</label>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All classes</option>
              {allowedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-teal-600"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-teal-600"
            />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {view === "class" ? (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="pb-3.5 pr-4">Class</th>
                  <th className="pb-3.5 pr-4 text-right">Total Records</th>
                  <th className="pb-3.5 pr-4 text-right">Present</th>
                  <th className="pb-3.5 pr-4 text-right">Absent</th>
                  <th className="pb-3.5 pr-4 text-right">Late</th>
                  <th className="pb-3.5 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {classSummary.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={6}>
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                )}
                {classSummary.map((c) => (
                  <tr key={c.classId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pr-4 font-medium text-slate-900">{c.className}</td>
                    <td className="py-3.5 pr-4 text-right text-slate-600">{c.total}</td>
                    <td className="py-3.5 pr-4 text-right text-emerald-600">{c.present}</td>
                    <td className="py-3.5 pr-4 text-right text-rose-600">{c.absent}</td>
                    <td className="py-3.5 pr-4 text-right text-amber-600">{c.late}</td>
                    <td className="py-3.5 text-right font-semibold text-slate-900">
                      <StatusPill tone={c.pct >= 90 ? "success" : c.pct >= 75 ? "primary" : c.pct >= 60 ? "warning" : "error"}>
                        {c.pct}%
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="pb-3.5 pr-4">Student</th>
                  <th className="pb-3.5 pr-4 hidden sm:table-cell">Roll No</th>
                  <th className="pb-3.5 pr-4 hidden md:table-cell">Class</th>
                  <th className="pb-3.5 pr-4 text-right">Total Days</th>
                  <th className="pb-3.5 pr-4 text-right">Present</th>
                  <th className="pb-3.5 pr-4 text-right">Absent</th>
                  <th className="pb-3.5 text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {studentSummary.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={7}>
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                )}
                {studentSummary.map((s) => (
                  <tr key={s.studentId} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pr-4 font-medium text-slate-900">{s.studentName}</td>
                    <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-600">{s.rollNumber}</td>
                    <td className="py-3.5 pr-4 hidden md:table-cell text-slate-600">{s.className}</td>
                    <td className="py-3.5 pr-4 text-right text-slate-600">{s.total}</td>
                    <td className="py-3.5 pr-4 text-right text-emerald-600">{s.present}</td>
                    <td className="py-3.5 pr-4 text-right text-rose-600">{s.absent}</td>
                    <td className="py-3.5 text-right font-semibold text-slate-900">
                      <StatusPill tone={s.pct >= 90 ? "success" : s.pct >= 75 ? "primary" : s.pct >= 60 ? "warning" : "error"}>
                        {s.pct}%
                      </StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {recentCorrections.length > 0 && (
        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm">Recent Attendance Corrections</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="pb-3.5 pr-4">Student</th>
                  <th className="pb-3.5 pr-4 hidden sm:table-cell">Date</th>
                  <th className="pb-3.5 pr-4 hidden md:table-cell">Change</th>
                  <th className="pb-3.5 pr-4">Reason</th>
                  <th className="pb-3.5 pr-4 text-right">Corrected By</th>
                  <th className="pb-3.5 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {recentCorrections.map((c) => {
                  const st = students.find((s) => s.id === c.student_id);
                  return (
                    <tr key={c.id} className="border-b border-slate-200">
                      <td className="py-3 pr-4 text-slate-600">{st?.name ?? c.student_id}</td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-slate-600">{formatDate(c.date)}</td>
                      <td className="py-3 pr-4 hidden md:table-cell text-slate-600">
                        {c.previous_status} → {c.new_status}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{c.reason}</td>
                      <td className="py-3 pr-4 text-right text-slate-600">{c.corrected_by}</td>
                      <td className="py-3 text-right text-xs text-slate-400">
                        {c.corrected_at ? new Date(c.corrected_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}