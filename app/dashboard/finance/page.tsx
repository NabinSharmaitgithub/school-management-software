"use client";

import { useEffect, useState } from "react";
import { listPayments, addPayment, deletePayment, studentNames } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, Alert } from "@/components/ui";

type Payment = { id: string; student_id: string; description: string; amount: number; date: string; method: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    student_id: "",
    description: "",
    amount: "",
    date: today(),
    method: "Cash",
  });

  async function load() {
    try {
      const [p, s] = await Promise.all([listPayments(), studentNames()]);
      setPayments(p);
      setStudents(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = Number(form.amount);
    if (!form.student_id || !form.description.trim() || !isFinite(amount) || amount <= 0) {
      setError("Student, description and a positive amount are required.");
      return;
    }
    setSaving(true);
    try {
      await addPayment({
        student_id: form.student_id,
        description: form.description.trim(),
        amount,
        date: form.date,
        method: form.method,
      });
      setAddOpen(false);
      setForm({ student_id: "", description: "", amount: "", date: today(), method: "Cash" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm) return;
    await deletePayment(confirm);
    setConfirm(null);
    load();
  }

  const studentOptions = Object.entries(students)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Finance</h1>
          <p className="text-sm text-on-surface/60">
            {payments.length} payments · {" "}
            <span className="font-semibold text-on-surface">
              Total ₹{total.toLocaleString("en-IN")}
            </span>
          </p>
        </div>
        <GlassButton onClick={() => setAddOpen(true)}>
          <span className="material-symbols-outlined text-lg">add</span>
          Record Payment
        </GlassButton>
      </header>

      <GlassCard className="p-4">
        {loading ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            No payments yet. Click “Record Payment” to add the first one.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Description</th>
                  <th className="pb-3 pr-4 hidden md:table-cell">Method</th>
                  <th className="pb-3 pr-4 hidden lg:table-cell">Date</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-on-surface/10 hover:bg-white/40">
                    <td className="py-3 pr-4 font-medium text-on-surface">
                      {students[p.student_id] ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                      {p.description}
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">{p.method}</td>
                    <td className="py-3 pr-4 hidden lg:table-cell text-on-surface/70">{p.date}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-success">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setConfirm(p.id)}
                        className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record payment">
        <form className="space-y-4" onSubmit={onAdd}>
          <Field label="Student *">
            <Select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">Select student…</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description *">
            <Input
              placeholder="e.g. Tuition fee — March"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹) *">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </Field>
            <Field label="Method">
              <Select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
              >
                {["Cash", "Card", "Bank Transfer", "UPI", "Cheque"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>

{error && <Alert message={error} type="error" />}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Payment"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete payment?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes the payment record. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}