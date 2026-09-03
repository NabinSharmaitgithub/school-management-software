"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSchoolSettings,
  updateSchoolSettings,
  listFeeStructures,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  listClasses,
  uploadSchoolLogo,
  listUsers,
  listStudents,
  setUserStudent,
} from "@/lib/data";
import type { SchoolSettings, FeeStructure, FeeItem, UserRecord, Student } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

type Tab = "general" | "branding" | "fees";

const PRESETS = [
  { label: "Indigo", hex: "#6366F1" },
  { label: "Violet", hex: "#8B5CF6" },
  { label: "Sky", hex: "#0EA5E9" },
  { label: "Emerald", hex: "#10B981" },
  { label: "Amber", hex: "#F59E0B" },
  { label: "Rose", hex: "#F43F5E" },
];

const TIMEZONES = [
  "(GMT+05:30) India Standard Time",
  "(GMT+08:00) Singapore / Hong Kong",
  "(GMT+00:00) UTC",
  "(GMT-05:00) Eastern Time",
  "(GMT-08:00) Pacific Time",
];

const CURRENCIES = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AUD ($)"];

const YEARS = ["2024 - 2025", "2023 - 2024"];

const emptyFeeItem = (): FeeItem => ({ name: "", kind: "Tuition Fee", amount: 0, frequency: "Monthly" });
const emptyStructure = () => ({ class_id: "", name: "", fees: [emptyFeeItem()] });

const FREQ_MULT: Record<FeeItem["frequency"], number> = { Monthly: 12, Quarterly: 4, Annual: 1 };

const KIND_ICONS: Record<string, string> = {
  "Tuition Fee": "menu_book",
  "Transport Fee": "directions_bus",
  "Library Fee": "local_library",
  "Lab Fee": "science",
  "Exam Fee": "assignment_turned_in",
  "Other": "receipt_long",
};

