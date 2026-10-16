"use client";

import { useEffect, useState } from "react";
import { listStaff, staffAttendanceFor } from "@/lib/data";
import type { StaffAttendance } from "@/lib/data";
import { GlassCard, GlassButton, StatusPill } from "@/components/ui";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function shift(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export default function MyAttendancePage() {
  const scope = useTeacherScope();
  const now = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(now);
  const [records, setRecords] = useState<StaffAttendance[] | null>(null);
  const [staffId, setStaffId] = useState<string>("");

  useEffect(() => {
    if (!scope.ready) return;
    listStaff()
      .then((staff) => {
        const me = staff.find((s) => s.email === scope.email);
        setStaffId(me?.id ?? "");
      })
      .catch(() => {});
  }, [scope]);

  useEffect(() => {
    if (!staffId) return;
    let cancelled = false;
    staffAttendanceFor(staffId, month)
      .then((r) => {
        if (!cancelled) setRecords(r);
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      });
    return () => {
      cancelled = true;
    };
  }, [staffId, month]);

  const byDate = new Map(records?.map((r) => [r.date, r.status]) ?? []);
  const recorded = records ?? [];
  const present = recorded.filter((r) => r.status !== "absent").length;
  const pct = recorded.length ? Math.round((present / recorded.length) * 100) : null;
  const total = daysInMonth(month);
  const days = Array.from({ length: total }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Attendance</h1>
          <p className="text-sm text-on-surface/60">Your recorded attendance by month.</p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" onClick={() => setMonth(shift(month, -1))}>
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </GlassButton>
          <span className="text-sm font-medium text-on-surface w-36 text-center">
            {MONTH_LABELS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
          </span>
          <GlassButton
            variant="ghost"
            disabled={month >= now}
            onClick={() => setMonth(shift(month, 1))}
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </GlassButton>
        </div>
      </header>

      {!scope.ready || (scope.ready && staffId === "" && records === null) ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : !staffId ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm text-on-surface/60">
            No staff profile linked to your account. Ask an admin to add you as staff.
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <MiniStat label="Days present" value={String(present)} />
            <MiniStat label="Days absent" value={String(recorded.length - present)} />
            <MiniStat label="Attendance rate" value={pct === null ? "–" : `${pct}%`} />
            <MiniStat label="Recorded days" value={`${recorded.length}/${total}`} />
          </div>

          <GlassCard className="p-4 sm:p-6">
            {recorded.length === 0 ? (
              <p className="text-sm text-on-surface/60 py-8 text-center">
                No attendance recorded for this month yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {days.map((d) => {
                  const status = byDate.get(d);
                  const dayNum = Number(d.slice(8));
                  if (!status) {
                    return (
                      <div key={d} className="rounded-lg bg-white/30 border border-white/50 p-2 text-center">
                        <p className="text-xs text-on-surface/40">{dayNum}</p>
                        <p className="text-[10px] text-on-surface/30">—</p>
                      </div>
                    );
                  }
                  const [tone, label] =
                    status === "present"
                      ? ["success", "Present"]
                      : status === "late"
                        ? ["warning", "Late"]
                        : ["error", "Absent"];
                  return (
                    <div key={d} className="rounded-lg bg-white/40 border border-white/60 p-2 text-center">
                      <p className="text-xs font-medium text-on-surface">{dayNum}</p>
                      <StatusPill tone={tone as "success" | "warning" | "error"}>{label}</StatusPill>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-1">
      <p className="text-2xl font-semibold text-on-surface">{value}</p>
      <p className="text-sm text-on-surface/60">{label}</p>
    </div>
  );
}