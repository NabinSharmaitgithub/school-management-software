"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listClasses,
  studentsInClass,
  listMarks,
  listSubjects,
  addStudent,
  deleteStudent,
} from "@/lib/data";
import { Field, GlassButton, GlassCard, GradePill, Input, Modal, Select } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { ClassAttendance } from "@/components/dashboard/class-attendance";

type Class = { id: string; name: string; section: string };
type Student = { id: string; name: string; roll_number: string; guardian?: string };
type Mark = {
  id: string;
  student_id: string;
  subject_id: string;
  exam_term: string;
  marks_obtained: number;
  max_marks: number;
};
type Tab = "students" | "attendance" | "results";

const BLANK = {
  name: "",
  roll_number: "",
  gender: "",
  email: "",
  phone: "",
  guardian: "",
  address: "",
};

export default function MyClassPage() {
  const scope = useTeacherScope();
  const [classes, setClasses] = useState<Class[]>([]);
  const [classId, setClassId] = useState("");
  const [tab, setTab] = useState<Tab>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [subjectList, setSubjectList] = useState<{ id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(BLANK);

  const allowedClasses = useMemo(() => {
    if (scope.isAdmin) return classes;
    return classes.filter((c) => scope.classIds.includes(c.id));
  }, [classes, scope]);

  useEffect(() => {
    if (!scope.ready) return;
    listClasses()
      .then((all) => {
        const mine = scope.isAdmin ? all : all.filter((c) => scope.classIds.includes(c.id));
        setClasses(all);
        if (mine.length === 1) setClassId(mine[0].id);
      })
      .catch(() => {});
  }, [scope]);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      try {
        const [studs, ms, subs] = await Promise.all([
          studentsInClass(classId),
          listMarks(),
          listSubjects(),
        ]);
        setStudents(studs);
        const names: Record<string, string> = {};
        subs.forEach((s) => (names[s.id] = s.name));
        setSubjectNames(names);
        setSubjectList(subs.map((s) => ({ id: s.id })));
        const allowed = scope.isAdmin ? null : scope.subjectByClass[classId];
        setMarks(
          ms.filter(
            (m) =>
              studs.some((st) => st.id === m.student_id) &&
              (!allowed || allowed.includes(m.subject_id))
          )
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, scope]);

  function set<K extends keyof typeof BLANK>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Student name is required.");
      return;
    }
    setSaving(true);
    try {
      await addStudent({
        name: form.name.trim(),
        roll_number: form.roll_number.trim(),
        class_id: classId,
        gender: form.gender,
        email: form.email.trim(),
        phone: form.phone.trim(),
        guardian: form.guardian.trim(),
        address: form.address.trim(),
      });
      setAdding(false);
      setForm(BLANK);
      reloadStudents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onRemove() {
    if (!confirmDelete) return;
    await deleteStudent(confirmDelete);
    setConfirmDelete(null);
    reloadStudents();
  }

  async function reloadStudents() {
    if (!classId) return;
    const studs = await studentsInClass(classId);
    setStudents(studs);
  }

  const rows = useMemo(() => {
    const byStudent: Record<string, Record<string, { obtained: number; max: number }>> = {};
    for (const m of marks) {
      byStudent[m.student_id] = byStudent[m.student_id] || {};
      byStudent[m.student_id][m.subject_id] = byStudent[m.student_id][m.subject_id] || {
        obtained: 0,
        max: 0,
      };
      byStudent[m.student_id][m.subject_id].obtained += m.marks_obtained;
      byStudent[m.student_id][m.subject_id].max += m.max_marks;
    }
    return students.map((st) => {
      const sub = byStudent[st.id] ?? {};
      let obtained = 0;
      let max = 0;
      subjectList.forEach((s) => {
        const a = sub[s.id];
        if (a) {
          obtained += a.obtained;
          max += a.max;
        }
      });
      const overall = max > 0 ? Math.round((obtained / max) * 100) : null;
      return { student: st, sub, overall, obtained, max };
    });
  }, [students, marks, subjectList]);

  const classObj = classId ? classes.find((c) => c.id === classId) : null;

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Class</h1>
          <p className="text-sm text-on-surface/60">
            Manage your class — students, attendance and results.
          </p>
        </div>
        {allowedClasses.length > 1 && (
          <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-48">
            <option value="">Select class…</option>
            {allowedClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </Select>
        )}
      </header>

      {!scope.ready ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : !scope.isAdmin && scope.classIds.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-on-surface/60">
            No classes assigned to you yet. Ask an admin to assign you as class teacher.
          </p>
        </GlassCard>
      ) : !classId ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-on-surface/60">Select a class to continue.</p>
        </GlassCard>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">groups</span>
            <span className="text-sm font-medium text-on-surface">
              {classObj ? `${classObj.name} ${classObj.section}` : classId}
            </span>
            <GlassButton
              variant="ghost"
              onClick={() => setTab("students")}
              className={tab === "students" ? "bg-primary/15 text-primary font-semibold" : ""}
            >
              Students
            </GlassButton>
            <GlassButton
              variant="ghost"
              onClick={() => setTab("attendance")}
              className={tab === "attendance" ? "bg-primary/15 text-primary font-semibold" : ""}
            >
              Attendance
            </GlassButton>
            <GlassButton
              variant="ghost"
              onClick={() => setTab("results")}
              className={tab === "results" ? "bg-primary/15 text-primary font-semibold" : ""}
            >
              Results
            </GlassButton>
          </div>

          {tab === "students" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-sm text-on-surface/60">{students.length} students</p>
                <GlassButton onClick={() => setAdding(true)}>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add Student
                </GlassButton>
              </div>

              {loading ? (
                <p className="text-sm text-on-surface/60 py-8 text-center">Loading students…</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No students in this class yet. Click “Add Student” to add the first one.
                </p>
              ) : (
                <div className="space-y-2">
                  {students.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-white/40 border border-white/60"
                    >
                      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                        {s.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{s.name}</p>
                        <p className="text-xs text-on-surface/50">
                          Roll {s.roll_number || "—"}
                          {s.guardian ? ` · ${s.guardian}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(s.id)}
                        className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                        title="Remove student"
                      >
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {tab === "attendance" && (
            <GlassCard className="p-4 sm:p-6">
              <ClassAttendance classId={classId} />
            </GlassCard>
          )}

          {tab === "results" && (
            <GlassCard className="p-4 sm:p-6 overflow-x-auto">
              {loading ? (
                <p className="text-sm text-on-surface/60 py-8 text-center">Loading results…</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No students in this class yet.
                </p>
              ) : (
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                      <th className="pb-3 pr-4">Student</th>
                      {subjectList.map((s) => (
                        <th key={s.id} className="pb-3 pr-4 hidden sm:table-cell text-center">
                          {subjectNames[s.id] ?? "Subject"}
                        </th>
                      ))}
                      <th className="pb-3 text-center">Overall</th>
                      <th className="pb-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.student.id} className="border-t border-on-surface/10 hover:bg-white/40">
                        <td className="py-3 pr-4 font-medium text-on-surface">{row.student.name}</td>
                        {subjectList.map((s) => {
                          const a = row.sub[s.id];
                          const pct = a && a.max > 0 ? Math.round((a.obtained / a.max) * 100) : null;
                          return (
                            <td key={s.id} className="py-3 pr-4 hidden sm:table-cell text-center text-on-surface/70">
                              {pct === null ? "—" : `${pct}%`}
                            </td>
                          );
                        })}
                        <td className="py-3 text-center font-semibold text-on-surface">
                          {row.overall === null ? "—" : `${row.overall}%`}
                        </td>
                        <td className="py-3 text-center">
                          {row.overall === null ? <span className="text-on-surface/40">—</span> : <GradePill pct={row.overall} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>
          )}
        </>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add student" wide>
        <form className="space-y-4" onSubmit={onAddStudent}>
          <Field label="Class">
            <Input value={classObj ? `${classObj.name} ${classObj.section}` : classId} disabled />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name *">
              <Input placeholder="e.g. Alex Johnson" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Roll number">
              <Input placeholder="e.g. S-1024" value={form.roll_number} onChange={(e) => set("roll_number", e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Guardian / Parent">
              <Input placeholder="Parent or guardian name" value={form.guardian} onChange={(e) => set("guardian", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input placeholder="e.g. 98XXXXXXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input type="email" placeholder="student@school.edu" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input placeholder="Home address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              Save Student
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove student?">
        <p className="text-sm text-on-surface/70 mb-6">
          This will permanently remove the student and their records from this class. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onRemove}>
            Remove
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}