"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const CARD = "bg-white border border-e2e8f0 rounded-lg shadow-sm";
const INPUT =
  "bg-white border border-e2e8f0 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all duration-200";
const BTN_PRIMARY =
  "bg-teal-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 hover:bg-teal-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus-visible:ring-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_GHOST =
  "bg-white border border-e2e8f0 rounded-lg px-4 py-2.5 text-sm text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_DANGER =
  "bg-red-600 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed";

/** Card: white surface with subtle border and shadow. */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(CARD, className)} {...props}>
      {children}
    </div>
  );
}

/** Button with consistent variants. */
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const variants: Record<string, string> = {
    primary: BTN_PRIMARY,
    ghost: `${BTN_GHOST} text-slate-600`,
    danger: BTN_DANGER,
  };
  return (
    <button
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Status pill for badges/labels. */
export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warning" | "error" | "primary" | "neutral";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "text-emerald-700 bg-emerald-100 border border-emerald-200",
    warning: "text-amber-700 bg-amber-100 border border-amber-200",
    error: "text-rose-700 bg-rose-100 border border-rose-200",
    primary: "text-teal-700 bg-teal-100 border border-teal-200",
    neutral: "text-slate-600 bg-slate-100 border border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", tones[tone])}>
      {children}
    </span>
  );
}

