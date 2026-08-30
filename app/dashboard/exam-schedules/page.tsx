"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listClasses,
  listSubjects,
  listExams,
  addExam,
  listExamSessions,
  addExamSession,
  deleteExamSession,
} from "@/lib/data";
import type { Exam, ExamSession, Subject, Class } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type BulkRow = { subject_id: string; date: string; start: string; end: string };

function emptyBulkRow(): BulkRow {
  return {
    subject_id: "",
    date: new Date().toISOString().slice(0, 10),
    start: "09:00",
    end: "12:00",
  };
}

function dayName(date: string) {
  return WEEKDAYS[new Date(date + "T00:00:00").getDay()];
}

function fmtDate(date: string) {
  const parts = date.split("-");
  if (parts.length !== 3) return date;
  const d = new Date(date + "T00:00:00");
  return `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
}

export default function ExamSchedulesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [examId, setExamId] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  const [createOpen, setCreateOpen] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());

  const [slotOpen, setSlotOpen] = useState(false);
  const [slot, setSlot] = useState({
    subject_id: "",
    date: new Date().toISOString().slice(0, 10),
    start: "09:00",
    end: "12:00",
    class_ids: [] as string[],
  });
  const [confirmDel, setConfirmDel] = useState("");

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow()]);
  const [bulkClasses, setBulkClasses] = useState<string[]>([]);

  const load = async () => {
    try {
      const [c, s, e, se] = await Promise.all([
        listClasses(),
        listSubjects(),
        listExams(),
        listExamSessions(),
      ]);
      setClasses(c);
      setSubjects(s);
      setExams(e);
      setSessions(se);
      if (!examId && e.length) setExamId(e[0].id);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subjName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const className = (id: string) => {
    const c = classes.find((x) => x.id === id);
    return c ? `${c.name.replace("Grade ", "")} ${c.section}` : id;
  };

  const visible = useMemo(() => {
    if (gradeFilter === "All") return sessions.filter((s) => s.exam_id === examId);
    const schoolGrade = parseInt(gradeFilter, 10);
    return sessions.filter((s) => {
      if (s.exam_id !== examId) return false;
      return s.class_ids.some((cid) => {
        const c = classes.find((x) => x.id === cid);
        return c ? parseInt(c.name.replace(/\D/g, ""), 10) === schoolGrade : false;
      });
    });
  }, [sessions, examId, gradeFilter, classes]);

  const sorted = [...visible].sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));

  async function onCreateExam(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newExamName.trim()) {
      setError("Exam name is required.");
      return;
    }
    try {
      await addExam({ name: newExamName.trim(), academic_year: academicYear });
      setCreateOpen(false);
      setNewExamName("");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onAddSlot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!slot.subject_id || slot.class_ids.length === 0) {
      setError("Subject and class(es) are required.");
      return;
    }
    try {
      await addExamSession({
        exam_id: examId,
        subject_id: slot.subject_id,
        class_ids: slot.class_ids,
        date: slot.date,
        start: slot.start,
        end: slot.end,
      });
      setSlotOpen(false);
      setSlot((s) => ({ ...s, class_ids: [] }));
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function toggleClass(id: string) {
    setSlot((s) => ({
      ...s,
      class_ids: s.class_ids.includes(id) ? s.class_ids.filter((x) => x !== id) : [...s.class_ids, id],
    }));
  }

  function toggleBulkClass(id: string) {
    setBulkClasses((cs) => (cs.includes(id) ? cs.filter((x) => x !== id) : [...cs, id]));
  }

  function updateBulkRow(i: number, patch: Partial<BulkRow>) {
    setBulkRows((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function onAddBulk(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (bulkClasses.length === 0 || bulkRows.some((r) => !r.subject_id)) {
      setError("Pick class(es) and a subject for every row.");
      return;
    }
    try {
      await Promise.all(
        bulkRows.map((r) =>
          addExamSession({
            exam_id: examId,
            subject_id: r.subject_id,
            class_ids: bulkClasses,
            date: r.date,
            start: r.start,
            end: r.end,
          })
        )
      );
      setBulkOpen(false);
      setBulkRows([emptyBulkRow()]);
      setBulkClasses([]);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Exam Schedules</h1>
          <p className="text-sm text-on-surface/60">Manage and organize official examination routines</p>
        </div>
        <GlassButton onClick={() => setCreateOpen(true)}>
          <span className="material-symbols-outlined text-lg">add</span>
          Create Exam
        </GlassButton>
      </header>

      {error && <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>}

      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Select className="!w-auto" value={examId} onChange={(e) => setExamId(e.target.value)}>
              {exams.length === 0 && <option>No exams yet</option>}
              {exams.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </Select>
            <Select className="!w-auto" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option>All</option>
              {classes
                .map((c) => c.name.replace(/\D/g, ""))
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .map((g) => (
                  <option key={g}>{g}</option>
                ))}
            </Select>
          </div>
          {exams.length > 0 && (
            <div className="flex gap-2">
              <GlassButton onClick={() => setSlotOpen(true)}>
                <span className="material-symbols-outlined text-lg">add</span>
                Add Session
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => setBulkOpen(true)}>
                <span className="material-symbols-outlined text-lg">playlist_add</span>
                Bulk Add
              </GlassButton>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            {exams.length === 0 ? "Create an exam to begin scheduling." : "No sessions for this selection yet."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-xs text-on-surface/50 border-b border-on-surface/10">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Time</th>
                    <th className="py-2 pr-2">Subject</th>
                    <th className="py-2 pr-2">Class</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.id} className="border-b border-on-surface/5 align-top">
                      <td className="py-3 pr-2">
                        <p className="font-medium text-on-surface">{dayName(s.date)}</p>
                        <p className="text-xs text-on-surface/50">{fmtDate(s.date)}</p>
                      </td>
                      <td className="py-3 pr-2 text-on-surface/80">{s.start} – {s.end}</td>
                      <td className="py-3 pr-2 font-medium">{subjName(s.subject_id)}</td>
                      <td className="py-3 pr-2 max-w-40">
                        <div className="flex flex-wrap gap-1">
                          {s.class_ids.map((cid) => (
                            <StatusPill key={cid} tone="neutral">{className(cid)}</StatusPill>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setConfirmDel(s.id)}
                          className="text-on-surface/40 hover:text-error transition"
                          aria-label="Delete session"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 print:hidden">
              <GlassButton variant="ghost" onClick={() => window.print()}>
                <span className="material-symbols-outlined text-lg">print</span>
                Print Routine
              </GlassButton>
            </div>
          </>
        )}
      </GlassCard>

      {/* ── Create exam modal ───────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Exam">
        <form className="space-y-4" onSubmit={onCreateExam}>
          <Field label="Exam Name *">
            <Input placeholder="e.g. Mid-Term 2026" value={newExamName} onChange={(e) => setNewExamName(e.target.value)} required />
          </Field>
          <Field label="Academic Year">
            <Input placeholder="e.g. 2025" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          </Field>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit">Create Exam</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Add session modal ───────────────────────────────── */}
      <Modal open={slotOpen} onClose={() => setSlotOpen(false)} title="Add Exam Session">
        <form className="space-y-4" onSubmit={onAddSlot}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Date *">
              <Input type="date" value={slot.date} onChange={(e) => setSlot((s) => ({ ...s, date: e.target.value }))} />
            </Field>
            <Field label="Start">
              <Input type="time" value={slot.start} onChange={(e) => setSlot((s) => ({ ...s, start: e.target.value }))} />
            </Field>
            <Field label="End">
              <Input type="time" value={slot.end} onChange={(e) => setSlot((s) => ({ ...s, end: e.target.value }))} />
            </Field>
          </div>

          <Field label="Subject *">
            <Select value={slot.subject_id} onChange={(e) => setSlot((s) => ({ ...s, subject_id: e.target.value }))}>
              <option value="">Select subject…</option>
              {subjects.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </Select>
          </Field>

          <div>
            <p className="text-xs font-medium text-on-surface/70 mb-2">Classes *</p>
            <div className="grid grid-cols-3 gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClass(c.id)}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                    slot.class_ids.includes(c.id)
                      ? "border-primary bg-primary/15 text-primary font-semibold"
                      : "border-white/60 hover:bg-white/40 text-on-surface/70"
                  }`}
                >
                  {c.name.replace("Grade ", "")} {c.section}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setSlotOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit">Add Session</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Bulk add sessions modal ─────────────────────────── */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Add Sessions" wide>
        <form className="space-y-4" onSubmit={onAddBulk}>
          <div>
            <p className="text-xs font-medium text-on-surface/70 mb-2">Classes *</p>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleBulkClass(c.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    bulkClasses.includes(c.id)
                      ? "border-primary bg-primary/15 text-primary font-semibold"
                      : "border-white/60 hover:bg-white/40 text-on-surface/70"
                  }`}
                >
                  {c.name.replace("Grade ", "")} {c.section}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {bulkRows.map((r, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <Field label="Date *">
                  <Input type="date" value={r.date} onChange={(e) => updateBulkRow(i, { date: e.target.value })} />
                </Field>
                <Field label="Start">
                  <Input type="time" value={r.start} onChange={(e) => updateBulkRow(i, { start: e.target.value })} />
                </Field>
                <Field label="End">
                  <Input type="time" value={r.end} onChange={(e) => updateBulkRow(i, { end: e.target.value })} />
                </Field>
                <Field label="Subject *">
                  <Select value={r.subject_id} onChange={(e) => updateBulkRow(i, { subject_id: e.target.value })}>
                    <option value="">Select subject…</option>
                    {subjects.map((x) => (
                      <option key={x.id} value={x.id}>{x.name}</option>
                    ))}
                  </Select>
                </Field>
                <div className="flex justify-end pb-1">
                  <button
                    type="button"
                    onClick={() => setBulkRows((rs) => rs.filter((_, j) => j !== i))}
                    disabled={bulkRows.length === 1}
                    className="text-on-surface/40 hover:text-error transition disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Remove row"
                  >
                    <span className="material-symbols-outlined">remove</span>
                  </button>
                </div>
              </div>
            ))}
            <GlassButton type="button" variant="ghost" onClick={() => setBulkRows((rs) => [...rs, emptyBulkRow()])}>
              <span className="material-symbols-outlined text-lg">add</span>
              Add Row
            </GlassButton>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setBulkOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit">Add Sessions</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Delete session ──────────────────────────────────── */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel("")} title="Delete session?">
        <p className="text-sm text-on-surface/70 mb-6">This permanently removes the exam session from the schedule.</p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDel("")}>Cancel</GlassButton>
          <GlassButton
            variant="danger"
            onClick={async () => {
              await deleteExamSession(confirmDel);
              setConfirmDel("");
              load();
            }}
          >
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}