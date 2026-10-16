"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listStudents,
  listClasses,
  promoteStudent,
  listPromotionHistory,
} from "@/lib/data";
import type { Student, Class, PromotionRecord } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { Card, Button, Select, StatusPill, Alert, EmptyState } from "@/components/ui";

export default function PromotionPage() {
  const scope = useTeacherScope();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [history, setHistory] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [destClass, setDestClass] = useState("");
  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c, h] = await Promise.all([
          listStudents(),
          listClasses(),
          listPromotionHistory(),
        ]);
        if (cancelled) return;
        setStudents(s);
        setClasses(c);
        setHistory(h);
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

  const eligibleStudents = useMemo(() => {
    return students.filter((s) => !s.archived);
  }, [students]);

  const studentOptions = useMemo(() => {
    return eligibleStudents.map((s) => ({
      id: s.id,
      label: `${s.name} (${s.roll_number}) — ${classes.find((c) => c.id === s.class_id)?.name ?? ""}`,
      currentClass: s.class_id,
    }));
  }, [eligibleStudents, classes]);

  const destOptions = useMemo(() => {
    return allowedClasses.map((c) => ({
      id: c.id,
      label: `${c.name} ${c.section}`,
    }));
  }, [allowedClasses]);

  async function onPromote(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedStudent || !destClass || !academicYear) {
      setError("Please select a student, destination class, and academic year.");
      return;
    }
    const st = students.find((s) => s.id === selectedStudent);
    if (!st) return;
    if (st.class_id === destClass) {
      setError("Student is already in the selected destination class.");
      return;
    }
    setSaving(true);
    try {
      await promoteStudent(selectedStudent, destClass, academicYear, scope.email ?? "admin");
      setSuccess(`Promoted ${st.name} to ${classes.find((c) => c.id === destClass)?.name ?? ""}.`);
      setSelectedStudent("");
      setDestClass("");
      // Refresh
      const [s, h] = await Promise.all([listStudents(), listPromotionHistory()]);
      setStudents(s);
      setHistory(h);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading promotion data…
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
          <h1 className="text-xl font-semibold text-slate-900">Student Promotion</h1>
          <p className="text-sm text-slate-500">
            Promote students to the next class and academic session.
          </p>
        </div>
        {success && (
          <Alert message={success} type="success" />
        )}
      </header>

      <Card className="p-4">
        <form onSubmit={onPromote} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Student *</label>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select student…</option>
              {studentOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Destination Class *</label>
            <Select value={destClass} onChange={(e) => setDestClass(e.target.value)}>
              <option value="">Select class…</option>
              {destOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Academic Year *</label>
            <Select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              <option value="2026 - 2027">2026 - 2027</option>
              <option value="2027 - 2028">2027 - 2028</option>
            </Select>
          </div>
          <Button type="submit" disabled={saving || !selectedStudent || !destClass}>
            {saving ? "Promoting…" : "Promote Student"}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Current Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-e2e8f0">
                  <th className="pb-3.5 pr-4">Student</th>
                  <th className="pb-3.5 pr-4 hidden sm:table-cell">Roll No</th>
                  <th className="pb-3.5 pr-4 hidden md:table-cell">Current Class</th>
                  <th className="pb-3.5 text-right">Eligible</th>
                </tr>
              </thead>
              <tbody>
                {eligibleStudents.length === 0 && (
                  <tr>
                    <td className="py-8 text-center text-slate-500" colSpan={4}>
                      No students found.
                    </td>
                  </tr>
                )}
                {eligibleStudents.map((s) => {
                  const cls = classes.find((c) => c.id === s.class_id);
                  return (
                    <tr key={s.id} className="border-b border-e2e8f0 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-600">
                        {s.roll_number}
                      </td>
                      <td className="py-3.5 pr-4 hidden md:table-cell text-slate-600">
                        {cls ? `${cls.name} ${cls.section}` : s.class_id}
                      </td>
                      <td className="py-3.5 text-right">
                        <StatusPill tone="success">Yes</StatusPill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-1 p-4">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Promotion History</h2>
          {history.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              No promotions recorded yet.
            </p>
          )}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {history.map((h) => {
              const st = students.find((s) => s.id === h.student_id);
              const fromCls = classes.find((c) => c.id === h.from_class_id);
              const toCls = classes.find((c) => c.id === h.to_class_id);
              return (
                <div key={h.id} className="p-3 rounded-lg border border-e2e8f0 bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">
                    {st?.name ?? h.student_id}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {fromCls ? `${fromCls.name} ${fromCls.section}` : h.from_class_id} →{" "}
                    {toCls ? `${toCls.name} ${toCls.section}` : h.to_class_id}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {h.academic_year} · {h.promoted_by} ·{" "}
                    {new Date(h.promoted_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
