"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listStudents, deleteStudent, classNames } from "@/lib/data";
import { GlassButton, GlassCard, Modal, StatusPill, Alert } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

export default function StudentsPage() {
  const scope = useTeacherScope();
  const [students, setStudents] = useState<Awaited<ReturnType<typeof listStudents>>>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, c] = await Promise.all([listStudents(), classNames()]);
      setStudents(s);
      setNames(c);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () =>
      scope.isAdmin
        ? students
        : students.filter((s) => scope.classIds.includes(s.class_id)),
    [students, scope]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return visible;
    return visible.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.roll_number.toLowerCase().includes(term)
    );
  }, [visible, q]);

  async function onDelete() {
    if (!active) return;
    await deleteStudent(active);
    setActive(null);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Students</h1>
          <p className="text-sm text-on-surface/60">
            {scope.isAdmin
              ? `${filtered.length} students`
              : `Your class${scope.classIds.length !== 1 ? "es" : ""} · ${filtered.length} students`}
          </p>
        </div>
        {scope.isAdmin && (
          <Link href="/dashboard/students/new">
            <GlassButton>
              <span className="material-symbols-outlined text-lg">add</span>
              Add Student
            </GlassButton>
          </Link>
        )}
      </header>

      {error && <Alert message={error} type="error" />}

      <GlassCard className="p-4">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">
            search
          </span>
          <input
            className="glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm w-full sm:w-80"
            placeholder="Search by name or roll number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading || !scope.ready ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading students…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            {!scope.isAdmin && visible.length === 0
              ? "No classes assigned to you yet. Ask an admin to assign you as class teacher."
              : students.length === 0
                ? "No students yet. Click “Add Student” to create one."
                : "No students match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Roll No</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Class</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Guardian</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-on-surface/10 hover:bg-white/40">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                        {s.name
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                        {s.name}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                    {s.roll_number}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <StatusPill tone="primary">{names[s.class_id] ?? s.class_id}</StatusPill>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell text-on-surface/70">
                    {s.guardian || "—"}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </Link>
                      <button
                        onClick={() => setActive(s.id)}
                        className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </GlassCard>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title="Delete student?"
      >
        <p className="text-sm text-on-surface/70 mb-6">
          This will permanently remove the student and their records. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setActive(null)}>
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