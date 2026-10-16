"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listAssignments,
  listClasses,
  listStaff,
  listSubjects,
  assignClassTeacher,
  assignSubjectTeacher,
  unassignAssignment,
} from "@/lib/data";
import type { Assignment, Class, Staff, Subject } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

export default function AssignmentsPage() {
  const scope = useTeacherScope();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ctForm, setCtForm] = useState({ class_id: "", email: "" });
  const [stForm, setStForm] = useState({ class_id: "", subject_id: "", email: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [c, s, st, a] = await Promise.all([
        listClasses(),
        listSubjects(),
        listStaff(),
        listAssignments(),
      ]);
      setClasses(c);
      setSubjects(s);
      setStaff(st);
      setAssignments(a);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scope.ready && scope.isAdmin) load();
  }, [scope.ready, scope.isAdmin]);

  const candidates = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of staff) {
      if (s.email) map.set(s.email.trim().toLowerCase(), s.name || s.email);
    }
    map.delete("admin@school.local");
    if (!map.has("teacher@school.local")) {
      map.set("teacher@school.local", "Teacher login");
    }
    return Array.from(map, ([email, name]) => ({ email, name }));
  }, [staff]);

  const nameFor = (email: string) =>
    candidates.find((c) => c.email === email)?.name ?? email;

  const classTeacherByClass = useMemo(() => {
    const out: Record<string, Assignment> = {};
    for (const a of assignments) {
      if (a.type === "class_teacher") out[a.class_id] = a;
    }
    return out;
  }, [assignments]);

  const subjectAssignments = useMemo(
    () => assignments.filter((a) => a.type === "subject_teacher"),
    [assignments]
  );

  const className = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${c.name} ${c.section}`.trim() : id;
  };

  async function onAssignClass(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!ctForm.class_id || !ctForm.email) {
      setError("Choose a class and a teacher to assign.");
      return;
    }
    setBusy(true);
    try {
      await assignClassTeacher(ctForm.class_id, ctForm.email, nameFor(ctForm.email));
      await load();
      setCtForm((f) => ({ ...f, email: "" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onAssignSubject(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!stForm.class_id || !stForm.subject_id || !stForm.email) {
      setError("Choose a class, subject and teacher to assign.");
      return;
    }
    setBusy(true);
    try {
      await assignSubjectTeacher(
        stForm.class_id,
        stForm.subject_id,
        stForm.email,
        nameFor(stForm.email)
      );
      await load();
      setStForm((f) => ({ ...f, email: "" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setError("");
    try {
      await unassignAssignment(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!scope.ready) {
    return <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>;
  }

  if (!scope.isAdmin) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-on-surface/60">
          Only admins can assign class and subject teachers.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4">
        <h1 className="text-xl font-semibold">Assign Teachers</h1>
        <p className="text-sm text-on-surface/60">
          Class teachers manage their whole class (roster, attendance, marks). Subject teachers
          manage marks for their subject only.
        </p>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : (
        <>
          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-base font-semibold mb-1">Class teachers</h2>
            <p className="text-xs text-on-surface/60 mb-4">
              Grant a teacher full access over a class&apos;s activities.
            </p>
            <form className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mb-6" onSubmit={onAssignClass}>
              <Field label="Class">
                <Select
                  value={ctForm.class_id}
                  onChange={(e) => setCtForm((f) => ({ ...f, class_id: e.target.value }))}
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Class teacher">
                <Select
                  value={ctForm.email}
                  onChange={(e) => setCtForm((f) => ({ ...f, email: e.target.value }))}
                >
                  <option value="">Select teacher…</option>
                  {candidates.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </Select>
              </Field>
              <GlassButton type="submit" disabled={busy}>
                Assign
              </GlassButton>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                    <th className="pb-3 pr-4">Class</th>
                    <th className="pb-3 pr-4">Class teacher</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 && (
                    <tr>
                      <td className="py-3 text-on-surface/60">No classes yet.</td>
                    </tr>
                  )}
                  {classes.map((c) => {
                    const a = classTeacherByClass[c.id];
                    return (
                      <tr key={c.id} className="border-t border-on-surface/10 hover:bg-white/40">
                        <td className="py-3 pr-4 font-medium text-on-surface">
                          {c.name} {c.section}
                        </td>
                        <td className="py-3 pr-4 text-on-surface/70">
                          {a ? (
                            <span>
                              {a.name} <span className="text-on-surface/40">({a.email})</span>
                            </span>
                          ) : (
                            <span className="text-on-surface/40">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {a && (
                            <button
                              onClick={() => onRemove(a.id)}
                              className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                            >
                              <span className="material-symbols-outlined text-lg">person_remove</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h2 className="text-base font-semibold mb-1">Subject teachers</h2>
            <p className="text-xs text-on-surface/60 mb-4">
              Grant a teacher marks access for one subject in a class.
            </p>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end mb-6" onSubmit={onAssignSubject}>
              <Field label="Class">
                <Select
                  value={stForm.class_id}
                  onChange={(e) => {
                    setStForm((f) => ({ ...f, class_id: e.target.value, subject_id: "" }));
                  }}
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <Select
                  value={stForm.subject_id}
                  onChange={(e) => setStForm((f) => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">Select subject…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject teacher">
                <Select
                  value={stForm.email}
                  onChange={(e) => setStForm((f) => ({ ...f, email: e.target.value }))}
                >
                  <option value="">Select teacher…</option>
                  {candidates.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.name} — {c.email}
                    </option>
                  ))}
                </Select>
              </Field>
              <GlassButton type="submit" disabled={busy}>
                Assign
              </GlassButton>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                    <th className="pb-3 pr-4">Class</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Subject teacher</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectAssignments.length === 0 && (
                    <tr>
                      <td className="py-3 text-on-surface/60" colSpan={4}>
                        No subject teachers assigned yet.
                      </td>
                    </tr>
                  )}
                  {subjectAssignments.map((a) => {
                    const subj = subjects.find((x) => x.id === a.subject_id);
                    return (
                      <tr key={a.id} className="border-t border-on-surface/10 hover:bg-white/40">
                        <td className="py-3 pr-4 font-medium text-on-surface">{className(a.class_id)}</td>
                        <td className="py-3 pr-4 text-on-surface/70">{subj?.name ?? a.subject_id}</td>
                        <td className="py-3 pr-4 text-on-surface/70">
                          {a.name} <span className="text-on-surface/40">({a.email})</span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onRemove(a.id)}
                            className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                          >
                            <span className="material-symbols-outlined text-lg">person_remove</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}