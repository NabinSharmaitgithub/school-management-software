"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  bulkSetMarks,
  listClasses,
  listSubjects,
  studentsInClass,
} from "@/lib/data";
import type { BulkMarkStatus, Class, Subject, Student } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Select, StatusPill } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

const TERMS = ["Mid-term", "Final", "Unit Test", "Practical", "Internal Assessment"];
const YEARS = (() => {
  const y = new Date().getFullYear();
  return [`${y - 1}-${String(y).slice(2)}`, `${y}-${String(y + 1).slice(2)}`, `${y + 1}-${String(y + 2).slice(2)}`];
})();

type Row = {
  student: Student;
  marks: string;
  status: BulkMarkStatus;
  remarks: string;
};

type GradeInfo = { pct: number; grade: string };

function gradeInfo(obtained: number, max: number): GradeInfo | null {
  if (!isFinite(obtained) || !isFinite(max) || max <= 0) return null;
  const pct = Math.round((obtained / max) * 100);
  let grade = "F";
  if (pct >= 90) grade = "A+";
  else if (pct >= 75) grade = "A";
  else if (pct >= 60) grade = "B";
  else if (pct >= 40) grade = "C";
  return { pct, grade };
}

function validateMarks(marks: string, max: number): string {
  if (marks.trim() === "") return "";
  const n = Number(marks);
  if (!isFinite(n) || String(marks).trim() === "") return "Enter a valid number";
  if (n < 0) return "Cannot be negative";
  if (n > max) return `Exceeds max (${max})`;
  return "";
}

