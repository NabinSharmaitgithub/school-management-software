"use client";

import { useEffect, useState } from "react";
import { listStudents, listClasses, listPayments, attendanceSince } from "@/lib/data";
import type { AttendanceEntry } from "@/lib/data";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    students: number;
    classes: number;
    feesMonth: number;
    attToday: number | null; // percent, null when no record yet
  } | null>(null);
  const [attTrend, setAttTrend] = useState<{ date: string; label: string; pct: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      const since = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10);

      const [students, classes, payments, att] = await Promise.all([
        listStudents(),
        listClasses(),
        listPayments(),
        attendanceSince(since),
      ]);

      const monthStr = todayStr.slice(0, 7);
      const feesMonth = payments
        .filter((p) => p.date.startsWith(monthStr))
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);

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

      if (!cancelled) {
        setStats({ students: students.length, classes: classes.length, feesMonth, attToday: attTodayPct });
        setAttTrend(trend);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        <StatCard icon="payments" label="Fees Collected (Month)" value={stats ? fmtINR(stats.feesMonth) : "–"} />
        <StatCard icon="school" label="Classes" value={stats ? String(stats.classes) : "–"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="font-semibold mb-4">Attendance — Last 7 Days</h2>
          <div className="h-64 flex items-end gap-2">
            {attTrend.length ? (
              attTrend.map((day, i) => (
                <div key={day.date} className="flex-1 flex flex-col justify-end gap-1 text-center">
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
          <Announcement title="Term exams begin Monday" time="2h ago" />
          <Announcement title="Staff meeting Fri 3 PM" time="1d ago" />
          <Announcement title="Sports day registration open" time="2d ago" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-on-surface">{value}</p>
        <p className="text-sm text-on-surface/60">{label}</p>
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