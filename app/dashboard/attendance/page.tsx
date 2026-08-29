"use client";

import { useEffect, useState } from "react";
import { listClasses, studentsInClass, attendanceFor, setAttendance } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select } from "@/components/ui";

type Class = { id: string; name: string; section: string };
type Student = { id: string; name: string; roll_number: string };
type Status = "present" | "absent" | "late";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today());
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listClasses().then(setClasses).catch(() => {});
  }, []);

  // Load students + existing records when class or date changes
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      const list: Student[] = await studentsInClass(classId);
      const existing: Record<string, Status> = classId && date
        ? await attendanceFor(classId, date)
        : {};
      setStudents(list);
      const base: Record<string, Status> = {};
      list.forEach((s) => {
        base[s.id] = existing[s.id] ?? "present";
      });
      setStatuses(base);
      setLoading(false);
      setSaved(false);
    })();
  }, [classId, date]);

  const counts = { present: 0, absent: 0, late: 0 };
  students.forEach((s) => {
    counts[statuses[s.id] ?? "present"] += 1;
  });

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    setError("");
    try {
      await Promise.all(
        students.map((s) => setAttendance(classId, s.id, date, statuses[s.id] ?? "present"))
      );
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onMarkAll(status: Status) {
    setStatuses(
      Object.fromEntries(students.map((s) => [s.id, status])) as Record<string, Status>
    );
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Daily Attendance</h1>
          <p className="text-sm text-on-surface/60">
            {saved ? "Saved for the selected date." : "Mark present, late or absent for each student."}
          </p>
        </div>
      </header>

      <GlassCard className="p-4 sm:p-6">
        <form className="space-y-6" onSubmit={onSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Select value={date} onChange={(e) => setDate(e.target.value)}>
                <option value={today()}>Today</option>
                {Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (i + 1));
                  const iso = d.toISOString().slice(0, 10);
                  return (
                    <option key={iso} value={iso}>
                      {iso}
                    </option>
                  );
                })}
              </Select>
            </Field>
          </div>

          {classId && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-on-surface/60 mr-1">Mark all:</span>
              {(["present", "late", "absent"] as Status[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onMarkAll(st)}
                  className="glass-btn-ghost px-3 py-1.5 rounded-lg text-xs text-on-surface/70 hover:text-primary capitalize"
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {classId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatBox label="Present" value={counts.present} tone="text-success" />
              <StatBox label="Late" value={counts.late} tone="text-amber" />
              <StatBox label="Absent" value={counts.absent} tone="text-rose" />
            </div>
          )}

          {loading ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">
              {classId ? "Loading students…" : "Select a class to begin."}
            </p>
          ) : classId && students.length === 0 ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">
              No students in this class yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {students.map((s, idx) => (
                <StudentRow
                  key={s.id}
                  idx={idx}
                  student={s}
                  status={statuses[s.id] ?? "present"}
                  onStatus={(status) =>
                    setStatuses((prev) => ({ ...prev, [s.id]: status }))
                  }
                />
              ))}
            </div>
          )}

          {classId && students.length > 0 && (
            <div className="flex justify-end">
              <GlassButton type="submit" disabled={saving || loading}>
                {saving ? (
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-lg">save</span>
                )}
                Save Attendance
              </GlassButton>
            </div>
          )}
        </form>
      </GlassCard>
    </div>
  );
}

function StudentRow({
  idx,
  student,
  status,
  onStatus,
}: {
  idx: number;
  student: Student;
  status: Status;
  onStatus: (s: Status) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/40 border border-white/60">
      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface truncate">{student.name}</p>
        <p className="text-xs text-on-surface/50">{student.roll_number}</p>
      </div>
      <div className="flex gap-1">
        {(["present", "late", "absent"] as Status[]).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => onStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
              status === st
                ? st === "present"
                  ? "bg-success/20 text-success font-semibold"
                  : st === "late"
                    ? "bg-amber/20 text-amber font-semibold"
                    : "bg-rose/20 text-rose font-semibold"
                : "text-on-surface/50 hover:bg-white/70 hover:text-on-surface"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/40 border border-white/60">
      <span className="text-sm text-on-surface/60">{label}</span>
      <span className={`text-lg font-semibold ${tone}`}>{value}</span>
    </div>
  );
}