"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  listClasses,
  listStudents,
  listSubjects,
  listMarks,
  listAttendance,
  listExams,
  getSchoolSettings,
} from "@/lib/data";
import type { Class, Subject, Mark, AttendanceEntry, SchoolSettings, Exam } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select } from "@/components/ui";

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
  const [students, setStudents] = useState<{ id: string; name: string; roll_number: string; class_id: string; guardian?: string; phone?: string; gender?: string; father_name?: string; mother_name?: string; dob?: string; address?: string }[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [term, setTerm] = useState("");
  const [inclAttendance, setInclAttendance] = useState(true);
  const [inclRemarks, setInclRemarks] = useState(true);
  const [inclRank, setInclRank] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, st, su, m, a, e, set] = await Promise.all([
          listClasses(),
          listStudents(),
          listSubjects(),
          listMarks(),
          listAttendance(),
          listExams(),
          getSchoolSettings(),
        ]);
        setClasses(c);
        setStudents(
          st.map((s) => ({ id: s.id, name: s.name, roll_number: s.roll_number, class_id: s.class_id, guardian: s.guardian, phone: s.phone, gender: s.gender, father_name: s.father_name, mother_name: s.mother_name, dob: s.dob, address: s.address }))
        );
        setSubjects(su);
        setMarks(m);
        setAttendance(a);
        setExams(e);
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

  const terms = useMemo(
    () => exams.map((e) => e.name),
    [exams]
  );

  useEffect(() => {
    if (term === "" && terms.length) setTerm(terms[0]);
  }, [terms, term]);

  const student = classStudents.find((s) => s.id === studentId) ?? classStudents[0];

  useEffect(() => {
    if (classStudents[0]?.id !== studentId) setStudentId(classStudents[0]?.id ?? "");
  }, [classId]);

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

  const tabulation = useMemo(() => {
    const idOf = (name: string) => subjects.find((x) => x.name === name)?.id;
    const columns = subjects
      .map((s) => s.name)
      .filter((name) =>
        marks.some(
          (m) => m.exam_term === term && m.subject_id === idOf(name) && classStudents.some((s2) => s2.id === m.student_id)
        )
      );
    const rows = classStudents.map((st) => {
      let total = 0, max = 0, gpaSum = 0, n = 0, pass = true;
      const cells = columns.map((name) => {
        const m = marks.find((x) => x.student_id === st.id && x.subject_id === idOf(name) && x.exam_term === term);
        if (!m) return null;
        const t = m.marks_obtained + (m.has_practical ? (m.practical_marks ?? 0) : 0);
        const mx = m.max_marks + (m.has_practical ? (m.max_practical_marks ?? 0) : 0);
        total += t; max += mx; n++;
        const pct = mx ? (t / mx) * 100 : 0;
        gpaSum += gpa(pct);
        if (pct < 35) pass = false;
        return t;
      });
      return { st, cells, total, max, pct: max ? (total / max) * 100 : 0, grade: max ? grade((total / max) * 100) : "F", gpa: n ? gpaSum / n : 0, pass };
    });
    return {
      columns,
      rows: rows.map((r) => ({ ...r, rank: r.pct ? rows.filter((x) => x.pct > r.pct).length + 1 : rows.length || 1 })),
    };
  }, [classStudents, subjects, marks, term]);

  function exportCsv() {
    const { columns, rows } = tabulation;
    if (!rows.length) return;
    const esc = (v: string | number | null) => {
      const s = v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = ["Roll No.", "Student Name", ...columns, "Total Marks", "Percentage", "Grade", "GPA", "Rank", "Result"];
    const lines = [head.map(esc).join(",")];
    for (const r of rows)
      lines.push(
        [r.st.roll_number, r.st.name, ...r.cells.map((c) => esc(c)), r.total, `${r.pct.toFixed(2)}%`, r.grade, r.gpa.toFixed(2), r.rank, r.pass ? "PASS" : "FAIL"]
          .map(esc)
          .join(",")
      );
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabulation-${`${className}${section}`.trim().replace(/\s+/g, "_") || "class"}-${term.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const className = classes.find((c) => c.id === classId)?.name ?? "";
  const section = classes.find((c) => c.id === classId)?.section ?? "";

  async function onPrint() {
    const el = reportRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      // Render at higher resolution so text stays crisp; we measure the REAL
      // rendered height here, never a fixed A4-multiple.
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/jpeg", 0.95);

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();   // 595.28 pt
      const pageH = pdf.internal.pageSize.getHeight();  // 841.89 pt

      // Fit width -> exact px->pt ratio from the real canvas.
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;

      // Page count derived from actual content height (never a fixed A4-multiple).
      // ceil() never leaves a trailing blank page: the last page always draws
      // whatever real content overflows, and a content-height exact multiple
      // yields exactly that many pages.
      const pages = Math.max(1, Math.ceil(imgH / pageH));
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, -(i * pageH), imgW, imgH);
      }

      console.log(
        `Report card PDF: canvas=${canvas.width}x${canvas.height}px, ` +
        `content height=${imgH.toFixed(1)}pt, page height=${pageH}pt, pages=${pdf.getNumberOfPages()}`
      );

      pdf.save(`report-card-${student?.name?.replace(/\s+/g, "_") ?? "student"}.pdf`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6 print:space-y-0">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Report Card Studio</h1>
          <p className="text-sm text-on-surface/60">School profile, and generate class reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton onClick={onPrint} disabled={downloading}>
            <span className="material-symbols-outlined text-lg">download</span>
            {downloading ? "Generating…" : "Download PDF"}
          </GlassButton>
          <GlassButton variant="ghost" onClick={exportCsv} disabled={!tabulation.rows.length}>
            <span className="material-symbols-outlined text-lg">grid_on</span>
            Export Class CSV
          </GlassButton>
        </div>
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
          <div>
              <Field label="Student">
                <Select value={student?.id ?? ""} onChange={(e) => setStudentId(e.target.value)}>
                  {classStudents.length === 0 && <option>—</option>}
                  {classStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.roll_number ? `${s.roll_number} · ` : ""}{s.name}</option>
                  ))}
                </Select>
              </Field>
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
          </div>
        </GlassCard>

        {/* ── Preview ───────────────────────────────────────── */}
        <div className="lg:col-span-6">
          {!student ? (
            <GlassCard className="p-8 text-center text-sm text-on-surface/60">No students in this selection.</GlassCard>
          ) : loading ? (
            <GlassCard className="p-8 text-center text-sm text-on-surface/60">Loading…</GlassCard>
          ) : (
            <div ref={reportRef} key={`print-${student.id}`} className="bg-white rounded-xl border border-white/80 shadow-lg p-8 max-w-[850px] mx-auto print:shadow-none print:border-0 print:p-0">
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
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Date of Birth</span>
                    <span className="text-sm font-semibold text-slate-800">{student.dob ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Contact Number</span>
                    <span className="text-sm font-semibold text-slate-800">{student.phone ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Father's Name</span>
                    <span className="text-sm font-semibold text-slate-800">{student.father_name ?? student.guardian ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold uppercase text-slate-500">Mother's Name</span>
                    <span className="text-sm font-semibold text-slate-800">{student.mother_name ?? "—"}</span>
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
    </div>
  );
}