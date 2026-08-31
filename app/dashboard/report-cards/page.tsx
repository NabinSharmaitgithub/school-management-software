"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listClasses,
  listStudents,
  listSubjects,
  listMarks,
  listAttendance,
  getSchoolSettings,
} from "@/lib/data";
import type { Class, Subject, Mark, AttendanceEntry, SchoolSettings } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select } from "@/components/ui";

type Style = "Modern" | "Classic" | "Compact";

const GRADE_BANDS: [number, string, number][] = [
  [90, "A+", 4.0],
  [80, "A", 3.6],
  [70, "B+", 3.2],
  [60, "B", 2.8],
  [50, "C", 2.4],
  [35, "D", 2.0],
  [0, "F", 0.0],
];

function grade(pct: number) {
  return GRADE_BANDS.find(([t]) => pct >= t)?.[1] ?? "F";
}
function gpa(pct: number) {
  return GRADE_BANDS.find(([t]) => pct >= t)?.[2] ?? 0;
}

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; roll_number: string; class_id: string; guardian?: string; phone?: string; gender?: string; address?: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState("");
  const [style, setStyle] = useState<Style>("Modern");
  const [inclAttendance, setInclAttendance] = useState(true);
  const [inclRemarks, setInclRemarks] = useState(true);
  const [inclRank, setInclRank] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, st, su, m, a, set] = await Promise.all([
          listClasses(),
          listStudents(),
          listSubjects(),
          listMarks(),
          listAttendance(),
          getSchoolSettings(),
        ]);
        setClasses(c);
        setStudents(
          st.map((s) => ({ id: s.id, name: s.name, roll_number: s.roll_number, class_id: s.class_id, guardian: s.guardian, phone: s.phone, gender: s.gender, address: s.address }))
        );
        setSubjects(su);
        setMarks(m);
        setAttendance(a);
        setSettings(set);
        setClassId(c[0]?.id ?? "");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const classStudents = useMemo(
    () => students.filter((s) => s.class_id === classId),
    [students, classId]
  );

  const terms = useMemo(() => {
    const ids = new Set(classStudents.map((s) => s.id));
    const ts = Array.from(new Set(marks.filter((m) => ids.has(m.student_id)).map((m) => m.exam_term)));
    return ts.length ? ts : ["Mid Term", "Final Term"];
  }, [marks, classStudents]);

  useEffect(() => {
    if (term === "" && terms.length) setTerm(terms[0]);
  }, [terms, term]);

  const student = classStudents[0];

  const rows = useMemo(() => {
    if (!student) return [];
    return subjects
      .map((sub) => {
        const m = marks.find((x) => x.student_id === (student as { id: string }).id && x.subject_id === sub.id && x.exam_term === term);
        if (!m) return null;
        const theory = m.marks_obtained;
        const practical = m.has_practical ? (m.practical_marks ?? 0) : 0;
        const maxTheory = m.max_marks;
        const maxPrac = m.has_practical ? (m.max_practical_marks ?? 0) : 0;
        const total = theory + practical;
        const maxT = maxTheory + maxPrac;
        const pct = maxT ? (total / maxT) * 100 : 0;
        return { subject: sub.name, theory, practical, total, max: maxT, pct, grade: grade(pct), gpa: gpa(pct) };
      })
      .filter(Boolean) as { subject: string; theory: number; practical: number; total: number; max: number; pct: number; grade: string; gpa: number }[];
  }, [student, subjects, marks, term]);

  const sumTotal = rows.reduce((s, r) => s + r.total, 0);
  const sumMax = rows.reduce((s, r) => s + r.max, 0);
  const overall = sumMax ? Math.round((sumTotal / sumMax) * 100) : 0;
  const overallGpa = rows.length ? Math.round((rows.reduce((s, r) => s + r.gpa, 0) / rows.length) * 100) / 100 : 0;
  const passed = rows.every((r) => r.pct >= 35);

  const attendancePct = useMemo(() => {
    if (!student) return 100;
    const recs = attendance.filter((a) => a.student_id === student.id);
    if (!recs.length) return 100;
    const attended = recs.filter((a) => a.status !== "absent").length;
    return Math.round((attended / recs.length) * 1000) / 10;
  }, [attendance, student]);

  const classRank = useMemo(() => {
    if (!student) return 1;
    const avgs = classStudents.map((s) => {
      const ms = marks.filter((m) => m.student_id === s.id && m.exam_term === term);
      if (!ms.length) return 0;
      return ms.reduce((acc, m) => acc + (m.max_marks ? (m.marks_obtained / m.max_marks) * 100 : 0), 0) / ms.length;
    });
    const idx = classStudents.findIndex((s) => s.id === student.id);
    const myVal = idx >= 0 ? avgs[idx] : 0;
    return myVal ? avgs.filter((v) => v > myVal).length + 1 : classStudents.length || 1;
  }, [student, classStudents, marks, term]);

  const className = classes.find((c) => c.id === classId)?.name ?? "";
  const section = classes.find((c) => c.id === classId)?.section ?? "";

  function onPrint() {
    window.print();
  }

  return (
    <div className="space-y-6 print:space-y-0">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Report Card Studio</h1>
          <p className="text-sm text-on-surface/60">School profile, and generate class reports</p>
        </div>
        <GlassButton onClick={onPrint}>
          <span className="material-symbols-outlined text-lg">download</span>
          Download PDF
        </GlassButton>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2 print:hidden">{error}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
        {/* ── Configuration ─────────────────────────────────── */}
        <GlassCard className="lg:col-span-3 p-4 space-y-5 print:hidden">
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary/60">filter_list</span>
              Target Selection
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class">
                <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Exam Term">
                <Select value={term} onChange={(e) => setTerm(e.target.value)}>
                  {terms.length === 0 && <option>—</option>}
                  {terms.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary/60">palette</span>
              Template Style
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {(["Modern", "Classic", "Compact"] as Style[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    style === s ? "border-primary bg-primary/15 text-primary font-semibold" : "border-white/70 hover:bg-white/50 text-on-surface/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Inclusions</h2>
            <div className="space-y-2">
              {[
                ["Attendance summary", inclAttendance, setInclAttendance],
                ["Class teacher remarks", inclRemarks, setInclRemarks],
                ["Class rank", inclRank, setInclRank],
              ].map(([label, val, set]) => (
                <label key={label as string} className="flex items-center gap-2 text-sm text-on-surface/80 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#6366F1]"
                    checked={val as boolean}
                    onChange={(e) => (set as (b: boolean) => void)(e.target.checked)}
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-on-surface/10">
            <p className="text-xs text-on-surface/50 mb-2">
              Previewing: <span className="font-medium text-on-surface">{student?.name ?? "—"}</span> ({classStudents.length} students in class)
            </p>
            <GlassButton className="w-full">
              <span className="material-symbols-outlined text-lg">play_circle</span>
              Generate for Class
            </GlassButton>
          </div>
        </GlassCard>

        {/* ── Preview ───────────────────────────────────────── */}
        <div className="lg:col-span-6">
          {!student ? (
            <GlassCard className="p-8 text-center text-sm text-on-surface/60">No students in this selection.</GlassCard>
          ) : loading ? (
            <GlassCard className="p-8 text-center text-sm text-on-surface/60">Loading…</GlassCard>
          ) : (
            <div key={student.id} className="bg-white rounded-xl border border-white/80 shadow-lg p-8 max-w-[850px] mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex items-center gap-5">
                  {settings?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logo_url} alt="logo" className="w-[70px] h-[70px] rounded-full object-cover shadow" />
                  ) : (
                    <div className="w-[70px] h-[70px] rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-2xl">
                      {(settings?.school_name ?? "S").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "S"}
                    </div>
                  )}
                  <div>
                    <h1 className="text-[26px] font-bold text-slate-900 leading-tight">{settings?.school_name ?? "School"}</h1>
                    <p className="text-sm text-slate-500">{settings?.school_address ?? ""} · Academic Session {new Date().getFullYear() - 1}–{new Date().getFullYear()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-blue-600 uppercase tracking-wider">Grade Sheet</h2>
                  <span className="text-xs text-slate-500">{term}</span>
                </div>
              </div>

              {/* Student details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Student Name</span>
                    <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Class & Roll No.</span>
                    <span className="text-sm font-semibold text-slate-800">{className}{section ? `-${section}` : ""} (Roll: {student.roll_number})</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Father's Name</span>
                    <span className="text-sm font-semibold text-slate-800">{student.guardian ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Contact Number</span>
                    <span className="text-sm font-semibold text-slate-800">{student.phone ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Gender</span>
                    <span className="text-sm font-semibold text-slate-800">{student.gender ?? "—"}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Permanent Address</span>
                    <span className="text-sm font-semibold text-slate-800">{student.address ?? "—"}</span>
                  </div>
                </div>
              </div>

              {/* Marks table */}
              <div className="w-full overflow-x-auto mb-6">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">S.N.</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide">Subject</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">Theory</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">Practical</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">Total</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">Percentage</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">Grade</th>
                      <th className="py-3 px-3.5 text-xs font-semibold uppercase tracking-wide text-center">GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.subject} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{i + 1}</td>
                        <td className="py-3 px-3.5 text-sm font-semibold border-b border-slate-200">{r.subject}</td>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{r.theory}</td>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{r.practical}</td>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{r.total}</td>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{r.pct.toFixed(2)}%</td>
                        <td className="py-3 px-3.5 text-sm font-bold border-b border-slate-200 text-center">{r.grade}</td>
                        <td className="py-3 px-3.5 text-sm border-b border-slate-200 text-center">{r.gpa.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Total Marks</p>
                  <p className="text-lg font-bold text-slate-900">{sumTotal} / {sumMax}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Percentage</p>
                  <p className="text-lg font-bold text-slate-900">{overall}%</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Overall GPA</p>
                  <p className="text-lg font-bold text-slate-900">{overallGpa.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Final Grade</p>
                  <p className="text-lg font-bold text-slate-900">{grade(overall)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase text-slate-500">Result</p>
                  <span className={`inline-block text-sm font-bold px-3 py-0.5 rounded-full mt-1 ${passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{passed ? "PASS" : "FAIL"}</span>
                </div>
              </div>

              {inclAttendance && (
                <div className="flex justify-center mb-4 text-sm text-slate-600">
                  Attendance: <span className="font-semibold ml-1">{attendancePct}%</span>
                </div>
              )}
              {inclRank && (
                <p className="text-center text-sm text-slate-600 mb-4">Class Rank: <span className="font-semibold">#{classRank} of {classStudents.length || 1}</span></p>
              )}

              {/* Signatures */}
              <div className="flex justify-between mt-8 pt-5">
                {["Class Teacher", "Coordinator", "Principal"].map((s) => (
                  <div key={s} className="text-center w-1/4">
                    <div className="border-t border-slate-300 mb-2"></div>
                    <p className="text-sm font-semibold text-slate-500">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .print\\:space-y-0 > *, header, aside { display: none !important; } main, main * { visibility: visible; } main { position: absolute; inset: 0; overflow: visible; } main > div { visibility: visible; } main > div > div:last-child > div:last-child { visibility: visible; } }`}</style>
    </div>
  );
}