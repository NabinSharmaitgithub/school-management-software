"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  studentsInClass,
  attendanceFor,
  setAttendance,
} from "@/lib/data";
import { Field, Button, Card, Select, StatusPill, Alert } from "@/components/ui";

type Student = { id: string; name: string; roll_number: string };
type Status = "present" | "absent" | "late";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Attendance marking grid for a single class: date picker, mark-all,
 * per-student status rows and save. Corrections are audited with the
 * current user's email when an existing status is changed.
 */
export function ClassAttendance({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(today());
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [original, setOriginal] = useState<Record<string, Status>>({});
  const [correctorEmail, setCorrectorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Resolve the signed-in user's email for audit attribution.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (user) => {
      setCorrectorEmail(user?.email ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    (async () => {
      try {
        const list: Student[] = await studentsInClass(classId);
        const existing: Record<string, Status> = classId && date
          ? await attendanceFor(classId, date)
          : {};
        setStudents(list);
        setOriginal(existing);
        const base: Record<string, Status> = {};
        list.forEach((s) => {
          base[s.id] = existing[s.id] ?? "present";
        });
        setStatuses(base);
        setSaved(false);
      } finally {
        setLoading(false);
      }
    })().catch(() => setLoading(false));
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
        students.map((s) =>
          setAttendance(
            classId,
            s.id,
            date,
            statuses[s.id] ?? "present",
            correctorEmail ?? undefined,
            correctorEmail ? "Attendance marked/corrected by teacher" : undefined
          )
        )
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

  const hasChanges = Object.keys(statuses).some(
    (sid) => (statuses[sid] ?? "present") !== (original[sid] ?? "present")
  );

  return (
    <form className="space-y-6" onSubmit={onSave}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {students.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Mark all:</span>
          {(["present", "late", "absent"] as Status[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onMarkAll(st)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors border border-e2e8f0 capitalize"
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-e2e8f0">
          <span className="text-sm text-slate-500">Present</span>
          <span className="text-lg font-semibold text-emerald-600">{counts.present}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-e2e8f0">
          <span className="text-sm text-slate-500">Late</span>
          <span className="text-lg font-semibold text-amber-600">{counts.late}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-50 border border-e2e8f0">
          <span className="text-sm text-slate-500">Absent</span>
          <span className="text-lg font-semibold text-rose-600">{counts.absent}</span>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-8 text-center">Loading students…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
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
              original={original[s.id] ?? "present"}
              onStatus={(status) =>
                setStatuses((prev) => ({ ...prev, [s.id]: status }))
              }
            />
          ))}
        </div>
      )}

      {students.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving || loading || !hasChanges}
            className={!hasChanges ? "opacity-50 cursor-not-allowed" : ""}
          >
            {saving ? (
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-lg">save</span>
            )}
            {saved ? "Saved" : "Save Attendance"}
          </Button>
        </div>
      )}
    </form>
  );
}

function StudentRow({
  idx,
  student,
  status,
  original,
  onStatus,
}: {
  idx: number;
  student: Student;
  status: Status;
  original: Status;
  onStatus: (s: Status) => void;
}) {
  const changed = status !== original;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-e2e8f0">
      <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
        {idx + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{student.name}</p>
        <p className="text-xs text-slate-500">{student.roll_number}</p>
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
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : st === "late"
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "bg-rose-50 text-rose-700 font-semibold"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            } ${changed ? "ring-1 ring-teal-500" : ""}`}
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
    <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-e2e8f0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-lg font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
