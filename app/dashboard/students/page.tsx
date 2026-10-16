"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  listStudents,
  listArchivedStudents,
  archiveStudent,
  restoreStudent,
  classNames,
} from "@/lib/data";
import { Button, Card, Modal, StatusPill, Alert } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

export default function StudentsPage() {
  const scope = useTeacherScope();
  const [students, setStudents] = useState<Awaited<ReturnType<typeof listStudents>>>([]);
  const [archived, setArchived] = useState<Awaited<ReturnType<typeof listArchivedStudents>>>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [archiveMode, setArchiveMode] = useState<"archive" | "restore" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, a, c] = await Promise.all([
        listStudents(),
        listArchivedStudents(),
        classNames(),
      ]);
      setStudents(s);
      setArchived(a);
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

  const list = tab === "active" ? students : archived;

  const visible = useMemo(
    () =>
      scope.isAdmin
        ? list
        : list.filter((s) => scope.classIds.includes(s.class_id)),
    [list, scope, tab]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return visible;
    return visible.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.roll_number.toLowerCase().includes(term) ||
        (s.admission_number ?? "").toLowerCase().includes(term)
    );
  }, [visible, q]);

  async function onArchive() {
    if (!activeId) return;
    try {
      if (archiveMode === "archive") {
        await archiveStudent(activeId);
      } else {
        await restoreStudent(activeId);
      }
      setActiveId(null);
      setArchiveMode(null);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Students</h1>
          <p className="text-sm text-slate-500">
            {tab === "active"
              ? `${filtered.length} active student${filtered.length !== 1 ? "s" : ""}`
              : `${filtered.length} archived student${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {tab === "active" && scope.isAdmin && (
          <Link href="/dashboard/students/new">
            <Button>
              <span className="material-symbols-outlined text-lg">add</span>
              Add Student
            </Button>
          </Link>
        )}
      </header>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          onClick={() => setTab("active")}
          className={tab === "active" ? "bg-teal-50 text-teal-700" : ""}
        >
          Active
        </Button>
        {scope.isAdmin && (
          <Button
            variant="ghost"
            onClick={() => setTab("archived")}
            className={tab === "archived" ? "bg-teal-50 text-teal-700" : ""}
          >
            Archived
          </Button>
        )}
      </div>

      {error && <Alert message={error} type="error" />}

      <Card className="p-4">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="pl-10 pr-4 py-2.5 rounded-lg text-sm w-full sm:w-80 bg-white border border-e2e8f0 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            placeholder="Search by name, roll or admission number…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading || !scope.ready ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading students…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            {!scope.isAdmin && visible.length === 0
              ? "No classes assigned to you yet. Ask an admin to assign you as class teacher."
              : list.length === 0
                ? tab === "active"
                  ? "No students yet. Click “Add Student” to create one."
                  : "No archived students."
                : "No students match your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-e2e8f0">
                  <th className="pb-3.5 pr-4">Student</th>
                  <th className="pb-3.5 pr-4 hidden sm:table-cell">Roll No</th>
                  <th className="pb-3.5 pr-4 hidden sm:table-cell">Admission No</th>
                  <th className="pb-3.5 pr-4 hidden md:table-cell">Class</th>
                  <th className="pb-3.5 pr-4 hidden lg:table-cell">Guardian</th>
                  <th className="pb-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-e2e8f0 hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="flex items-center gap-3 group"
                      >
                        {s.photo_url ? (
                          <img src={s.photo_url} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-e2e8f0 bg-slate-50 shrink-0" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {s.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        )}
                        <span className={cnStatus(s.archived)}>
                          {s.name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-600">
                      {s.roll_number}
                    </td>
                    <td className="py-3.5 pr-4 hidden sm:table-cell text-slate-600">
                      {s.admission_number || "—"}
                    </td>
                    <td className="py-3.5 pr-4 hidden md:table-cell">
                      <StatusPill tone="primary">{names[s.class_id] ?? s.class_id}</StatusPill>
                    </td>
                    <td className="py-3.5 pr-4 hidden lg:table-cell text-slate-600">
                      {s.guardian || "—"}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors border border-e2e8f0"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        {tab === "active" && scope.isAdmin && (
                          <button
                            onClick={() => {
                              setActiveId(s.id);
                              setArchiveMode("archive");
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-e2e8f0"
                          >
                            <span className="material-symbols-outlined text-lg">archive</span>
                          </button>
                        )}
                        {tab === "archived" && scope.isAdmin && (
                          <button
                            onClick={() => {
                              setActiveId(s.id);
                              setArchiveMode("restore");
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-e2e8f0"
                          >
                            <span className="material-symbols-outlined text-lg">restore</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!activeId}
        onClose={() => {
          setActiveId(null);
          setArchiveMode(null);
        }}
        title={archiveMode === "archive" ? "Archive student?" : "Restore student?"}
      >
        <p className="text-sm text-slate-700 mb-6">
          {archiveMode === "archive"
            ? "This will archive the student. Archived students are hidden from active lists but their records are preserved. This can be undone."
            : "This will restore the student to the active roster."}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => {
            setActiveId(null);
            setArchiveMode(null);
          }}>
            Cancel
          </Button>
          <Button
            variant={archiveMode === "archive" ? "danger" : "primary"}
            onClick={onArchive}
          >
            {archiveMode === "archive" ? "Archive" : "Restore"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function cnStatus(archived: boolean | undefined): string {
  return `font-medium ${archived ? "text-slate-400 line-through" : "text-slate-900 group-hover:text-teal-600 transition-colors"}`;
}