/** Modal overlay + panel. Accessible focus management with Esc and Tab trapping. */
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    previousActiveElement.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousActiveElement.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" ref={overlayRef}>
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.stopPropagation()}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full bg-white border border-e2e8f0 rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto outline-none",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Form field wrapper with label. Accessibly associates label with input. */
export function Field({
  label,
  children,
  className,
  required,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-semibold text-slate-600 ml-1">
        {label}{required ? <span className="text-rose-600 ml-1" aria-hidden="true">*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(INPUT, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(INPUT, "appearance-none", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(INPUT, props.className)} />;
}

/** Canonical grade bands (single source of truth, used by marks, analytics, report cards). */
export const GRADE_BANDS: { threshold: number; grade: string; gpa: number }[] = [
  { threshold: 90, grade: "A+", gpa: 4.0 },
  { threshold: 80, grade: "A", gpa: 3.6 },
  { threshold: 70, grade: "B+", gpa: 3.2 },
  { threshold: 60, grade: "B", gpa: 2.8 },
  { threshold: 50, grade: "C", gpa: 2.4 },
  { threshold: 35, grade: "D", gpa: 2.0 },
  { threshold: 0, grade: "F", gpa: 0.0 },
];

export function gradeFor(pct: number) {
  return GRADE_BANDS.find((b) => pct >= b.threshold)?.grade ?? "F";
}

export function gpaFor(pct: number) {
  return GRADE_BANDS.find((b) => pct >= b.threshold)?.gpa ?? 0;
}

/** Grade pill for marks — uses canonical grade bands. */
export function GradePill({ pct }: { pct: number }) {
  if (pct >= 90) return <StatusPill tone="success">A+</StatusPill>;
  if (pct >= 75) return <StatusPill tone="primary">A</StatusPill>;
  if (pct >= 60) return <StatusPill tone="warning">B</StatusPill>;
  if (pct >= 40) return <StatusPill tone="neutral">C</StatusPill>;
  return <StatusPill tone="error">F</StatusPill>;
}

/** Consistent alert message component. */
export function Alert({
  message,
  type = "error",
  className,
}: {
  message: string;
  type?: "error" | "success" | "warning" | "info";
  className?: string;
}) {
  const typeStyles: Record<string, string> = {
    error: "text-rose-700 bg-rose-50 border border-rose-200",
    success: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    warning: "text-amber-700 bg-amber-50 border border-amber-200",
    info: "text-teal-700 bg-teal-50 border border-teal-200",
  };
  return (
    <p className={cn("text-xs rounded-lg px-3 py-2 border", typeStyles[type], className)} role="alert">
      {message}
    </p>
  );
}

/** Photo picker with preview. `value` is the stored URL; `onFile(file)` uploads and returns the new URL. */
export function PhotoUpload({
  value,
  onFile,
  alt,
}: {
  value: string;
  onFile: (file: File) => Promise<string>;
  alt?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState("");
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Photo is over 2MB — please pick a smaller image.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    setLocalUrl(URL.createObjectURL(file));
    const timer = window.setTimeout(() => {
      setUploading(false);
      setError("Upload timed out — check your connection and try again.");
    }, 30000);
    try {
      const url = await onFile(file);
      window.clearTimeout(timer);
      setLocalUrl(url);
    } catch (err) {
      console.error("photo upload failed:", err);
      setUploading(false);
      setError("Upload failed — check your connection and try again.");
    } finally {
      window.clearTimeout(timer);
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {localUrl || value ? (
        <img src={localUrl || value} alt={alt ?? "photo"} className="h-16 w-16 rounded-full object-cover border border-e2e8f0 bg-slate-50 shrink-0" />
      ) : (
        <div className="h-16 w-16 rounded-full border border-dashed border-e2e8f0 bg-white/50 flex items-center justify-center text-slate-500 shrink-0">
          <span className="material-symbols-outlined text-2xl">person</span>
        </div>
      )}
      <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-e2e8f0 bg-white/50 py-2.5 cursor-pointer hover:bg-slate-50 text-xs text-slate-500">
        <span className="material-symbols-outlined text-lg">upload</span>
        {uploading ? "Uploading…" : localUrl || value ? "Change photo" : "Upload photo"}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}

/** Stat card for dashboard KPIs. */
export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "success" | "warning" | "error" | "neutral";
}) {
  const toneCls: Record<string, string> = {
    primary: "text-teal-600 bg-teal-50",
    success: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    error: "text-rose-600 bg-rose-50",
    neutral: "text-slate-600 bg-slate-100",
  };
  return (
    <div className={cn(CARD, "p-5 flex flex-col gap-3")}>
      <div className={`w-10 h-10 rounded-lg grid place-items-center ${toneCls[tone]}`}>
        <span className="material-symbols-outlined text-lg" aria-hidden="true">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub ? (
          <p className="text-xs text-slate-400 truncate" title={sub}>
            {sub}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Data table wrapper with consistent header/row styling. */
export function DataTable({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-sm min-w-full">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn("text-left text-xs uppercase tracking-wide text-slate-500 border-b border-e2e8f0", className)}>
      <tr>{children}</tr>
    </thead>
  );
}

export function TableRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("border-b border-e2e8f0 hover:bg-slate-50 transition-colors", className)}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("py-3.5 pr-4 text-slate-600", className)}>{children}</td>;
}

/** Empty state component. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn(CARD, "p-12 flex flex-col items-center justify-center text-center gap-3")}>
      <span className="material-symbols-outlined text-5xl text-slate-400" aria-hidden="true">
        {icon}
      </span>
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Loading skeleton. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} />
  );
}

/** Consistent toast/feedback banner. */
export function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
}) {
  const typeStyles: Record<string, string> = {
    success: "text-emerald-700 bg-emerald-50 border border-emerald-200",
    error: "text-rose-700 bg-rose-50 border border-rose-200",
    warning: "text-amber-700 bg-amber-50 border border-amber-200",
    info: "text-teal-700 bg-teal-50 border border-teal-200",
  };
  const icons: Record<string, string> = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  };
  return (
    <div className={cn("text-xs rounded-lg px-3 py-2 border flex items-start gap-3", typeStyles[type])}>
      <span className="material-symbols-outlined text-lg mt-0.5" aria-hidden="true">
        {icons[type]}
      </span>
      <div className="flex-1">
        <p className="text-sm text-slate-900 font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" aria-label="Dismiss">
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      )}
    </div>
  );
}

/** Backward-compatible aliases for existing pages. */
export const GlassCard = Card;
export const GlassButton = Button;
