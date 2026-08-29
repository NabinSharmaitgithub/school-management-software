"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { NAV_ITEMS } from "@/components/dashboard/nav";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (user) => {
      if (!user) router.replace("/");
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 m-4 glass-panel p-4 hidden md:block sticky top-4 h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <p className="font-semibold text-on-surface leading-tight">Academix</p>
            <p className="text-xs text-on-surface/50">Admin Portal</p>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                item.label === "Dashboard"
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-on-surface/70 hover:bg-white/60 hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        <header className="glass-panel p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">search</span>
              <input className="glass-input pl-10 pr-4 py-2 rounded-lg text-sm" placeholder="Search…" />
            </div>
            <button className="glass-btn-ghost w-10 h-10 rounded-full flex items-center justify-center text-on-surface/70 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard icon="group" label="Total Students" value="1,284" trend="+3.2%" up />
          <StatCard icon="event_available" label="Attendance Today" value="92%" trend="+1.1%" up />
          <StatCard icon="payments" label="Fees Collected" value="₹8.4L" trend="+5.6%" up />
          <StatCard icon="task_alt" label="Pending Tasks" value="17" trend="-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6">
            <h2 className="font-semibold mb-4">Attendance Trend</h2>
            <div className="h-64 flex items-end gap-2">
              {[62, 70, 68, 78, 74, 84, 88, 82, 92, 96, 90, 100].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${v}%`,
                      background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
                      opacity: 0.5 + (i / 12) * 0.5,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="glass-panel p-6 space-y-4">
            <h2 className="font-semibold">Recent Announcements</h2>
            <Announcement title="Term exams begin Monday" time="2h ago" />
            <Announcement title="Staff meeting Fri 3 PM" time="1d ago" />
            <Announcement title="Sports day registration open" time="2d ago" />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  up,
}: {
  icon: string;
  label: string;
  value: string;
  trend: string;
  up?: boolean;
}) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
        <span className={`glass-pill ${up ? "text-success bg-success/10" : "text-rose bg-rose/10"}`}>
          <span className="material-symbols-outlined text-sm">{up ? "trending_up" : "trending_down"}</span>
          {trend}
        </span>
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
