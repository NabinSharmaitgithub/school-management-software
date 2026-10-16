"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listClasses,
  listSubjects,
  listStaff,
  listTimetable,
  addTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTimetableConfig,
  saveTimetableConfig,
  TIMETABLE_DEFAULTS,
} from "@/lib/data";
import type { Class, Subject, Staff, TimetableEntry, TimetableConfig, TimetableSlot } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Tab = "class" | "staff";

export default function TimetablePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [cfg, setCfg] = useState<TimetableConfig>(TIMETABLE_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("class");
  const [classId, setClassId] = useState("");
  const [staffId, setStaffId] = useState("");

  const [edit, setEdit] = useState<{ day: string; start: string; entry?: TimetableEntry } | null>(null);
  const [form, setForm] = useState({ subject_id: "", teacher: "", room: "", class_id: "" });
  const [confirmDel, setConfirmDel] = useState<TimetableEntry | null>(null);
  const [cfgDraft, setCfgDraft] = useState<TimetableConfig | null>(null);
  const [cfgError, setCfgError] = useState("");

  const load = async () => {
    try {
      const [c, s, st, e, cfgData] = await Promise.all([
        listClasses(),
        listSubjects(),
        listStaff(),
        listTimetable(),
        getTimetableConfig(),
      ]);
      setClasses(c);
      setSubjects(s);
      setStaff(st);
      setEntries(e);
      setCfg(cfgData);
      if (!classId && c.length) setClassId(c[0].id);
      if (!staffId && st.length) setStaffId(st[0].id);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subjName = (id: string) => subjects.find((x) => x.id === id)?.name ?? id;

  const conflicts = useMemo(() => {
    const byTeacher = new Map<string, Array<TimetableEntry & { slot: string }>>();
    entries.forEach((e) => {
      const key = `${e.teacher}|${e.day}|${e.start}`;
      const arr = byTeacher.get(key) ?? [];
      arr.push({ ...e, slot: key });
      byTeacher.set(key, arr);
    });
    return Array.from(byTeacher.values()).filter((v) => v.length > 1);
  }, [entries]);

  const classGrid = useMemo(() => {
    const matrix: Record<string, TimetableEntry | null> = {};
    entries.filter((e) => e.class_id === classId).forEach((e) => {
      matrix[`${e.day}|${e.start}`] = e;
    });
    return matrix;
  }, [entries, classId]);

  const staffGrid = useMemo(() => {
    const matrix: Record<string, TimetableEntry | null> = {};
    const name = staff.find((s) => s.id === staffId)?.name ?? "";
    entries.filter((e) => e.teacher === name).forEach((e) => {
      matrix[`${e.day}|${e.start}`] = e;
    });
    return matrix;
  }, [entries, staff, staffId]);

  const grid = tab === "class" ? classGrid : staffGrid;

  function openCell(day: string, start: string) {
    const entry = grid[`${day}|${start}`] ?? undefined;
    setEdit({ day, start, entry });
    setForm({
      subject_id: entry?.subject_id ?? "",
      teacher: entry?.teacher ?? "",
      room: entry?.room ?? "",
      class_id: entry?.class_id ?? classId,
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!edit) return;
    if (!form.subject_id.trim() || !form.teacher.trim()) {
      setError("Subject and teacher are required.");
      return;
    }
    try {
      const slotEnd = cfg.slots.find((x) => x.kind === "period" && x.start === edit.start)?.end ?? edit.start;

      const payload = {
        class_id: form.class_id || classId,
        subject_id: form.subject_id,
        teacher: form.teacher,
        day: edit.day,
        start: edit.start,
        end: slotEnd,
        room: form.room.trim() || undefined,
      };
      if (tab === "staff" && staffGrid[`${edit.day}|${edit.start}`]) {
        setError("That slot is already occupied on the staff timetable.");
        return;
      }
      if (edit.entry) {
        const clean = { ...payload, class_id: edit.entry.class_id };
        Object.keys(clean).forEach((k) => (clean as Record<string, unknown>)[k] === undefined && delete (clean as Record<string, unknown>)[k]);
        await updateTimetableEntry(edit.entry.id, clean);
      } else {
        await addTimetableEntry(payload);
      }
      setEdit(null);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const periods = cfg.slots.filter((s) => s.kind === "period");
  const filledSlots = grid ? Object.values(grid).filter(Boolean).length : 0;

  function openCfgEditor() {
    setCfgError("");
    setCfgDraft({ days: [...cfg.days], slots: cfg.slots.map((s) => ({ ...s })) });
  }

  function updSlot(i: number, patch: Partial<TimetableSlot>) {
    setCfgDraft((d) => d && { ...d, slots: d.slots.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  }

  function rmSlot(i: number) {
    setCfgDraft((d) => d && { ...d, slots: d.slots.filter((_, j) => j !== i) });
  }

  function addSlot(kind: TimetableSlot["kind"]) {
    setCfgDraft((d) => d && { ...d, slots: [...d.slots, { start: "12:00", end: "12:45", kind }] });
  }

  function toggleDay(day: string, on: boolean) {
    setCfgDraft((d) => d && { ...d, days: on ? [...d.days, day] : d.days.filter((x) => x !== day) });
  }

  function saveCfg() {
    if (!cfgDraft) return;
    const bad = cfgDraft.slots.find((s) => !s.start || !s.end || s.start >= s.end);
    if (bad) {
      setCfgError("Each slot needs a valid start before its end time.");
      return;
    }
    const dup = cfgDraft.slots.filter((s, i, arr) => arr.findIndex((x) => x.start === s.start) !== i);
    if (dup.length) {
      setCfgError(`Duplicate start time: ${dup[0].start}.`);
      return;
    }
    if (!cfgDraft.days.length) {
      setCfgError("Select at least one working day.");
      return;
    }
    const saved = { days: cfgDraft.days, slots: cfgDraft.slots };
    saveTimetableConfig(saved)
      .then(() => {
        setCfg(saved);
        setCfgDraft(null);
      })
      .catch((err) => setCfgError((err as Error).message));
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Timetable</h1>
          <p className="text-sm text-on-surface/60">Weekly schedule builder with conflict detection</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-on-surface/5 p-1">
          {(["class", "staff"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                tab === t ? "bg-white shadow-sm text-primary" : "text-on-surface/60 hover:text-on-surface"
              }`}
            >
              {t === "class" ? "Class Timetable" : "Staff Timetable"}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>}

      {conflicts.length > 0 && (
        <div className="rounded-lg bg-amber/10 border border-amber/30 px-3 py-2 flex items-start gap-2">
          <span className="material-symbols-outlined text-lg text-amber mt-0.5">warning</span>
          <p className="text-xs text-amber">
            {conflicts.reduce((s, c) => s + c.length, 0) - conflicts.length} double-bookings:{" "}
            {conflicts
              .slice(0, 2)
              .map((c) => `${c[0].teacher} on ${c[0].day} ${c[0].start}`)
              .join("; ")}
            {conflicts.length > 2 ? ` (+${conflicts.length - 2} more)` : ""}. Resolve these to avoid clashes.
          </p>
        </div>
      )}

      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {tab === "class" ? (
            <Field label="Class">
              <Select className="!w-auto" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Staff Member">
              <Select className="!w-auto" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs text-on-surface/50">
            <GlassButton variant="ghost" onClick={openCfgEditor}>
              <span className="material-symbols-outlined text-lg">schedule</span>
              Edit Schedule
            </GlassButton>
            <StatusPill tone="neutral">{filledSlots} / {periods.length * cfg.days.length} slots</StatusPill>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface/60 py-10 text-center">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-xs text-on-surface/50 font-medium w-16">Time</th>
                  {cfg.days.map((d) => (
                    <th key={d} className="text-center text-xs text-on-surface/50 font-medium">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfg.slots.map((slot) =>
                  slot.kind === "tiffin" ? (
                    <tr key={`${slot.kind}-${slot.start}`}>
                      <td
                        colSpan={cfg.days.length + 1}
                        className="rounded-lg bg-amber/10 border border-amber/20 px-3 py-2 text-xs text-amber"
                      >
                        <span className="material-symbols-outlined text-sm align-middle mr-1">lunch</span>
                        Tiffin / Break · {slot.start}–{slot.end}
                      </td>
                    </tr>
                  ) : (
                  <tr key={slot.start}>
                    <td className="text-xs text-on-surface/60 font-medium whitespace-nowrap">
                      {slot.start}
                      <span className="block text-[9px] text-on-surface/40">{slot.end}</span>
                    </td>
                    {cfg.days.map((day) => {
                      const entry = grid[`${day}|${slot.start}`];
                      return (
                        <td key={day} className="p-0">
                          <button
                            onClick={() => openCell(day, slot.start)}
                            className={`w-full min-h-16 rounded-lg border text-left px-2 py-1.5 transition hover:bg-white/40 ${
                              entry ? "bg-primary/10 border-primary/30" : "bg-on-surface/[0.03] border-on-surface/10"
                            }`}
                          >
                            {entry ? (
                              <>
                                <p className="text-xs font-semibold text-primary truncate">{subjName(entry.subject_id)}</p>
                                <p className="text-[10px] text-on-surface/60 truncate">{entry.teacher}</p>
                                {entry.room && <p className="text-[9px] text-on-surface/40 truncate">{entry.room}</p>}
                              </>
                            ) : (
                              <span className="text-[10px] text-on-surface/30">+ Add</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <GlassButton variant="ghost" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-lg">print</span>
            Print Timetable
          </GlassButton>
        </div>
      </GlassCard>

      {/* ── Edit slot modal ────────────────────────────────── */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.entry ? `Edit ${edit.day} ${edit.start}` : `Add ${edit?.day} ${edit?.start}`}
      >
        {edit && (
          <form className="space-y-4" onSubmit={onSave}>
            {tab === "staff" ? (
              <Field label="Class *">
                <Select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}>
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Subject *">
              <Select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
                <option value="">Select subject…</option>
                {subjects.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Teacher *">
              <Select value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}>
                <option value="">Select teacher…</option>
                {staff.map((x) => (
                  <option key={x.id} value={x.name}>{x.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Room">
              <Input value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} placeholder="Room 21" />
            </Field>

            {error && (
              <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex justify-between items-center pt-2">
              {edit.entry ? (
                <GlassButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setConfirmDel(edit.entry!);
                    setEdit(null);
                  }}
                >
                  Remove
                </GlassButton>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <GlassButton type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</GlassButton>
                <GlassButton type="submit">{edit.entry ? "Save Changes" : "Add to Timetable"}</GlassButton>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Delete confirm ─────────────────────────────────── */}
      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Remove this period?">
        <p className="text-sm text-on-surface/70 mb-6">
          {confirmDel ? `${subjName(confirmDel.subject_id)} · ${confirmDel.day} ${confirmDel.start} (${confirmDel.teacher})` : ""} will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDel(null)}>Cancel</GlassButton>
          <GlassButton
            variant="danger"
            onClick={async () => {
              if (confirmDel) await deleteTimetableEntry(confirmDel.id);
              setConfirmDel(null);
              load();
            }}
          >
            Remove
          </GlassButton>
        </div>
      </Modal>

      {/* ── Schedule config ────────────────────────────────── */}
      <Modal open={!!cfgDraft} onClose={() => setCfgDraft(null)} title="Edit Schedule">
        {cfgDraft && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold mb-2">Working Days</h3>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((d) => {
                  const on = cfgDraft.days.includes(d);
                  return (
                    <label
                      key={d}
                      className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                        on ? "bg-primary/10 border-primary/30 text-primary" : "border-on-surface/10 opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={on}
                        onChange={(e) => toggleDay(d, e.target.checked)}
                      />
                      {d}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Slots</h3>
              <div className="space-y-2">
                {cfgDraft.slots.map((slot, i) => (
                  <div key={`${slot.kind}-${i}`} className="flex flex-wrap gap-2 items-center">
                    <Select
                      className="!w-auto"
                      value={slot.kind}
                      onChange={(e) => updSlot(i, { kind: e.target.value as TimetableSlot["kind"] })}
                    >
                      <option value="period">Period</option>
                      <option value="tiffin">Tiffin</option>
                    </Select>
                    <label className="text-xs text-on-surface/60 flex items-center gap-1">
                      Start
                      <Input type="time" className="!py-1.5 !px-2 !w-28" value={slot.start} onChange={(e) => updSlot(i, { start: e.target.value })} />
                    </label>
                    <label className="text-xs text-on-surface/60 flex items-center gap-1">
                      End
                      <Input type="time" className="!py-1.5 !px-2 !w-28" value={slot.end} onChange={(e) => updSlot(i, { end: e.target.value })} />
                    </label>
                    <GlassButton type="button" variant="ghost" onClick={() => rmSlot(i)}>
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </GlassButton>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <GlassButton type="button" variant="ghost" onClick={() => addSlot("period")}>+ Add Period</GlassButton>
                <GlassButton type="button" variant="ghost" onClick={() => addSlot("tiffin")}>+ Add Tiffin</GlassButton>
              </div>
            </div>

            {cfgError && (
              <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{cfgError}</p>
            )}

            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" onClick={() => setCfgDraft(null)}>Cancel</GlassButton>
              <GlassButton onClick={saveCfg}>Save Schedule</GlassButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}