export default function BulkMarksPage() {
  const scope = useTeacherScope();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYear, setAcademicYear] = useState(YEARS[1]);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [examTerm, setExamTerm] = useState(TERMS[0]);
  const [maxMarks, setMaxMarks] = useState("100");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!scope.ready) return;
    Promise.all([listClasses(), listSubjects()])
      .then(([c, s]) => {
        const allowedClasses = scope.isAdmin
          ? c
          : c.filter((x) => Object.keys(scope.subjectByClass).includes(x.id));
        setClasses(allowedClasses);
        setSubjects(s);
        setGrade(allowedClasses[0]?.name ?? "");
        setSection(
          allowedClasses[0]
            ? allowedClasses.filter((x) => x.name === allowedClasses[0].name)[0]?.section ?? ""
            : ""
        );
      })
      .finally(() => setLoading(false));
  }, [scope]);

  const gradeSections = useMemo(
    () => Array.from(new Set(classes.filter((c) => c.name === grade).map((c) => c.section))),
    [classes, grade]
  );

  const classId = useMemo(
    () => classes.find((c) => c.name === grade && c.section === section)?.id ?? "",
    [classes, grade, section]
  );

  const visibleSubjects = useMemo(
    () =>
      scope.isAdmin
        ? subjects
        : subjects.filter((sub) => scope.subjectByClass[classId]?.includes(sub.id)),
    [subjects, scope, classId]
  );

  useEffect(() => {
    const ok = visibleSubjects.some((s) => s.id === subjectId);
    if (subjectId && !ok) setSubjectId("");
  }, [visibleSubjects, subjectId]);

  const max = useMemo(() => Number(maxMarks) || 0, [maxMarks]);

  useEffect(() => {
    if (!classId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    studentsInClass(classId)
      .then((students) => {
        if (cancelled) return;
        const sorted = [...students].sort((a, b) => {
          const an = parseInt(a.roll_number, 10) || 0;
          const bn = parseInt(b.roll_number, 10) || 0;
          return an - bn || a.name.localeCompare(b.name);
        });
        setRows(sorted.map((s) => ({ student: s, marks: "", status: "marked", remarks: "" })));
        setError("");
      })
      .catch(() => setError("Could not load students for this class."))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classId]);

  function patchRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  const errors = useMemo(
    () =>
      rows.map((r) =>
        r.status === "marked" ? validateMarks(r.marks, r.status === "marked" ? max : max) : ""
      ),
    [rows, max]
  );
  const invalidCount = errors.filter((e) => e !== "").length;

  function applyCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text);
      if (parsed.length < 2) {
        setError("CSV needs a header row and at least one data row.");
        return;
      }
      const header = parsed[0].map((h) => h.trim().toLowerCase());
      const rollIdx = header.findIndex((h) => /roll/.test(h) && !/remarks/.test(h));
      const nameIdx = header.findIndex((h) => /name|student/.test(h));
      const marksIdx = header.findIndex((h) => /mark|score|obtained/.test(h));
      const remarkIdx = header.findIndex((h) => /remark|note/.test(h));
      if (marksIdx < 0 || (rollIdx < 0 && nameIdx < 0)) {
        setError("CSV must have a Marks column and a Roll or Name column.");
        return;
      }
      setRows((prev) => {
        const next = [...prev];
        const byRoll = new Map(next.map((r) => [r.student.roll_number.trim().toLowerCase(), r]));
        const byName = new Map(next.map((r) => [r.student.name.trim().toLowerCase(), r]));
        for (let i = 1; i < parsed.length; i++) {
          const r = parsed[i];
          let row: Row | undefined;
          if (rollIdx >= 0) row = byRoll.get((r[rollIdx] ?? "").trim().toLowerCase());
          if (!row && nameIdx >= 0) row = byName.get((r[nameIdx] ?? "").trim().toLowerCase());
          if (!row) continue;
          const idx = next.indexOf(row);
          patchImmediate(next, idx, { marks: r[marksIdx] ?? "", remarks: (r[remarkIdx] ?? "").trim() });
        }
        return next;
      });
      setError("");
    };
    reader.readAsText(file);
  }

  function patchImmediate(rs: Row[], i: number, patch: Partial<Row>) {
    rs[i] = { ...rs[i], ...patch };
  }

  function downloadTemplate() {
    if (!rows.length) return;
    const lines = ["Roll,Marks,Remarks"];
    for (const r of rows)
      lines.push(`${r.student.roll_number},"${String(r.remarks).replace(/"/g, '""')}",`);
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk-marks-${grade}-${section}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSave() {
    setError("");
    setSavedMsg("");
    if (!classId || !subjectId || !max || max <= 0) {
      setError("Select a class, section, subject and a positive max marks first.");
      return;
    }
    if (!scope.isAdmin && !scope.subjectByClass[classId]?.includes(subjectId)) {
      setError("You can only save marks for subjects you are assigned to.");
      return;
    }
    setSaving(true);
    try {
      await bulkSetMarks(
        rows.map((r, i) => {
          const info = r.status === "marked" ? gradeInfo(Number(r.marks), max) : null;
          return {
            student_id: r.student.id,
            subject_id: subjectId,
            class_id: classId,
            section,
            exam_term: examTerm,
            academic_year: academicYear,
            max_marks: max,
            marks_obtained: r.status === "marked" ? Number(r.marks) : undefined,
            percentage: info?.pct,
            grade: info?.grade,
            status: r.status,
            remarks: r.remarks.trim() || undefined,
          };
        })
      );
      setSavedMsg(`Saved ${rows.length} marks entries.`);
      setConfirmOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !scope.ready) {
    return <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>;
  }

  if (!scope.isAdmin && classes.length === 0) {
    return (
      <div className="space-y-6">
        <header className="glass-panel p-4">
          <h1 className="text-xl font-semibold">Bulk Marks Entry</h1>
        </header>
        <GlassCard className="p-6">
          <p className="text-sm text-on-surface/60">
            No classes assigned to you yet. Ask an admin to assign you as class or subject teacher
            to start entering marks.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Bulk Marks Entry</h1>
          <p className="text-sm text-on-surface/60">
            {rows.length} enrolled students · {invalidCount > 0 && `${invalidCount} row${invalidCount > 1 ? "s" : ""} invalid · `}
            {invalidCount === 0 ? "Ready to save" : "Fix highlighted cells to save"}
          </p>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="ghost" onClick={() => fileRef.current?.click()}>
            <span className="material-symbols-outlined text-lg">upload_file</span>
            Upload CSV
          </GlassButton>
          <GlassButton variant="ghost" onClick={downloadTemplate}>
            <span className="material-symbols-outlined text-lg">download</span>
            Template
          </GlassButton>
          <GlassButton
            onClick={() => {
              setError("");
              setSavedMsg("");
              setConfirmOpen(true);
            }}
            disabled={rows.length === 0 || invalidCount > 0 || !classId || !subjectId || max <= 0}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            Save All
          </GlassButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && applyCsv(e.target.files[0])}
        />
      </header>

      <GlassCard className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <Field label="Academic year">
            <Select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              {YEARS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
          </Field>
          <Field label="Class">
            <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {Array.from(new Set(classes.map((c) => c.name))).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={section} onChange={(e) => setSection(e.target.value)}>
              {gradeSections.length
                ? gradeSections.map((s) => (
                    <option key={s}>{s}</option>
                  ))
                : <option value="">No sections</option>}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
              <option value="">Select…</option>
              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Exam / assessment">
            <Select value={examTerm} onChange={(e) => setExamTerm(e.target.value)}>
              {TERMS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Max marks">
            <Input
              type="number"
              min="1"
              step="1"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              required
            />
          </Field>
        </div>
      </GlassCard>

      {savedMsg && (
        <p className="text-xs text-success bg-emerald-50/70 border border-emerald-200 rounded-lg px-3 py-2">
          {savedMsg}
        </p>
      )}
      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <GlassCard className="p-4 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            No students in this class/section. Pick a class to start entering marks.
          </p>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                <th className="pb-3 pr-4">Roll</th>
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4 w-28">Marks / {max}</th>
                <th className="pb-3 pr-4 w-36">Status</th>
                <th className="pb-3 pr-4">%</th>
                <th className="pb-3 pr-4">Grade</th>
                <th className="pb-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const err = errors[i];
                const info = r.status === "marked" && !err ? gradeInfo(Number(r.marks), max) : null;
                return (
                  <tr key={r.student.id} className="border-t border-on-surface/10 hover:bg-white/40">
                    <td className="py-2 pr-4 text-on-surface/70">{r.student.roll_number}</td>
                    <td className="py-2 pr-4 font-medium text-on-surface">{r.student.name}</td>
                    <td className="py-2 pr-4">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={r.marks}
                        disabled={r.status !== "marked"}
                        onChange={(e) => patchRow(i, { marks: e.target.value })}
                        className={`w-full ${err ? "!border-rose !ring-rose/30 border-2" : ""}`}
                        placeholder={r.status === "marked" ? "0" : "—"}
                      />
                      {err && <p className="text-[10px] text-error mt-0.5">{err}</p>}
                    </td>
                    <td className="py-2 pr-4">
                      <Select
                        value={r.status}
                        onChange={(e) => patchRow(i, { status: e.target.value as BulkMarkStatus, marks: e.target.value === "marked" ? r.marks : "" })}
                        className="w-full"
                      >
                        <option value="marked">Marked</option>
                        <option value="absent">Absent</option>
                        <option value="exempt">Exempt</option>
                      </Select>
                    </td>
                    <td className="py-2 pr-4 text-center font-semibold text-on-surface">
                      {r.status === "marked" ? (err ? "—" : `${info?.pct ?? ""}%`) : "—"}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      {r.status === "marked" && !err && info ? <GradePill grade={info.grade} /> : "—"}
                    </td>
                    <td className="py-2">
                      <Input
                        value={r.remarks}
                        onChange={(e) => patchRow(i, { remarks: e.target.value })}
                        className="w-full"
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </GlassCard>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="glass-panel p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">Save {rows.length} marks entries?</h2>
            <p className="text-sm text-on-surface/70">
              {grade} · {section} · {subjects.find((s) => s.id === subjectId)?.name ?? "Subject"} · {examTerm} ({academicYear}).
              Re-saving overwrites existing entries for this subject & term.
            </p>
            {error && (
              <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : "Save Entries"}
              </GlassButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradePill({ grade }: { grade: string }) {
  const tone =
    grade === "A+" ? "success" : grade === "A" ? "primary" : grade === "B" ? "warning" : grade === "C" ? "neutral" : "error";
  return <StatusPill tone={tone as "success" | "primary" | "warning" | "neutral" | "error"}>{grade}</StatusPill>;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}