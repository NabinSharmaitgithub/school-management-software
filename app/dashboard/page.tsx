"use client";

export default function DashboardPage() {
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
