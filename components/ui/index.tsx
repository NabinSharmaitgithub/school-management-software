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
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      className={cn(
        variant === "primary" ? "glass-btn-primary" : "glass-btn-ghost",
        "rounded-lg transition-all",
        className
      )}
      {...props}
    >
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
