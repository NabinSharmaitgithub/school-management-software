"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listClasses,
  listStudents,
  listSubjects,
  listMarks,
  listAttendance,
} from "@/lib/data";
import type { Class, Subject, Mark, AttendanceEntry } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select } from "@/components/ui";

type Style = "Modern" | "Classic" | "Compact";

const GRADE_BANDS: [number, string][] = [
  [90, "A+"],
  [80, "A"],
  [70, "B+"],
  [60, "B"],
  [50, "C"],
  [35, "D"],
  [0, "F"],
];

function grade(pct: number) {
  return GRADE_BANDS.find(([t]) => pct >= t)?.[1] ?? "F";
}

export default function ReportCardsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; roll_number: string; class_id: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
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
        const [c, st, su, m, a] = await Promise.all([
          listClasses(),
          listStudents(),
          listSubjects(),
          listMarks(),
          listAttendance(),
        ]);
        setClasses(c);
        setStudents(
          st.map((s) => ({ id: s.id, name: s.name, roll_number: s.roll_number, class_id: s.class_id }))
        );
        setSubjects(su);
        setMarks(m);
        setAttendance(a);
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
        const pct = m.max_marks ? (m.marks_obtained / m.max_marks) * 100 : 0;
        return { subject: sub.name, obtained: m.marks_obtained, max: m.max_marks, pct, grade: grade(pct) };
      })
      .filter(Boolean) as { subject: string; obtained: number; max: number; pct: number; grade: string }[];
  }, [student, subjects, marks, term]);

  const overall = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;

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
            <div className={style === "Classic" ? "bg-white rounded-xl border border-white/80 shadow-lg p-6" : style === "Compact" ? "bg-white rounded-xl border border-white/80 p-4" : "bg-gradient-to-br from-white to-white/80 backdrop-blur rounded-2xl border border-white shadow-xl p-6"}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-on-surface/10 pb-4 mb-4">
                <div>
                  <p className="text-lg font-bold text-primary">{style === "Classic" ? "Springfield High School" : "Greenwood International School"}</p>
                  <p className="text-xs text-on-surface/50">Excellence in Education · Official Academic Report</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{term}</p>
                  <p className="text-xs text-on-surface/50">{new Date().getFullYear()}</p>
                </div>
              </div>

              {/* Student info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div>
                  <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Student Name</p>
                  <p className="text-sm font-semibold text-on-surface">{student.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Student ID</p>
                  <p className="text-sm font-medium text-on-surface">SHS-{student.roll_number}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Grade &amp; Section</p>
                  <p className="text-sm font-medium text-on-surface">{className} · {section}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Roll Number</p>
                  <p className="text-sm font-medium text-on-surface">{student.roll_number}</p>
                </div>
              </div>

              {/* Marks table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-on-surface/50 border-b border-on-surface/10">
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-center">Marks</th>
                    <th className="py-2 text-center">Max</th>
                    <th className="py-2 text-center">%</th>
                    <th className="py-2 text-center">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.subject} className="border-b border-on-surface/5">
                      <td className="py-2 font-medium">{r.subject}</td>
                      <td className="py-2 text-center">{r.obtained}</td>
                      <td className="py-2 text-center text-on-surface/50">{r.max}</td>
                      <td className="py-2 text-center">{Math.round(r.pct)}%</td>
                      <td className="py-2 text-center">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white" style={{ backgroundColor: gradeColor(r.grade) }}>
                          {r.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2 pt-3">Overall Performance</td>
                    <td colSpan={2} className="py-2 pt-3 text-center">{rows.length ? `${Math.round(rows.reduce((s, r) => s + r.obtained, 0))}/${rows.reduce((s, r) => s + r.max, 0)}` : "—"}</td>
                    <td className="py-2 pt-3 text-center">{overall}%</td>
                    <td className="py-2 pt-3 text-center text-primary">{grade(overall)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Inclusions */}
              {(inclAttendance || inclRank) && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {inclAttendance && (
                    <div className="rounded-lg bg-white/60 border border-white/80 px-3 py-2 text-sm">
                      <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Attendance</p>
                      <p className="font-semibold">{attendancePct}%</p>
                    </div>
                  )}
                  {inclRank && (
                    <div className="rounded-lg bg-white/60 border border-white/80 px-3 py-2 text-sm">
                      <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Class Rank</p>
                      <p className="font-semibold">#{classRank} of {classStudents.length || 1}</p>
                    </div>
                  )}
                </div>
              )}

              {inclRemarks && (
                <div className="mt-5 rounded-lg bg-white/60 border border-white/80 px-3 py-2">
                  <p className="text-[10px] uppercase text-on-surface/40 font-semibold mb-1">Class Teacher&apos;s Remarks</p>
                  <p className="text-sm text-on-surface/80 italic">
                    &ldquo;{student.name} has shown steady progress this {term.toLowerCase()}.{" "}
                    {overall >= 80 ? "Consistent effort and keen participation in class discussions." : overall >= 60 ? "Solid performance with room to push further in the coming term." : "Needs to focus on consistent revision to close the gap."}{" "}
                    Keep up the good attitude.&rdquo;
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between mt-6 pt-4 border-t border-on-surface/10">
                <div className="text-center">
                  <p className="text-sm font-medium border-t border-on-surface/30 pt-1 px-4">Class Teacher</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium border-t border-on-surface/30 pt-1 px-4">Principal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .print\\:space-y-0 > *, header, aside { display: none !important; } main, main * { visibility: visible; } main { position: absolute; inset: 0; overflow: visible; } main > div { visibility: visible; } main > div > div:last-child > div:last-child { visibility: visible; } }`}</style>
    </div>
  );
}

function gradeColor(g: string) {
  return { "A+": "#16A34A", A: "#22C55E", "B+": "#0EA5E9", B: "#3B82F6", C: "#F59E0B", D: "#F97316", F: "#EF4444" }[g] ?? "#8B8B9A";
}