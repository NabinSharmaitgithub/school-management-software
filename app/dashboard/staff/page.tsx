"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addLeave,
  deleteStaff,
  listLeaves,
  listStaff,
  staffNames,
  updateLeave,
} from "@/lib/data";
import type { LeaveRequest, Staff } from "@/lib/data";
import { useAuthEmail } from "@/components/dashboard/teacher-scope";
import { Field, GlassButton, GlassCard, Input, Modal, StatusPill, Alert } from "@/components/ui";

export default function StaffPage() {
  const email = useAuthEmail();
  const isTeacher = email === "teacher@school.local";
  const [tab, setTab] = useState<"directory" | "leaves">("directory");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leave, setLeave] = useState({ start_date: "", end_date: "", reason: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, l, n] = await Promise.all([listStaff(), listLeaves(), staffNames()]);
      setStaff(s);
      setLeaves(l);
      setNames(n);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter(
      (s) => s.name.toLowerCase().includes(term) || s.role.toLowerCase().includes(term)
    );
  }, [staff, q]);

  const myId = useMemo(() => staff.find((s) => s.email === email)?.id ?? null, [staff, email]);

  async function onDelete() {
    if (!active) return;
    await deleteStaff(active);
    setActive(null);
    load();
  }

  async function setLeaveStatus(id: string, status: LeaveRequest["status"]) {
    await updateLeave(id, { status });
    load();
  }

  async function onSubmitLeave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!myId || !leave.start_date || !leave.end_date || !leave.reason.trim()) {
      setError("Start date, end date and reason are required.");
      return;
    }
    setSaving(true);
    try {
      await addLeave({
        staff_id: myId,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason.trim(),
        status: "pending",
      });
      setLeaveOpen(false);
      setLeave({ start_date: "", end_date: "", reason: "" });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const pending = leaves.filter((l) => l.status === "pending").length;

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Staff</h1>
          <p className="text-sm text-on-surface/60">
            {tab === "directory" ? `${filtered.length} staff members` : `${pending} pending leave requests`}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "leaves" && isTeacher && (
            <GlassButton variant="ghost" onClick={() => setLeaveOpen(true)}>
              <span className="material-symbols-outlined text-lg">event_busy</span>
              Request Leave
            </GlassButton>
          )}
          {tab === "directory" && !isTeacher && (
            <Link href="/dashboard/staff/new">
              <GlassButton>
                <span className="material-symbols-outlined text-lg">add</span>
                Add Staff
              </GlassButton>
            </Link>
          )}
        </div>
      </header>

      <div className="flex gap-2">
        {(["directory", "leaves"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`glass-btn-ghost px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === t ? "bg-primary/20 text-primary" : "text-on-surface/60"
            }`}
          >
            {t === "directory" ? "Directory" : "Leave Requests"}
          </button>
        ))}
      </div>

      {error && <Alert message={error} type="error" />}

      {tab === "directory" ? (
        <GlassCard className="p-4">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 text-lg">
              search
            </span>
            <input
              className="glass-input pl-10 pr-4 py-2.5 rounded-lg text-sm w-full sm:w-80"
              placeholder="Search by name or role…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">Loading staff…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">
              {staff.length === 0
                ? "No staff members yet. Click “Add Staff” to create one."
                : "No staff match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4 hidden sm:table-cell">Role</th>
                    <th className="pb-3 pr-4 hidden md:table-cell">Department</th>
                    <th className="pb-3 pr-4 hidden lg:table-cell">Contact</th>
                    <th className="pb-3 pr-4 hidden sm:table-cell">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-t border-on-surface/10 hover:bg-white/40">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/staff/${s.id}`}
                          className="flex items-center gap-3 group"
                        >
                          {s.photo_url ? (
                            <img src={s.photo_url} alt={s.name} className="w-9 h-9 rounded-full object-cover border border-white/70 bg-white/60 shrink-0" />
                          ) : (
                            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                              {s.name
                                .split(" ")
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium text-on-surface group-hover:text-primary transition-colors">
                            {s.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">{s.role}</td>
                      <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">
                        {s.department}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell text-on-surface/70">
                        {s.phone || s.email || "—"}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <StatusPill tone={s.status === "active" ? "success" : s.status === "on_leave" ? "warning" : "neutral"}>
                          {s.status.replace("_", " ")}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/staff/${s.id}`}
                            className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </Link>
                          {!isTeacher && (
                            <button
                              onClick={() => setActive(s.id)}
                              className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="p-4">
          {loading ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">Loading leave requests…</p>
          ) : leaves.length === 0 ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">
              No leave requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                    <th className="pb-3 pr-4">Staff</th>
                    <th className="pb-3 pr-4 hidden sm:table-cell">Dates</th>
                    <th className="pb-3 pr-4 hidden md:table-cell">Reason</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id} className="border-t border-on-surface/10 hover:bg-white/40">
                      <td className="py-3 pr-4 font-medium text-on-surface">
                        {names[l.staff_id] ?? l.staff_id}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                        {l.start_date} → {l.end_date}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">{l.reason}</td>
                      <td className="py-3 pr-4">
                        <StatusPill
                          tone={
                            l.status === "approved"
                              ? "success"
                              : l.status === "rejected"
                                ? "error"
                                : "warning"
                          }
                        >
                          {l.status}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-right">
                        {!isTeacher && l.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setLeaveStatus(l.id, "approved")}
                              className="glass-btn-ghost px-2.5 h-8 rounded-lg text-xs text-success hover:bg-success/10"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setLeaveStatus(l.id, "rejected")}
                              className="glass-btn-ghost px-2.5 h-8 rounded-lg text-xs text-rose hover:bg-rose/10"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title="Delete staff member?">
        <p className="text-sm text-on-surface/70 mb-6">
          This will permanently remove the staff member from the directory. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setActive(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>

      <Modal open={leaveOpen} onClose={() => setLeaveOpen(false)} title="Request leave">
        <form className="space-y-4" onSubmit={onSubmitLeave}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date *">
              <Input
                type="date"
                value={leave.start_date}
                onChange={(e) => setLeave((l) => ({ ...l, start_date: e.target.value }))}
                required
              />
            </Field>
            <Field label="End date *">
              <Input
                type="date"
                value={leave.end_date}
                onChange={(e) => setLeave((l) => ({ ...l, end_date: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Reason *">
            <Input
              placeholder="e.g. Medical leave"
              value={leave.reason}
              onChange={(e) => setLeave((l) => ({ ...l, reason: e.target.value }))}
              required
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setLeaveOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Request"}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}