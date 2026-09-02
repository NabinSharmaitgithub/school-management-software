"use client";

import { useEffect, useMemo, useState } from "react";
import { listClasses, listStudents, getSchoolSettings } from "@/lib/data";
import type { Class, SchoolSettings, Student } from "@/lib/data";
import { Field, GlassButton, GlassCard, Select, StatusPill } from "@/components/ui";

type Style = "Modern" | "Classic";

export default function IdCardsPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [style, setStyle] = useState<Style>("Modern");
  const [showQR, setShowQR] = useState(true);
  const [showBlood, setShowBlood] = useState(true);
  const [showEmergency, setShowEmergency] = useState(true);
  const [showValidity, setShowValidity] = useState(true);
  const [bulk, setBulk] = useState<"idle" | "running" | "done">("idle");
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, s, set] = await Promise.all([listClasses(), listStudents(), getSchoolSettings()]);
        setClasses(c);
        setStudents(s);
        setSettings(set);
        setStudentId(s[0]?.id ?? "");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const student = students.find((s) => s.id === studentId);
  const classOf = classes.find((c) => c.id === student?.class_id);
  const cardClass = student && classOf ? `${classOf.name.replace("Grade ", "")} ${classOf.section}` : "";

  const validUntil = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 9);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  function onPrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">ID Card Generator</h1>
          <p className="text-sm text-on-surface/60">Student identity cards with live preview</p>
        </div>
        <div className="flex gap-2">
          <GlassButton variant="ghost" onClick={onPrint}>
            <span className="material-symbols-outlined text-lg">print</span>
            Print
          </GlassButton>
          <GlassButton onClick={() => window.print()}>
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Export PDF
          </GlassButton>
        </div>
      </header>

      {error && <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2 print:hidden">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
        {/* ── Configuration ─────────────────────────────────── */}
        <GlassCard className="lg:col-span-3 p-4 space-y-5 print:hidden">
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary/60">tune</span>
              Configuration
            </h2>
            <Field label="Select Student">
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({classes.find((c) => c.id === s.class_id)?.name ?? ""} {classes.find((c) => c.id === s.class_id)?.section ?? ""})
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Template Style</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["Modern", "Classic"] as Style[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    style === s ? "border-primary bg-primary/15 text-primary font-semibold" : "border-white/70 hover:bg-white/50 text-on-surface/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Card Elements</h2>
            <div className="space-y-2">
              {[
                ["QR Code", showQR, setShowQR],
                ["Blood Group", showBlood, setShowBlood],
                ["Emergency Contact", showEmergency, setShowEmergency],
                ["Validity Date", showValidity, setShowValidity],
              ].map(([label, val, set]) => (
                <label key={label as string} className="flex items-center gap-2 text-sm text-on-surface/80 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#6366F1]"
                    checked={val as boolean}
                    onChange={(e) => (set as (b: boolean) => void)(e.target.checked)}
                  />
                  {label as string}
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-on-surface/10">
            <GlassButton
              className="w-full"
              disabled={bulk === "running"}
              onClick={() => {
                setBulk("running");
                setTimeout(() => setBulk("done"), 1200);
              }}
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              {bulk === "running" ? "Generating…" : bulk === "done" ? "Generated ✓" : "Generate Bulk"}
            </GlassButton>
            {bulk === "done" && <p className="text-xs text-success mt-2">Queued {students.length} cards. No-print demo build.</p>}
          </div>
        </GlassCard>

        {/* ── Live preview ──────────────────────────────────── */}
        <div className="lg:col-span-6 flex items-start justify-center">
          {!student ? (
            <GlassCard className="p-8 text-center text-sm text-on-surface/60">No student selected.</GlassCard>
          ) : loading ? (
            <p className="text-sm text-on-surface/60 py-16">Loading…</p>
          ) : (
            <div className="w-full max-w-sm">
              <div className="flex items-center justify-between mb-3 print:hidden">
                <p className="text-xs text-on-surface/50">
                  Preview · {student.name}
                </p>
                <StatusPill tone={bulk === "done" ? "success" : "neutral"}>{bulk === "done" ? "Queued" : "Live"}</StatusPill>
              </div>
              <div
                className={
                  style === "Classic"
                    ? "aspect-[1.6] rounded-2xl bg-white border border-white/80 shadow-xl p-4 flex flex-col justify-between overflow-hidden"
                    : "aspect-[1.6] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] relative"
                }
              >
                {style === "Modern" && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute w-40 h-40 rounded-full bg-white -top-10 -right-10" />
                    <div className="absolute w-28 h-28 rounded-full bg-white bottom-10 left-1/4" />
                  </div>
                )}

                <div className="flex items-center gap-3 relative z-10">
                  {student.photo_url ? (
                    <img src={student.photo_url} alt={student.name} className="h-14 w-14 rounded-full object-cover border border-white/90 shadow-sm" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-white/80 border border-white/90 flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-3xl">person</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="School logo" className={`h-8 object-contain ${style === "Modern" ? "" : "invert"}`} />
                    ) : (
                      <p className={`font-bold tracking-wide truncate ${style === "Modern" ? "text-white" : "text-indigo-700"}`}>Greenwood International</p>
                    )}
                    <p className={`text-[10px] ${style === "Modern" ? "text-white/80" : "text-grey-500"}`}>Student Identity Card</p>
                  </div>
                  {showQR && (
                    <div className="w-11 h-11 rounded bg-white p-1 opacity-95">
                      <QrGlyph />
                    </div>
                  )}
                </div>

                <div className={`relative z-10 ${style === "Modern" ? "bg-white/95 rounded-xl p-3" : ""}`}>
                  {style === "Modern" && (
                    <p className="text-[9px] uppercase tracking-widest text-indigo-500 font-semibold mb-1">Student Identity Card</p>
                  )}
                  <p className={`font-semibold text-base truncate ${style === "Modern" ? "text-on-surface" : "text-slate-800"}`}>{student.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[10px] ${style === "Modern" ? "text-on-surface/60" : "text-slate-500"}`}>
                      ID #{student.roll_number || student.id.replace(/_\d+$/, "")}
                    </p>
                    <p className="px-2 py-0.5 rounded-full text-[9px] font-semibold text-white bg-primary">{cardClass}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                    {showBlood && (
                      <div>
                        <p className={`text-[8px] uppercase tracking-wide ${style === "Modern" ? "text-on-surface/40" : "text-slate-400"}`}>Blood Group</p>
                        <p className={`text-[10px] font-medium ${style === "Modern" ? "text-on-surface/80" : "text-slate-600"}`}>O+</p>
                      </div>
                    )}
                    {showValidity && (
                      <div>
                        <p className={`text-[8px] uppercase tracking-wide ${style === "Modern" ? "text-on-surface/40" : "text-slate-400"}`}>Valid Until</p>
                        <p className={`text-[10px] font-medium ${style === "Modern" ? "text-on-surface/80" : "text-slate-600"}`}>{validUntil}</p>
                      </div>
                    )}
                    {showEmergency &&
                      (() => {
                        const guardian = student.guardian ?? "—";
                        const phone = student.phone ?? "—";
                        return (
                          <div className="col-span-2">
                            <p className={`text-[8px] uppercase tracking-wide ${style === "Modern" ? "text-on-surface/40" : "text-slate-400"}`}>Emergency Contact</p>
                            <p className={`text-[10px] font-medium ${style === "Modern" ? "text-on-surface/80" : "text-slate-600"}`}>{guardian} · {phone}</p>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>
              <p className="text-center text-[11px] text-on-surface/40 mt-3 print:hidden">
                Approximate dimensions: 85.6 × 53.98 mm (credit-card size)
              </p>
            </div>
          )}
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } aside, header, .print\\:hidden { display: none !important; } main { visibility: visible; } main, main * { visibility: visible; } main { position: absolute; inset: 0; } }`}</style>
    </div>
  );

  function QrGlyph() {
    const cells = useMemo(() => {
      const g: boolean[][] = [];
      for (let y = 0; y < 7; y++) {
        g.push([]);
        for (let x = 0; x < 7; x++) {
          g[y].push((x * 3 + y * 5 + x * y) % 3 !== 0);
        }
      }
      ["top", "bottom"].forEach((edge) => {
        const yy = edge === "top" ? 0 : 6;
        for (let x = 0; x < 7; x++) g[yy][x] = true;
        for (let y = 0; y < 7; y++) g[y][edge === "top" ? 0 : 6] = true;
      });
      return g;
    }, []);
    return (
      <svg viewBox="0 0 7 7" className="w-full h-full">
        {cells.map((row, y) =>
          row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" /> : null))
        )}
      </svg>
    );
  }
}