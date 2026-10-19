"use client";

import { useEffect, useRef, useState } from "react";
import {
  listStudents,
  listClasses,
  listPayments,
  attendanceSince,
  listAnnouncements,
  listStaff,
  staffAttendanceFor,
  getUserByEmail,
  listInvoicesHydrated,
} from "@/lib/data";
import type { AttendanceEntry, Announcement, FeeInvoice } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { ClippedAreaChart } from "@/components/ui/advanced-stats-utils/charts";
import { TimelineAnimation } from "@/components/ui/timeline-animation";
import {
  StatCard,
  Card,
  Alert,
  EmptyState,
  Button,
} from "@/components/ui";
import Link from "next/link";

type DashStats = {
  students: number;
  staff: number;
  classes: number;
  classNames?: string;
  feesMonth: number;
  pendingFees: number;
  overdueFees: number;
  myAtt?: { present: number; total: number } | null;
  attToday: number | null;
};

const CURR = (n: number) =>
  n >= 100000
    ? `रु${(n / 100000).toFixed(1)}L`
    : n >= 1000
      ? `रु${(n / 1000).toFixed(1)}K`
      : `रु${n}`;

export default function DashboardPage() {
  const scope = useTeacherScope();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [attTrend, setAttTrend] = useState<{ date: string; label: string; present: number; late: number; absent: number }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState("");

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
      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const since = new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10);
        const monthStr = todayStr.slice(0, 7);

        const [att, anns] = await Promise.all([attendanceSince(since), listAnnouncements()]);

        const byDate = new Map<string, AttendanceEntry[]>();
        for (const a of att) {
          const arr = byDate.get(a.date) ?? [];
          arr.push(a);
          byDate.set(a.date, arr);
        }
        type TrendPoint = { date: string; label: string; present: number; late: number; absent: number };
        const trend: TrendPoint[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
          const day = byDate.get(d);
          if (day && day.length) {
            const present = day.filter((a) => a.status === "present").length;
            const late = day.filter((a) => a.status === "late").length;
            trend.push({
              date: d,
              label: d.slice(5),
              present,
              late,
              absent: day.length - present - late,
            });
          } else {
            trend.push({ date: d, label: d.slice(5), present: 0, late: 0, absent: 0 });
          }
        }

        const attToday = byDate.get(todayStr);
        const attTodayPct = attToday?.length
          ? Math.round((attToday.filter((a) => a.status !== "absent").length / attToday.length) * 100)
          : null;

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
          const recs = teacher ? await staffAttendanceFor(teacher.id, todayStr.slice(0, 7)) : [];
          setStats({
            students: students.filter((s) => mineSet.has(s.class_id)).length,
            staff: staff.length,
            classes: mineClasses.length,
            classNames: mineClasses.length
              ? mineClasses.map((c) => `${c.name} ${c.section}`.trim()).join(", ")
              : undefined,
            feesMonth: 0,
            pendingFees: 0,
            overdueFees: 0,
            myAtt: recs.length
              ? {
                  present: recs.filter((r) => r.status !== "absent").length,
                  total: recs.length,
                }
              : null,
            attToday: attTodayPct,
          });
        } else {
          const [students, classes, payments, staff, invs] = await Promise.all([
            listStudents(),
            listClasses(),
            listPayments(),
            listStaff(),
            listInvoicesHydrated(),
          ]);
          const monthInvoices = invs.filter((i) => i.month === monthStr);
          const pendingFees = monthInvoices
            .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
            .reduce((s, i) => s + (i.payable - i.paid), 0);
          const overdueFees = monthInvoices
            .filter((i) => i.status === "OVERDUE")
            .reduce((s, i) => s + (i.payable - i.paid), 0);
          setStats({
            students: students.length,
            staff: staff.length,
            classes: classes.length,
            feesMonth: payments
              .filter((p) => p.date.startsWith(monthStr))
              .reduce((s, p) => s + (Number(p.amount) || 0), 0),
            pendingFees,
            overdueFees,
            attToday: attTodayPct,
          });
        }

        if (!cancelled) {
          setAttTrend(trend);
          setAnnouncements(anns.filter((a) => !a.draft).slice(0, 5));
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, role]);

  if (error) {
    return (
      <div className="space-y-6">
        <Alert message={error} type="error" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center text-sm text-slate-500">
          Loading dashboard…
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="card p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Overview of students, staff, fees, and attendance
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <StatCard icon="group" label="Total Students" value={String(stats.students)} tone="primary" />
        <StatCard icon="badge" label="Total Staff" value={String(stats.staff)} tone="primary" />
        <StatCard icon="school" label="Classes" value={String(stats.classes)} tone="primary" sub={stats.classNames} />
        <StatCard icon="payments" label="Fees Collected (Month)" value={CURR(stats.feesMonth)} tone="success" />
        <StatCard icon="pending" label="Pending Fees" value={CURR(stats.pendingFees)} tone="warning" />
        <StatCard icon="error" label="Overdue Fees" value={CURR(stats.overdueFees)} tone="error" />
        {!scope.isAdmin && (
          <StatCard
            icon="event_available"
            label="Attendance Today"
            value={stats.attToday === null ? "–" : `${stats.attToday}%`}
            tone="primary"
          />
        )}
      </div>

      {scope.isAdmin && stats.myAtt && (
        <StatCard icon="event_note" label="My Attendance (Month)" value={`${stats.myAtt.present}/${stats.myAtt.total} days`} tone="primary" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={timelineRef}>
        <TimelineAnimation
          animationNum={1}
          timelineRef={timelineRef}
          className="lg:col-span-2"
        >
          <div className="card p-6">
            <ClippedAreaChart data={attTrend} />
          </div>
        </TimelineAnimation>

        <div className="lg:col-span-1 card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Quick Actions</h2>
          <div className="space-y-3">
            {scope.isAdmin && (
              <>
                <Link href="/dashboard/students/new">
                  <Button variant="ghost" className="w-full text-left text-slate-600 hover:bg-teal-50">
                    <span className="material-symbols-outlined text-lg mr-2 text-white">add</span>
                    Admit Student
                  </Button>
                </Link>
                <Link href="/dashboard/finance">
                  <Button variant="ghost" className="w-full text-left text-slate-600 hover:bg-teal-50">
                    <span className="material-symbols-outlined text-lg mr-2 text-white">payments</span>
                    Collect Fee
                  </Button>
                </Link>
              </>
            )}
            <Link href="/dashboard/attendance">
              <Button variant="ghost" className="w-full text-left text-slate-600 hover:bg-teal-50">
                <span className="material-symbols-outlined text-lg mr-2 text-white">event_available</span>
                Mark Attendance
              </Button>
            </Link>
            <Link href="/dashboard/marks">
              <Button variant="ghost" className="w-full text-left text-slate-600 hover:bg-teal-50">
                <span className="material-symbols-outlined text-lg mr-2 text-white">assignment</span>
                Enter Marks
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">Recent Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <p className="text-sm font-medium text-slate-900">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{timeAgo(a.date)} · {a.author}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
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