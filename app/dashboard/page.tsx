"use client";

import { useEffect, useState } from "react";
import {
  listStudents,
  listClasses,
  listPayments,
  attendanceSince,
  listAnnouncements,
  listStaff,
  staffAttendanceFor,
  getUserByEmail,
} from "@/lib/data";
import type { AttendanceEntry, Announcement } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";

type DashStats = {
  students: number;
  classes: number;
  classNames?: string;
  feesMonth?: number;
  myAtt?: { present: number; total: number } | null;
  attToday: number | null; // percent, null when no record yet
};

export default function DashboardPage() {
  const scope = useTeacherScope();
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [attTrend, setAttTrend] = useState<{ date: string; label: string; pct: number }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!scope.email) return;
    let cancelled = false;
    getUserByEmail(scope.email)
      .then((u) => {
        if (!cancelled) setRole(u?.role ?? null);
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [scope.email]);

  useEffect(() => {
    if (!scope.ready || role === null) return;
    let cancelled = false;
    (async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const since = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10);

      const [att, anns] = await Promise.all([attendanceSince(since), listAnnouncements()]);

      const byDate = new Map<string, AttendanceEntry[]>();
      for (const a of att) {
        const arr = byDate.get(a.date) ?? [];
        arr.push(a);
        byDate.set(a.date, arr);
      }
      const trend: { date: string; label: string; pct: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
        const day = byDate.get(d);
        if (day && day.length) {
          const present = day.filter((a) => a.status !== "absent").length;
          trend.push({ date: d, label: d.slice(5), pct: Math.round((present / day.length) * 100) });
        } else {
          trend.push({ date: d, label: d.slice(5), pct: 0 });
        }
      }

      const attToday = byDate.get(todayStr);
      const attTodayPct = attToday?.length
        ? Math.round((attToday.filter((a) => a.status !== "absent").length / attToday.length) * 100)
        : null;

      let dash: DashStats;
      if (role === "Teacher") {
        const [students, classes, staff] = await Promise.all([
          listStudents(),
          listClasses(),
          listStaff(),
        ]);
        const mineSet = new Set([...scope.classIds, ...Object.keys(scope.subjectByClass)]);
        const mineClasses = classes
          .filter((c) => mineSet.has(c.id))
          .sort((a, b) => `${a.name} ${a.section}`.localeCompare(`${b.name} ${b.section}`));
        const teacher = staff.find((s) => s.email === scope.email);
        const recs = teacher
          ? await staffAttendanceFor(teacher.id, todayStr.slice(0, 7))
          : [];
        dash = {
          students: students.filter((s) => mineSet.has(s.class_id)).length,
          classes: mineClasses.length,
          classNames: mineClasses.length
            ? mineClasses.map((c) => `${c.name} ${c.section}`.trim()).join(", ")
            : undefined,
          myAtt: recs.length
            ? {
                present: recs.filter((r) => r.status !== "absent").length,
                total: recs.length,
              }
            : null,
          attToday: attTodayPct,
        };
      } else {
        const [students, classes, payments] = await Promise.all([
          listStudents(),
          listClasses(),
          listPayments(),
        ]);
        dash = {
          students: students.length,
          classes: classes.length,
          feesMonth: payments
            .filter((p) => p.date.startsWith(todayStr.slice(0, 7)))
            .reduce((s, p) => s + (Number(p.amount) || 0), 0),
          attToday: attTodayPct,
        };
      }

      if (!cancelled) {
        setStats(dash);
        setAttTrend(trend);
        setAnnouncements(anns.filter((a) => !a.draft).slice(0, 3));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, role]);

  const fmtINR = (n: number) => {
    if (n >= 100000) return `रु${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `रु${(n / 1000).toFixed(1)}K`;
    return `रु${n}`;
  };

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">
              search
            </span>
            <input
              className="glass-input pl-10 pr-4 py-2 rounded-lg text-sm"
              placeholder="Search…"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon="group" label="Total Students" value={stats ? String(stats.students) : "–"} />
        <StatCard
          icon="event_available"
          label="Attendance Today"
          value={stats ? (stats.attToday === null ? "–" : `${stats.attToday}%`) : "–"}
        />
        {role === "Teacher" ? (
          <>
            <StatCard
              icon="event_note"
              label="My Attendance (Month)"
              value={
                stats
                  ? stats.myAtt
                    ? `${stats.myAtt.present}/${stats.myAtt.total} days present`
                    : "–"
                  : "–"
              }
            />
            <StatCard
              icon="school"
              label="Classes"
              value={stats ? String(stats.classes) : "–"}
              sub={stats?.classNames}
            />
          </>
        ) : (
          <>
            <StatCard icon="payments" label="Fees Collected (Month)" value={stats ? fmtINR(stats.feesMonth ?? 0) : "–"} />
            <StatCard icon="school" label="Classes" value={stats ? String(stats.classes) : "–"} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="font-semibold mb-4">Attendance — Last 7 Days</h2>
          <div className="h-64 flex items-end gap-2">
            {attTrend.length ? (
              attTrend.map((day, i) => (
                <div key={day.date} className="flex-1 h-full flex flex-col justify-end gap-1 text-center">
                  <div
                    className="w-full rounded-t-md transition-all min-h-[2px]"
                    title={`${day.label}: ${day.pct}%`}
                    style={{
                      height: `${Math.max(day.pct, 2)}%`,
                      background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                      opacity: 0.4 + (day.pct / 100) * 0.6,
                    }}
                  />
                  <span className="text-[10px] text-on-surface/50">{day.label.slice(3)}</span>
                </div>
              ))
            ) : (
              <div className="flex-1 text-center text-on-surface/40 text-sm self-center">Loading…</div>
            )}
          </div>
        </div>
        <div className="glass-panel p-6 space-y-4">
          <h2 className="font-semibold">Recent Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-on-surface/60">No announcements yet.</p>
          ) : (
            announcements.map((a) => (
              <Announcement key={a.id} title={a.title} time={`${timeAgo(a.date)} · ${a.author}`} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-on-surface">{value}</p>
        <p className="text-sm text-on-surface/60">{label}</p>
        {sub ? (
          <p className="text-xs text-on-surface/40 truncate" title={sub}>
            {sub}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Announcement({ title, time }: { title: string; time: string }) {
  return (
    <div className="rounded-lg bg-white/40 border border-white/60 p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary mt-0.5">campaign</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-on-surface">{title}</p>
          <p className="text-xs text-on-surface/50 mt-0.5">{time}</p>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: string): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}