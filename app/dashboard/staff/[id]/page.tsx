"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { addLeave, deleteStaff, getStaff, listLeaves, updateStaff } from "@/lib/data";
import type { LeaveRequest, Staff } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    joined: "",
    status: "active" as Staff["status"],
  });
  const [leave, setLeave] = useState({ start_date: "", end_date: "", reason: "" });

  async function load() {
    const [s, l] = await Promise.all([getStaff(id!), listLeaves()]);
    if (s) {
      setStaff(s);
      setForm({
        name: s.name ?? "",
        role: s.role ?? "",
        department: s.department ?? "",
        email: s.email ?? "",
        phone: s.phone ?? "",
        joined: s.joined ?? "",
        status: s.status ?? "active",
      });
    }
    setLeaves(l.filter((x) => x.staff_id === id).sort((a, b) => b.start_date.localeCompare(a.start_date)));
  }

  useEffect(() => {
    load();
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateStaff(id!, form);
      setStaff((s) => (s ? { ...s, ...form } : s));
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    await deleteStaff(id!);
    router.push("/dashboard/staff");
  }

  async function onSubmitLeave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!leave.start_date || !leave.end_date || !leave.reason.trim()) {
      setError("Start date, end date and reason are required.");
      return;
    }
    setSaving(true);
    try {
      await addLeave({
        staff_id: id!,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason.trim(),
        status: "pending",
      });
      setLeaveModal(false);
      setLeave({ start_date: "", end_date: "", reason: "" });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!staff) {
    return (
      <GlassCard className="p-8 text-center text-sm text-on-surface/60">
        Loading staff…
      </GlassCard>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/staff"
            className="text-xs text-primary flex items-center gap-1 mb-1 hover:text-tertiary"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Staff
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{staff.name}</h1>
            <StatusPill tone={staff.status === "active" ? "success" : staff.status === "on_leave" ? "warning" : "neutral"}>
              {staff.status.replace("_", " ")}
            </StatusPill>
          </div>
          <p className="text-sm text-on-surface/60">
            {staff.role} · {staff.department || "No department"}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <GlassButton variant="ghost" onClick={() => setLeaveModal(true)}>
                <span className="material-symbols-outlined text-lg">event_busy</span>
                Request Leave
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => setEditing(true)}>
                <span className="material-symbols-outlined text-lg">edit</span>
                Edit
              </GlassButton>
            </>
          )}
          <GlassButton variant="danger" onClick={() => setConfirm(true)}>
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </header>

      {error && (
        <div className="glass-panel p-4 text-sm text-error bg-rose/10">{error}</div>
      )}

      {editing ? (
        <GlassCard className="p-6">
          <form className="space-y-5" onSubmit={onSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name *">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </Field>
              <Field label="Role / Designation *">
                <Input value={form.role} onChange={(e) => set("role", e.target.value)} required />
              </Field>
              <Field label="Department">
                <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
              </Field>
              <Field label="Date joined">
                <Input type="date" value={form.joined} onChange={(e) => set("joined", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlassButton type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4 text-sm text-on-surface/60 uppercase tracking-wide">
              Role
            </h2>
            <InfoRow label="Designation" value={staff.role} />
            <InfoRow label="Department" value={staff.department || "—"} />
            <InfoRow label="Joined" value={staff.joined || "—"} />
            <InfoRow label="Status" value={staff.status.replace("_", " ")} />
          </GlassCard>
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4 text-sm text-on-surface/60 uppercase tracking-wide">
              Contact
            </h2>
            <InfoRow label="Phone" value={staff.phone || "—"} />
            <InfoRow label="Email" value={staff.email || "—"} />
          </GlassCard>
        </div>
      )}

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-on-surface/60 uppercase tracking-wide">
            Leave History
          </h2>
          {!editing && (
            <GlassButton variant="ghost" onClick={() => setLeaveModal(true)}>
              <span className="material-symbols-outlined text-lg">add</span>
              Request Leave
            </GlassButton>
          )}
        </div>
        {leaves.length === 0 ? (
          <p className="text-sm text-on-surface/60">No leave requests yet.</p>
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="rounded-lg bg-white/40 border border-white/60 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    {l.start_date} → {l.end_date}
                  </p>
                  <p className="text-xs text-on-surface/60 mt-0.5">{l.reason}</p>
                </div>
                <StatusPill tone={l.status === "approved" ? "success" : l.status === "rejected" ? "error" : "warning"}>
                  {l.status}
                </StatusPill>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete staff member?">
        <p className="text-sm text-on-surface/70 mb-6">
          Permanently remove <strong>{staff.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(false)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>

      <Modal open={leaveModal} onClose={() => setLeaveModal(false)} title="Request leave">
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
            <GlassButton type="button" variant="ghost" onClick={() => setLeaveModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Submit Request"}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-on-surface/10 last:border-0">
      <span className="text-sm text-on-surface/60">{label}</span>
      <span className="text-sm font-medium text-on-surface text-right">{value}</span>
    </div>
  );
}