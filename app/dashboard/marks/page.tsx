"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listMarks,
  addMark,
  deleteMark,
  listStudents,
  studentNames,
  subjectNames,
  listExams,
  listClasses,
} from "@/lib/data";
import { Field, GlassButton, GlassCard, GradePill, Input, Modal, Select, StatusPill, Alert } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

type Mark = { id: string; student_id: string; class_id?: string; subject_id: string; exam_term: string; marks_obtained: number; max_marks: number; has_practical?: boolean; max_practical_marks?: number; practical_marks?: number };

export default function MarksPage() {
  const scope = useTeacherScope();
  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({});
  const [studentClass, setStudentClass] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<Record<string, string>>({});
  const [exams, setExams] = useState<{ id: string; name: string; academic_year: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    class_id: "",
    student_id: "",
    subject_id: "",
    exam_term: "",
    has_practical: false,
    marks_obtained: "",
    max_marks: "100",
    practical_marks: "",
    max_practical_marks: "25",
  });

  async function load() {
    try {
      const [m, s, subj, e, cls] = await Promise.all([listMarks(), studentNames(), subjectNames(), listExams(), listClasses()]);
      const studs = await listStudents();
      const classOf: Record<string, string> = {};
      for (const st of studs) classOf[st.id] = st.class_id;
      let visible = m;
      if (!scope.isAdmin) {
        visible = m.filter((mk) => {
          const cid = classOf[mk.student_id];
          return !!cid && scope.subjectByClass[cid]?.includes(mk.subject_id);
        });
      }
      setMarks(visible);
      setStudentClass(classOf);
      setClasses(cls);
      setSubjects(subj);
      setExams(e);
      setForm((f) => ({ ...f, exam_term: e.some((x) => x.name === f.exam_term) ? f.exam_term : (e[0]?.name ?? "") }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (scope.ready) load();
  }, [scope.ready]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const obtained = Number(form.marks_obtained);
    const max = Number(form.max_marks);
    const practical = Number(form.practical_marks);
    const maxPractical = Number(form.max_practical_marks);
    if (!form.class_id || !form.student_id || !form.subject_id || !form.exam_term || !isFinite(obtained) || !isFinite(max) || max <= 0) {
      setError("Class, student, subject, exam, marks and max marks are required (max > 0).");
      return;
    }
    if (form.has_practical && (!isFinite(practical) || !isFinite(maxPractical) || maxPractical <= 0)) {
      setError("Practical marks and max practical marks are required (max > 0).");
      return;
    }
    setSaving(true);
    try {
      await addMark({
        student_id: form.student_id,
        class_id: form.class_id,
        subject_id: form.subject_id,
        exam_term: form.exam_term,
        marks_obtained: obtained,
        max_marks: max,
        has_practical: form.has_practical,
        max_practical_marks: form.has_practical ? maxPractical : undefined,
        practical_marks: form.has_practical ? practical : undefined,
      });
      setAddOpen(false);
      setForm((f) => ({ ...f, student_id: "", subject_id: "", has_practical: false, marks_obtained: "", practical_marks: "" }));
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm) return;
    await deleteMark(confirm);
    setConfirm(null);
    load();
  }

  const classOptions = classes
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name }));
  const studentOptions = Object.entries(students)
    .filter(([id]) => !form.class_id || studentClass[id] === form.class_id)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));
  const subjectOptions = Object.entries(subjects)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Marks & Gradebook</h1>
          <p className="text-sm text-on-surface/60">{marks.length} entries recorded</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/marks/bulk"
            className="glass-btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">grid_on</span>
            Bulk Entry
          </Link>
          {scope.isAdmin && (
            <GlassButton onClick={() => setAddOpen(true)}>
              <span className="material-symbols-outlined text-lg">add</span>
              Add Marks
            </GlassButton>
          )}
        </div>
      </header>

      <GlassCard className="p-4">
        {loading || !scope.ready ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
        ) : marks.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            No marks yet. Click “Add Marks” to record the first entry.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Subject</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Term</th>
                <th className="pb-3 pr-4 text-right">Score</th>
                <th className="pb-3 pr-4 text-center">%</th>
                <th className="pb-3 text-center">Grade</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => {
                const totalMax = m.max_marks + (m.has_practical ? m.max_practical_marks ?? 0 : 0);
                const totalGot =
                  m.marks_obtained + (m.has_practical ? m.practical_marks ?? 0 : 0);
                const pct = totalMax > 0 ? Math.round((totalGot / totalMax) * 100) : 0;
                return (
                  <tr key={m.id} className="border-t border-on-surface/10 hover:bg-white/40">
                    <td className="py-3 pr-4 font-medium text-on-surface">
                      {students[m.student_id] ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                      {subjects[m.subject_id] ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">
                      {m.exam_term}
                    </td>
                    <td className="py-3 pr-4 text-right text-on-surface/70">
                      {m.has_practical
                        ? `${m.marks_obtained}+${m.practical_marks ?? 0} / ${m.max_marks}+${m.max_practical_marks ?? 0}`
                        : `${m.marks_obtained} / ${m.max_marks}`}
                    </td>
                    <td className="py-3 pr-4 text-center font-semibold text-on-surface">{pct}%</td>
                    <td className="py-3 text-center">
                      <GradePill pct={pct} />
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setConfirm(m.id)}
                        className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </GlassCard>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add marks">
        <form className="space-y-4" onSubmit={onAdd}>
          <Field label="Class *">
            <Select
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value, student_id: "", subject_id: "" }))}
              required
            >
              <option value="">Select class…</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student *">
            <Select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">Select student…</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject *">
            <Select
              value={form.subject_id}
              onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
              required
            >
              <option value="">Select subject…</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Exam">
            <Select
              value={form.exam_term}
              onChange={(e) => setForm((f) => ({ ...f, exam_term: e.target.value }))}
              required
            >
              <option value="">Select exam…</option>
              {exams.map((x) => (
                <option key={x.id} value={x.name}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marks obtained *">
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={form.marks_obtained}
                onChange={(e) => setForm((f) => ({ ...f, marks_obtained: e.target.value }))}
                required
              />
            </Field>
            <Field label="Max marks *">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="100"
                value={form.max_marks}
                onChange={(e) => setForm((f) => ({ ...f, max_marks: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Class practical mark?">
            <Select
              value={form.has_practical ? "yes" : "no"}
              onChange={(e) => setForm((f) => ({ ...f, has_practical: e.target.value === "yes" }))}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
          {form.has_practical && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Practical marks *">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={form.practical_marks}
                  onChange={(e) => setForm((f) => ({ ...f, practical_marks: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Max practical marks *">
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="25"
                  value={form.max_practical_marks}
                  onChange={(e) => setForm((f) => ({ ...f, max_practical_marks: e.target.value }))}
                  required
                />
              </Field>
            </div>
          )}

          {error && <Alert message={error} type="error" />}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Marks"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete marks entry?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes the marks entry. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}