function annualTotal(fees: FeeItem[]) {
  return fees.reduce((s, f) => s + (f.amount || 0) * FREQ_MULT[f.frequency], 0);
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const [form, setForm] = useState({ school_name: "", school_address: "", timezone: TIMEZONES[0], currency: CURRENCIES[0], fee_clearance_date: "" });
  const [primary, setPrimary] = useState("#6366F1");
  const [logoName, setLogoName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [faviconName, setFaviconName] = useState("");

  const [year, setYear] = useState(YEARS[0]);
  const [structOpen, setStructOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [structForm, setStructForm] = useState(emptyStructure());
  const [yearFilter, setYearFilter] = useState("All Years");
  const [confirmDel, setConfirmDel] = useState("");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);

  const load = async () => {
    try {
      const [s, fs, c, u, st] = await Promise.all([getSchoolSettings(), listFeeStructures(), listClasses(), listUsers(), listStudents()]);
      setSettings(s);
      setForm({ school_name: s.school_name, school_address: s.school_address, timezone: s.timezone, currency: s.currency, fee_clearance_date: s.fee_clearance_date ?? "" });
      setPrimary(s.primary_color);
      setLogoName(s.logo_url ? "Logo uploaded" : "");
      setStructures(fs);
      setClasses(c.map((x) => ({ id: x.id, label: `${x.name} ${x.section}`.trim() })));
      setUsers(u);
      setStudentList(st);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const className = (id: string) => classes.find((c) => c.id === id)?.label ?? id;

  const visibleStructures = useMemo(
    () => structures.filter((s) => yearFilter === "All Years" || s.academic_year === yearFilter),
    [structures, yearFilter]
  );

  async function onLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadSchoolLogo(file);
      setLogoName(file.name);
      setSettings((s) => (s ? { ...s, logo_url: url } : s));
      setSavedAt("Primary logo uploaded.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.school_name.trim()) {
      setError("School name is required.");
      return;
    }
    try {
      await updateSchoolSettings({
        school_name: form.school_name.trim(),
        school_address: form.school_address.trim(),
        timezone: form.timezone,
        currency: form.currency,
        fee_clearance_date: form.fee_clearance_date,
      });
      setSettings((s) => (s ? { ...s, ...form } : s));
      setSavedAt("General settings saved.");
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onPickColor(hex: string) {
    setPrimary(hex);
    setError("");
    try {
      await updateSchoolSettings({ primary_color: hex });
      setSettings((s) => (s ? { ...s, primary_color: hex } : s));
      setSavedAt("Brand color updated.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function openCreate() {
    setError("");
    setEditing(null);
    setStructForm({ class_id: classes[0]?.id ?? "", name: "", fees: [emptyFeeItem()] });
    setStructOpen(true);
  }

  function openEdit(s: FeeStructure) {
    setError("");
    setEditing(s);
    setStructForm({ class_id: s.class_id, name: s.name, fees: s.fees.length ? s.fees.map((f) => ({ ...f })) : [emptyFeeItem()] });
    setStructOpen(true);
  }

  async function onSaveStructure(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fees = structForm.fees.filter((f) => f.name.trim());
    if (!structForm.class_id) {
      setError("Pick a class for this structure.");
      return;
    }
    if (!structForm.name.trim()) {
      setError("Structure name is required.");
      return;
    }
    if (fees.length === 0) {
      setError("Add at least one fee item.");
      return;
    }
    try {
      const payload = { class_id: structForm.class_id, name: structForm.name.trim(), academic_year: year, fees: fees.map((f) => ({ ...f, amount: Number(f.amount) || 0 })) };
      if (editing) await updateFeeStructure(editing.id, payload);
      else await addFeeStructure(payload);
      setStructOpen(false);
      setSavedAt("Fee structure saved.");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onDeleteStructure() {
    if (!confirmDel) return;
    await deleteFeeStructure(confirmDel);
    setConfirmDel("");
    setSavedAt("Fee structure deleted.");
    load();
  }

  const setFee = (i: number, patch: Partial<FeeItem>) =>
    setStructForm((f) => ({ ...f, fees: f.fees.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-on-surface/60">School profile, branding, and fee structure</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton variant="ghost" onClick={() => setTab("general")} className={tab === "general" ? "bg-primary/15 text-primary font-semibold" : ""}>
            <span className="material-symbols-outlined text-lg mr-1">settings</span>
            General
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => setTab("branding")} className={tab === "branding" ? "bg-primary/15 text-primary font-semibold" : ""}>
            <span className="material-symbols-outlined text-lg mr-1">palette</span>
            Branding
          </GlassButton>
          <GlassButton variant="ghost" onClick={() => setTab("fees")} className={tab === "fees" ? "bg-primary/15 text-primary font-semibold" : ""}>
            <span className="material-symbols-outlined text-lg mr-1">payments</span>
            Fee Structure
          </GlassButton>
        </div>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
      )}
      {savedAt && !error && (
        <p className="text-xs text-success bg-emerald/10 border border-emerald/20 rounded-lg px-3 py-2">
          {savedAt}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* ── GENERAL ────────────────────────────────────────── */}
          {tab === "general" && (
            <form onSubmit={onSaveGeneral}>
              <GlassCard className="p-4 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold mb-1">Institution Details</h2>
                  <p className="text-xs text-on-surface/60 mb-4">
                    Basic school information and localization settings.
                  </p>
                  <div className="space-y-4 max-w-2xl">
                    <Field label="School Name *">
                      <Input value={form.school_name} onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))} required />
                    </Field>
                    <div>
                      <p className="text-xs font-medium text-on-surface/70 mb-2">School Logo</p>
                      <label className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-white/70 bg-white/40 py-6 cursor-pointer hover:bg-white/60 transition text-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface/30">cloud_upload</span>
                        <span className="text-xs text-on-surface/60">
                          Click to upload or drag &amp; drop
                        </span>
                        <span className="text-[11px] text-on-surface/40">SVG, PNG, JPG or GIF (max. 800×400px)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setSavedAt(`Logo selected: ${f.name} (shown as placeholder)`);
                          }}
                        />
                      </label>
                    </div>
                    <Field label="School Address">
                      <Input value={form.school_address} onChange={(e) => setForm((f) => ({ ...f, school_address: e.target.value }))} />
                    </Field>
                    <Field label="Admit Card Fee Clearance Date">
                      <Input type="date" value={form.fee_clearance_date} onChange={(e) => setForm((f) => ({ ...f, fee_clearance_date: e.target.value }))} />
                    </Field>
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold mb-4">Localization</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                    <Field label="Timezone">
                      <Select value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}>
                        {TIMEZONES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="System Currency">
                      <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                        {CURRENCIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-on-surface/10">
                  <GlassButton type="button" variant="ghost" onClick={() => setForm((s) => s && ({ school_name: settings?.school_name ?? "", school_address: settings?.school_address ?? "", timezone: settings?.timezone ?? "", currency: settings?.currency ?? "", fee_clearance_date: settings?.fee_clearance_date ?? "" }))}>
                    Cancel
                  </GlassButton>
                  <GlassButton type="submit">Save Changes</GlassButton>
                </div>
              </GlassCard>
            </form>
          )}

          {/* ── BRANDING ───────────────────────────────────────── */}
          {tab === "branding" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-1">Color Theme</h2>
                <p className="text-xs text-on-surface/60 mb-5">
                  Select the primary accent color for your portal.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => onPickColor(p.hex)}
                      className={`rounded-xl border p-3 flex flex-col items-center gap-2 transition ${
                        primary === p.hex ? "border-primary ring-2 ring-primary/30" : "border-white/70 hover:bg-white/50"
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-full shadow-inner"
                        style={{ backgroundColor: p.hex }}
                      />
                      <span className="text-xs text-on-surface/70">{p.label}</span>
                      {primary === p.hex && (
                        <span className="material-symbols-outlined text-lg text-primary">check</span>
                      )}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold mb-1">Logos &amp; Imagery</h2>
                  <p className="text-xs text-on-surface/60 mb-4">
                    Upload high-resolution transparent PNGs for best results.
                  </p>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/70 bg-white/40 p-4">
                      <p className="text-xs font-medium text-on-surface/70 mb-2">
                        Primary Logo (Desktop) · Recommended: 400×120px
                      </p>
                      <div className="flex items-center gap-3">
                        {settings?.logo_url ? (
                          <img src={settings.logo_url} alt="School logo" className="h-12 rounded-lg border border-white/70 bg-white/60 object-contain p-1" />
                        ) : (
                          <div className="flex-1 rounded-lg border border-dashed border-white/70 bg-white/40 py-3 text-center text-xs text-on-surface/40">No logo yet</div>
                        )}
                        {uploading ? (
                          <GlassButton disabled>Uploading…</GlassButton>
                        ) : (
                          <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/70 bg-white/40 py-3 cursor-pointer hover:bg-white/60 text-xs text-on-surface/60">
                            <span className="material-symbols-outlined text-lg">upload</span>
                            {logoName || "Upload New"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={onLogoFile}
                            />
                          </label>
                        )}
                        {logoName && !uploading && (
                          <GlassButton variant="ghost" onClick={() => setLogoName("")}>delete</GlassButton>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/70 bg-white/40 p-4">
                      <p className="text-xs font-medium text-on-surface/70 mb-2">
                        Mobile Mark &amp; Favicon · Recommended: 128×128px (Square)
                      </p>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/70 bg-white/40 py-3 cursor-pointer hover:bg-white/60 text-xs text-on-surface/60">
                          <span className="material-symbols-outlined text-lg">upload</span>
                          {faviconName || "Upload New"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setFaviconName(e.target.files?.[0]?.name ?? "Upload New")}
                          />
                        </label>
                        {faviconName && (
                          <GlassButton variant="ghost" onClick={() => setFaviconName("")}>delete</GlassButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* ── FEE STRUCTURE ─────────────────────────────────── */}
          {tab === "fees" && (
            <>
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Fee Structure Configuration</h2>
                  <p className="text-xs text-on-surface/60">
                    Manage and assign fee templates across academic grades.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select className="!w-auto" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                    <option>All Years</option>
                    {YEARS.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </Select>
                  <GlassButton onClick={openCreate}>
                    <span className="material-symbols-outlined text-lg">add</span>
                    Create Structure
                  </GlassButton>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <Select className="!w-auto" value={year} onChange={(e) => setYear(e.target.value)}>
                  {YEARS.map((y) => (
                    <option key={y}>Academic Year: {y}</option>
                  ))}
                </Select>
              </div>

              {visibleStructures.length === 0 && (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No fee structures yet. Click &ldquo;Create Structure&rdquo; to add one for a grade.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                {visibleStructures.map((s) => {
                  const total = annualTotal(s.fees);
                  return (
                    <div key={s.id} className="glass-panel p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-primary/70">{className(s.class_id)}</p>
                          <p className="font-semibold text-on-surface">{s.name}</p>
                          <p className="text-[11px] text-on-surface/50">{s.academic_year}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(s)} className="text-on-surface/50 hover:text-primary transition" aria-label="Edit structure">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => setConfirmDel(s.id)} className="text-on-surface/50 hover:text-error transition" aria-label="Delete structure">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {s.fees.map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm">
                            <span className="flex items-center gap-2 text-on-surface/80">
                              <span className="material-symbols-outlined text-base text-primary/50">
                                {KIND_ICONS[f.kind] ?? "receipt_long"}
                              </span>
                              <span>
                                {f.name}
                                <span className="text-[11px] text-on-surface/50 ml-2">{f.kind}</span>
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-on-surface">₹{f.amount.toLocaleString("en-IN")}</span>
                              <StatusPill tone="neutral">{f.frequency}</StatusPill>
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-on-surface/10 flex items-center justify-between">
                        <span className="text-xs text-on-surface/50">Estimated Annual Total</span>
                        <span className="font-bold text-on-surface">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Portal Access</h2>
                <p className="text-xs text-on-surface/60">
                  Link a login (Student/Parent) to a student so they can view their fee statement on &ldquo;My Fees&rdquo;.
                </p>
              </div>
              {users.length === 0 ? (
                <p className="text-sm text-on-surface/60 py-6 text-center">
                  No portal accounts yet. Accounts are created when a Student/Parent role signs in.
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((usr) => (
                    <div
                      key={usr.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/50 border border-white/70 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-on-surface truncate">{usr.email}</p>
                        <p className="text-[11px] text-on-surface/50">Role: {usr.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          className="!w-auto min-w-[200px]"
                          value={usr.student_id ?? ""}
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (!val) return;
                            await setUserStudent(usr.id, val);
                            setUsers((list) => list.map((x) => (x.id === usr.id ? { ...x, student_id: val } : x)));
                          }}
                        >
                          <option value="">— No student —</option>
                          {studentList.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
            </>
          )}
        </>
      )}

      {/* ── Create / edit structure modal ────────────────────── */}
      <Modal
        open={structOpen}
        onClose={() => setStructOpen(false)}
        title={editing ? "Edit Structure" : "Create Structure"}
        wide
      >
        <form className="space-y-4" onSubmit={onSaveStructure}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Class *">
              <Select value={structForm.class_id} onChange={(e) => setStructForm((f) => ({ ...f, class_id: e.target.value }))}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Structure Name *">
              <Input placeholder="e.g. Standard Academic Curriculum" value={structForm.name} onChange={(e) => setStructForm((f) => ({ ...f, name: e.target.value }))} required />
            </Field>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-on-surface/70">Fee Items</p>
              <button
                type="button"
                onClick={() => setStructForm((f) => ({ ...f, fees: [...f.fees, emptyFeeItem()] }))}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Add Fee Item
              </button>
            </div>
            <div className="space-y-2">
              {structForm.fees.map((f, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Select
                    className="col-span-3"
                    value={f.kind}
                    onChange={(e) => setFee(i, { kind: e.target.value })}
                  >
                    {Object.keys(KIND_ICONS).map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </Select>
                  <Input
                    className="col-span-4"
                    placeholder="e.g. Tuition Fee"
                    value={f.name}
                    onChange={(e) => setFee(i, { name: e.target.value })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="0"
                    placeholder="Amount"
                    value={f.amount || ""}
                    onChange={(e) => setFee(i, { amount: Number(e.target.value) })}
                  />
                  <Select
                    className="col-span-2"
                    value={f.frequency}
                    onChange={(e) => setFee(i, { frequency: e.target.value as FeeItem["frequency"] })}
                  >
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </Select>
                  <button
                    type="button"
                    className="col-span-1 text-on-surface/40 hover:text-error transition"
                    onClick={() => setStructForm((x) => ({ ...x, fees: x.fees.filter((_, j) => j !== i) }))}
                    aria-label="Remove fee item"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setStructOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit">{editing ? "Save Changes" : "Create Structure"}</GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Delete structure ─────────────────────────────────── */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel("")} title="Delete structure?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes the fee structure for this grade.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDel("")}>Cancel</GlassButton>
          <GlassButton variant="danger" onClick={onDeleteStructure}>Delete</GlassButton>
        </div>
      </Modal>
    </div>
  );
}