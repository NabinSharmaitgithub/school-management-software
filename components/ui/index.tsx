"use client";

import { useEffect, useRef, useState } from "react";
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
    danger: "glass-btn-danger text-white",
  };
  return (
    <button
      className={cn(
        variants[variant],
        "rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-50",
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
    success: "text-emerald-600 bg-emerald-100",
    warning: "text-amber-600 bg-amber-100",
    error: "text-rose-600 bg-rose-100",
    primary: "text-indigo-600 bg-indigo-100",
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" ref={overlayRef}>
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.stopPropagation()}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full glass-panel p-6 max-h-[90vh] overflow-y-auto outline-none",
          wide ? "max-w-2xl" : "max-w-md"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
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

export function GradePill({ pct }: { pct: number }) {
  if (pct >= 90) return <StatusPill tone="success">A+</StatusPill>;
  if (pct >= 75) return <StatusPill tone="primary">A</StatusPill>;
  if (pct >= 60) return <StatusPill tone="warning">B</StatusPill>;
  if (pct >= 40) return <StatusPill tone="neutral">C</StatusPill>;
  return <StatusPill tone="error">F</StatusPill>;
}

/** Consistent alert/error message component. */
export function Alert({
  message,
  type = "error",
  className,
}: {
  message: string;
  type?: "error" | "success" | "warning" | "info";
  className?: string;
}) {
  const typeStyles = {
    error: "text-error bg-rose/10 border border-rose/20",
    success: "text-success bg-emerald/10 border border-emerald/20",
    warning: "text-amber-600 bg-amber/10 border border-amber/20",
    info: "text-primary bg-primary/10 border border-primary/20",
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

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setLocalUrl(URL.createObjectURL(file)); // optimistic preview before upload lands
    try {
      const url = await onFile(file);
      setLocalUrl(url);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      {localUrl || value ? (
        <img src={localUrl || value} alt={alt ?? "photo"} className="h-16 w-16 rounded-full object-cover border border-white/70 bg-white/60 shrink-0" />
      ) : (
        <div className="h-16 w-16 rounded-full border border-dashed border-white/70 bg-white/40 flex items-center justify-center text-on-surface/40 shrink-0">
          <span className="material-symbols-outlined text-2xl">person</span>
        </div>
      )}
      <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/70 bg-white/40 py-2.5 cursor-pointer hover:bg-white/60 text-xs text-on-surface/60">
        <span className="material-symbols-outlined text-lg">upload</span>
        {uploading ? "Uploading…" : localUrl || value ? "Change photo" : "Upload photo"}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
    </div>
  );
}