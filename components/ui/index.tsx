import { cn } from "@/lib/cn";

export function GlassCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass-panel", className)} {...props}>
      {children}
    </div>
  );
}

export function GlassButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "glass-btn-primary text-white",
    ghost: "glass-btn-ghost text-on-surface/80",
    danger: "bg-rose/90 hover:bg-rose text-white shadow",
  };
  return (
    <button className={cn(variants[variant], "rounded-lg transition-all", className)} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warning" | "error" | "primary" | "neutral";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "text-success bg-success/10",
    warning: "text-amber bg-amber/10",
    error: "text-rose bg-rose/10",
    primary: "text-primary bg-primary/10",
    neutral: "text-on-surface/70 bg-white/50",
  };
  return <span className={cn("glass-pill", tones[tone])}>{children}</span>;
}

/** Modal overlay + panel (glassmorphism). Clicking backdrop closes. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full glass-panel p-6 max-h-[90vh] overflow-y-auto",
          wide ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Form field wrapper with label. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-on-surface/80 ml-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "glass-input w-full px-4 py-2.5 rounded-lg text-sm placeholder:text-on-surface/40 focus:outline-none";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "appearance-none", props.className)} />;
}