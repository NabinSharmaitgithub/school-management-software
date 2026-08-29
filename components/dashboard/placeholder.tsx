import { GlassCard } from "@/components/ui";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <header className="glass-panel p-4">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-on-surface/60">{description}</p>
      </header>
      <GlassCard className="p-12 flex flex-col items-center justify-center text-center gap-3">
        <span className="material-symbols-outlined text-5xl text-primary/40">construction</span>
        <p className="font-medium text-on-surface">Module in progress</p>
        <p className="text-sm text-on-surface/60 max-w-md">
          {title} is coming soon. Students, Academics, Attendance, Marks and Finance are already
          live.
        </p>
      </GlassCard>
    </div>
  );
}