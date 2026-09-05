"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listStudents,
  listStaff,
  listClasses,
  listPayments,
  listAttendance,
  listMarks,
  listFeeStructures,
} from "@/lib/data";
import type { Class, Student, Staff, Payment, AttendanceEntry, Mark, FeeStructure } from "@/lib/data";
import { GlassCard, Select } from "@/components/ui";

const CURR = (n: number) => `रु${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function weekday(date: string) {
  return WEEKDAYS[new Date(date + "T00:00:00").getDay()];
}
function gradeBand(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 35) return "D";
  return "F";
}
const bandColors: Record<string, string> = {
  "A+": "#16A34A",
  A: "#22C55E",
  "B+": "#0EA5E9",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#F97316",
  F: "#EF4444",
};

export default function AnalyticsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [term, setTerm] = useState("All Terms");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, s, st, p, a, m, f] = await Promise.all([
          listClasses(),
          listStudents(),
          listStaff(),
          listPayments(),
          listAttendance(),
          listMarks(),
          listFeeStructures(),
        ]);
        setClasses(c);
        setStudents(s);
        setStaffs(st);
        setPayments(p);
        setAttendance(a);
        setMarks(m);
        setFees(f);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const terms = useMemo(() => Array.from(new Set(marks.map((m) => m.exam_term))), [marks]);
  const filteredMarks = useMemo(
    () => (term === "All Terms" ? marks : marks.filter((m) => m.exam_term === term)),
    [marks, term]
  );

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const totalStaff = staffs.length;
    const payers = new Set(payments.map((p) => p.student_id)).size;
    const feeRate = totalStudents ? Math.round((payers / totalStudents) * 100) : 0;
    const recs = attendance.filter((a) => a.date.startsWith(year));
    const attRate = recs.length
      ? Math.round((recs.filter((r) => r.status !== "absent").length / recs.length) * 1000) / 10
      : 100;
    const revenue = payments.filter((p) => p.date.startsWith(year)).reduce((s, p) => s + p.amount, 0);
    const budget = fees
      .filter((f) => f.academic_year === year)
      .reduce((s, f) => s + f.fees.reduce((a, i) => a + i.amount, 0), 0);
    return { totalStudents, totalStaff, feeRate, attRate, revenue, budget };
  }, [students, staffs, payments, attendance, fees, year]);

  const enrollment = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => map.set(s.class_id, (map.get(s.class_id) ?? 0) + 1));
    return classes
      .map((c) => ({ label: `${c.name.replace("Grade ", "")} ${c.section}`, count: map.get(c.id) ?? 0 }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }, [students, classes]);
  const maxEnroll = Math.max(1, ...enrollment.map((e) => e.count));

  const heatmap = useMemo(() => {
    const grid: Record<string, { present: number; total: number }> = {};
    attendance.forEach((a) => {
      const key = `${weekday(a.date)}|${a.class_id}`;
      grid[key] = grid[key] ?? { present: 0, total: 0 };
      grid[key].total += 1;
      if (a.status !== "absent") grid[key].present += 1;
    });
    return classes.map((c) => {
      const label = `${c.name.replace("Grade ", "")}${c.section}`;
      return {
        label,
        days: WEEKDAYS.map((d) => {
          const cell = grid[`${d}|${c.id}`];
          const rate = cell ? (cell.present / cell.total) * 100 : null;
          return { day: d, rate, n: cell?.total ?? 0 };
        }),
      };
    });
  }, [attendance, classes]);

  const gradeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredMarks.forEach((m) => {
      const pct = m.max_marks ? (m.marks_obtained / m.max_marks) * 100 : 0;
      const b = gradeBand(pct);
      counts[b] = (counts[b] ?? 0) + 1;
    });
    return ["A+", "A", "B+", "B", "C", "D", "F"]
      .map((b) => ({ band: b, count: counts[b] ?? 0 }))
      .filter((x) => x.count > 0);
  }, [filteredMarks]);
  const totalGrade = gradeDist.reduce((s, g) => s + g.count, 0) || 1;

  const excel = filteredMarks.length
    ? ((filteredMarks.reduce((acc, m) => acc + (m.max_marks ? m.marks_obtained / m.max_marks : 0), 0) / filteredMarks.length) * 100).toFixed(1)
    : "—";

  const maxStaffDept = Math.max(1, ...deptCount(staffs).map((d) => d.count));
  const depts = deptCount(staffs).slice(0, 6);

  if (loading)
    return (
      <GlassCard className="p-8 text-center text-sm text-on-surface/60">Loading analytics…</GlassCard>
    );

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Analytics Overview</h1>
          <p className="text-sm text-on-surface/60">Enrollment, financials, attendance and performance at a glance</p>
        </div>
        <div className="flex gap-2">
          <Select className="!w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
            {Array.from(new Set([year, String(new Date().getFullYear()), String(new Date().getFullYear() - 1)])).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </Select>
          <Select className="!w-auto" value={term} onChange={(e) => setTerm(e.target.value)}>
            <option>All Terms</option>
            {terms.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </div>
      </header>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="groups" tone="indigo" label="Total Students" sub={`${students.length} across ${enrollment.filter((e) => e.count > 0).length} classes`}>
          <Count n={students.length} />
        </StatCard>
        <StatCard icon="badge" tone="teal" label="Total Staff" sub="Faculty & administration">
          <Count n={staffs.length} />
        </StatCard>
        <StatCard icon="payments" tone="amber" label="Fee Collection" sub={`${stats.feeRate}% enrolled have paid`}>
          {CircleDonut({ pct: stats.feeRate, color: "#F59E0B" })}
        </StatCard>
        <StatCard icon="event_available" tone="emerald" label="Overall Attendance" sub={`${year} · weighted across records`}>
          {CircleDonut({ pct: stats.attRate, color: "#10B981" })}
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Enrollment ────────────────────────────────────── */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary/60">school</span>
            Enrollment by Grade
          </h2>
          <div className="space-y-3">
            {enrollment.map((e) => (
              <div key={e.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-on-surface/80">Grade {e.label}</span>
                  <span className="text-on-surface/50">{e.count} students</span>
                </div>
                <div className="h-2.5 rounded-full bg-on-surface/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all"
                    style={{ width: `${(e.count / maxEnroll) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {enrollment.length === 0 && <p className="text-sm text-on-surface/50">No classes seeded yet.</p>}
          </div>
        </GlassCard>

        {/* ── Financial summary ─────────────────────────────── */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary/60">account_balance</span>
            Financial Summary — {year}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-on-surface/80">Collected (payments)</span>
              <span className="text-on-surface/50">{CURR(stats.revenue)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-on-surface/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: "100%" }} />
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-on-surface/80">Budgeted (fee allocation)</span>
              <span className="text-on-surface/50">{CURR(stats.budget)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-on-surface/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500"
                style={{ width: `${Math.min(100, stats.budget ? (stats.revenue / stats.budget) * 100 : 0)}%` }}
              />
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-on-surface/10">
              <div>
                <p className="text-[10px] uppercase text-on-surface/40 font-semibold">Collection rate vs budget</p>
                <p className="text-2xl font-bold text-on-surface">{stats.budget ? Math.round((stats.revenue / stats.budget) * 100) : 0}%</p>
              </div>
              <p className="text-xs text-on-surface/50">{stats.budget ? `${CURR(stats.budget - stats.revenue)} remaining` : "No fee structure for this year"}</p>
            </div>
          </div>
        </GlassCard>

        {/* ── Attendance heatmap ────────────────────────────── */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary/60">calendar_month</span>
            Attendance Heatmap
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-[480px]">
              <thead>
                <tr>
                  <th className="text-left text-xs text-on-surface/50 font-medium pb-2">Grade</th>
                  {WEEKDAYS.map((d) => (
                    <th key={d} className="text-center text-[10px] text-on-surface/50 font-medium pb-2">{d.slice(0, 1)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row) => (
                  <tr key={row.label}>
                    <td className="text-xs font-medium text-on-surface/80 py-1.5 pr-2">{row.label}</td>
                    {row.days.map((d, i) => (
                      <td key={i} className="p-1 text-center">
                        {d.rate === null ? (
                          <div className="w-7 h-7 rounded-md bg-on-surface/5 mx-auto" title="No records" />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-md mx-auto grid place-items-center text-[9px] text-white font-semibold"
                            style={{ backgroundColor: heatColor(d.rate) }}
                            title={`${d.day}: ${Math.round(d.rate)}% (${d.n})`}
                          >
                            {d.n}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {heatmap.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-sm text-on-surface/50 py-4 text-center">No attendance records.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* ── Grade distribution ────────────────────────────── */}
        <GlassCard className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary/60">monitoring</span>
            Grade Distribution {term === "All Terms" ? "" : `· ${term}`}
          </h2>
          {gradeDist.length === 0 ? (
            <p className="text-sm text-on-surface/50 py-8 text-center">No marks recorded for this filter.</p>
          ) : (
            <>
              <div className="h-40 w-40 mx-auto rounded-full grid place-items-center mb-5" style={{ background: conic(gradeDist) }}>
                <div className="h-32 w-32 rounded-full bg-white grid place-items-center text-center">
                  <div>
                    <p className="text-2xl font-bold text-on-surface">{totalGrade}</p>
                    <p className="text-[10px] text-on-surface/50 uppercase">entries</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {gradeDist.map((g) => (
                  <div key={g.band} className="text-center">
                    <div className="h-16 rounded-md overflow-hidden flex flex-col justify-end mx-auto w-full">
                      <div className="w-full" style={{ height: `${(g.count / Math.max(...gradeDist.map((x) => x.count))) * 100}%`, backgroundColor: bandColors[g.band] }} />
                    </div>
                    <p className="text-xs font-semibold mt-1" style={{ color: bandColors[g.band] }}>{g.band}</p>
                  </div>
                ))}
              </div>
              {excel === "—" ? null : <p className="text-center text-xs text-on-surface/50 mt-4">Average performance: {excel}%</p>}
            </>
          )}
        </GlassCard>
      </div>

      {/* ── Staff department breakdown ─────────────────────── */}
      <GlassCard className="p-5">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-primary/60">groups_2</span>
          Staff by Department
        </h2>
        <div className="flex flex-wrap gap-2">
          {depts.map((d) => (
            <div key={d.name} className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-xs">
              <span className="material-symbols-outlined text-sm text-primary/70">department</span>
              <span className="font-medium text-on-surface/80">{d.name}</span>
              <span className="text-on-surface/50">· {d.count}</span>
              <span className="h-1.5 w-10 rounded-full bg-on-surface/10 overflow-hidden">
                <span className="block h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" style={{ width: `${(d.count / maxStaffDept) * 100}%` }} />
              </span>
            </div>
          ))}
          {depts.length === 0 && <p className="text-sm text-on-surface/50">No staff seeded yet.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-3xl font-bold text-on-surface">{n.toLocaleString("en-IN")}</span>;
}

function StatCard(props: { icon: string; tone: string; label: string; sub: string; children: React.ReactNode }) {
  const toneBg: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-500",
    teal: "bg-teal-500/15 text-teal-500",
    amber: "bg-amber-500/15 text-amber-600",
    emerald: "bg-emerald-500/15 text-emerald-600",
  };
  return (
    <GlassCard className="p-4 flex items-start gap-3">
      <div className={`h-10 w-10 rounded-xl grid place-items-center ${toneBg[props.tone] ?? toneBg.indigo}`}>
        <span className="material-symbols-outlined">{props.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-on-surface/50 font-semibold">{props.label}</p>
        <div className="flex items-end gap-2">{props.children}</div>
        <p className="text-[11px] text-on-surface/40 mt-0.5 truncate">{props.sub}</p>
      </div>
    </GlassCard>
  );
}

function CircleDonut({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="w-12 h-12 rounded-full shrink-0 grid place-items-center relative"
      style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(127,127,150,0.15) 0deg)` }}
    >
      <div className="w-9 h-9 rounded-full bg-white grid place-items-center text-[11px] font-bold text-on-surface">
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function conic(rows: { band: string; count: number }[]) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  let acc = 0;
  const stops = rows.map((r) => {
    const start = (acc / total) * 100;
    acc += r.count;
    const end = (acc / total) * 100;
    return `${bandColors[r.band]} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function heatColor(rate: number) {
  if (rate >= 95) return "#059669";
  if (rate >= 90) return "#10B981";
  if (rate >= 80) return "#F59E0B";
  if (rate >= 70) return "#F97316";
  return "#EF4444";
}

function deptCount(staffs: Staff[]) {
  const map = new Map<string, number>();
  staffs.forEach((s) => map.set(s.department || "General", (map.get(s.department || "General") ?? 0) + 1));
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}