"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listStudents,
  listClasses,
  listGraduatedStudents,
  promoteStudent,
  promoteClass,
  listPromotionHistory,
} from "@/lib/data";
import type { Student, Class, PromotionRecord } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { Card, Button, Select, StatusPill, Alert, EmptyState } from "@/components/ui";

export default function PromotionPage() {
  const scope = useTeacherScope();
  const [students, setStudents] = useState<Student[]>([]);
  const [graduated, setGraduated] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [history, setHistory] = useState<PromotionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [destClass, setDestClass] = useState("");
  const [academicYear, setAcademicYear] = useState("2026 - 2027");
  const [saving, setSaving] = useState(false);
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkTo, setBulkTo] = useState("");
  const [bulkYear, setBulkYear] = useState("2026 - 2027");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [yearFilter, setYearFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c, h, g] = await Promise.all([
          listStudents(),
          listClasses(),
          listPromotionHistory(),
          listGraduatedStudents(),
        ]);
        if (cancelled) return;
        setStudents(s);
        setClasses(c);
        setHistory(h);
        setGraduated(g);
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
      const [s, h] = await Promise.all([listStudents(), listPromotionHistory()]);
      setStudents(s);
      setHistory(h);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Whole-class promotion: active students of source class, not yet promoted this session
  const bulkCount = useMemo(
    () =>
      bulkFrom
        ? students.filter(
            (s) => s.class_id === bulkFrom && !history.some((h) => h.student_id === s.id && h.academic_year === bulkYear)
          ).length
        : 0,
    [students, history, bulkFrom, bulkYear]
  );

  async function onBulkPromote(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!bulkFrom || !bulkTo || !bulkYear) {
      setError("Please select the class, destination class, and academic year.");
      return;
    }
    if (bulkFrom === bulkTo) {
      setError("Destination class must be different from the source class.");
      return;
    }
    setBulkSaving(true);
    try {
      const res = await promoteClass(bulkFrom, bulkTo, bulkYear, scope.email ?? "admin");
      setSuccess(
        `Promoted ${res.promoted} of ${res.total} students` +
          (res.skipped ? ` (${res.skipped} already promoted this session)` : "") +
          `.`
      );
      setBulkFrom("");
      setBulkTo("");
      const [s, h] = await Promise.all([listStudents(), listPromotionHistory()]);
      setStudents(s);
      setHistory(h);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBulkSaving(false);
    }
  }

  // History filters: by academic session and by class involved (from or to)
  const years = useMemo(
    () => Array.from(new Set(history.map((h) => h.academic_year))).sort().reverse(),
    [history]
  );
  const visibleHistory = useMemo(
    () =>
      history.filter(
        (h) =>
          (!yearFilter || h.academic_year === yearFilter) &&
          (!classFilter || h.from_class_id === classFilter || h.to_class_id === classFilter)
      ),
    [history, yearFilter, classFilter]
  );

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

      <Card className="p-4">
        <h2 className="font-semibold text-slate-900 mb-1 text-sm">Promote Entire Class</h2>
        <p className="text-xs text-slate-500 mb-4">
          Moves every active student of the class in one go. Students already promoted this session are skipped.
        </p>
        <form onSubmit={onBulkPromote} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Class *</label>
            <Select
              value={bulkFrom}
              onChange={(e) => { setBulkFrom(e.target.value); setBulkTo(""); }}
            >
              <option value="">Select class…</option>
              {destOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </Select>
            <p className="text-xs text-slate-500">
              {bulkFrom ? `${bulkCount} student${bulkCount !== 1 ? "s" : ""} to promote this session` : "—"}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Destination Class *</label>
            <Select value={bulkTo} onChange={(e) => setBulkTo(e.target.value)}>
              <option value="">Select class…</option>
              {(classes.find((c) => c.id === bulkFrom) ? destOptions.filter((o) => o.id !== bulkFrom) : destOptions).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Academic Year *</label>
            <Select value={bulkYear} onChange={(e) => setBulkYear(e.target.value)}>
              <option value="2026 - 2027">2026 - 2027</option>
              <option value="2027 - 2028">2027 - 2028</option>
            </Select>
          </div>
          <Button type="submit" disabled={bulkSaving || !bulkFrom || !bulkTo || bulkCount === 0}>
            {bulkSaving ? "Promoting…" : "Promote Class"}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Current Students</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
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
                    <tr key={s.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-slate-900">{s.name}</td>
                      <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-600">{s.roll_number}</td>
                      <td className="py-3.5 pr-4 hidden md:table-cell text-slate-600">{cls ? `${cls.name} ${cls.section}` : s.class_id}</td>
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
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} aria-label="Filter by academic year">
              <option value="">All sessions</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class">
              <option value="">All classes</option>
              {destOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </Select>
          </div>
          {visibleHistory.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              {history.length === 0 ? "No promotions recorded yet." : "No promotions match the filters."}
            </p>
          )}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {visibleHistory.map((h) => {
              // Names come from the record snapshot; fall back to active/passed-out lookups for old entries
              const st = students.find((s) => s.id === h.student_id) ?? graduated.find((s) => s.id === h.student_id);
              const name = h.student_name ?? st?.name ?? h.student_id;
              const fromCls = classes.find((c) => c.id === h.from_class_id);
              const toCls = classes.find((c) => c.id === h.to_class_id);
              return (
                <div key={h.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {fromCls ? `${fromCls.name} ${fromCls.section}` : h.from_class_id} →{" "}
                    {toCls ? `${toCls.name} ${toCls.section}` : h.to_class_id}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {h.academic_year} · {h.promoted_by} ·{" "}
                    {new Date(h.promoted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
