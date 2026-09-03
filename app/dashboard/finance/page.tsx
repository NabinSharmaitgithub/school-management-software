"use client";

import { useEffect, useState } from "react";
import {
  listPayments,
  addPayment,
  deletePayment,
  listStudents,
  listClasses,
  getPayslips,
  generatePayroll,
  updatePayslipStatus,
  updatePayslipAmounts,
} from "@/lib/data";
import type { Class, Student, Payslip } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill, Alert } from "@/components/ui";

type Payment = { id: string; student_id: string; description: string; amount: number; date: string; method: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

const CURR = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function net(p: Payslip) {
  return p.basic + p.allowances - p.deductions;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  if (!m) return month;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const MONTHS = Array.from({ length: 6 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({});
  const [classes, setClasses] = useState<Class[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("");
  const [section, setSection] = useState("");
  const [form, setForm] = useState({
    student_id: "",
    description: "",
    amount: "",
    date: today(),
    method: "Cash",
  });

  const [tab, setTab] = useState<"collections" | "payroll">("collections");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [prMonth, setPrMonth] = useState(MONTHS[0]);
  const [running, setRunning] = useState(false);
  const [prMsg, setPrMsg] = useState("");
  const [editPs, setEditPs] = useState<Payslip | null>(null);
  const [pb, setPb] = useState("");
  const [pa, setPa] = useState("");
  const [pd, setPd] = useState("");

  async function load() {
    try {
      const [p, s, c] = await Promise.all([listPayments(), listStudents(), listClasses()]);
      setPayments(p);
      setAllStudents(s);
      setStudents(Object.fromEntries(s.map((st) => [st.id, st.name])));
      setClasses(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab === "payroll") loadPayroll();
  }, [tab]);

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

  const loadPayroll = async () => {
    const ps = await getPayslips();
    setPayslips(ps);
  };

  async function runPayroll() {
    setRunning(true);
    setPrMsg("");
    try {
      const created = await generatePayroll(prMonth);
      await loadPayroll();
      setPrMsg(created ? `Payroll generated for ${created} staff.` : "All active staff already covered.");
    } catch (e) {
      setPrMsg((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function setStatus(ps: Payslip, status: "paid" | "pending") {
    await updatePayslipStatus(ps.id, status);
    setPayslips((prev) => prev.map((p) => (p.id === ps.id ? { ...p, status } : p)));
  }

  async function saveAmounts(ps: Payslip, basic: number, allowances: number, deductions: number) {
    await updatePayslipAmounts(ps.id, basic, allowances, deductions);
    setPayslips((prev) => prev.map((p) => (p.id === ps.id ? { ...p, basic, allowances, deductions } : p)));
  }

  function openEditPayslip(ps: Payslip) {
    setPb(String(ps.basic));
    setPa(String(ps.allowances));
    setPd(String(ps.deductions));
    setEditPs(ps);
  }

  async function onSaveAmounts(e: React.FormEvent) {
    e.preventDefault();
    if (!editPs) return;
    await saveAmounts(editPs, Number(pb), Number(pa), Number(pd));
    setEditPs(null);
  }

  const prRows = payslips.filter((p) => p.month === prMonth);
  const prTotal = prRows.reduce((s, r) => s + net(r), 0);

  const classOptions = classes
    .filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i)
    .sort((a, b) => `${a.name} ${a.section}`.localeCompare(`${b.name} ${b.section}`));
  const sectionOptions = classId
    ? classes.filter((c) => c.id === classId && c.section)
        .map((c) => c.section)
        .filter((s, i, a) => a.indexOf(s) === i)
        .sort((a, b) => a.localeCompare(b))
    : [];
  const sectionSet = new Set(classes.map((c) => `${c.id}/${c.section}`));

  const q = search.trim().toLowerCase();
  const filteredStudents = allStudents
    .filter(
      (s) =>
        (!classId || s.class_id === classId) &&
        (!section || sectionSet.has(`${s.class_id}/${section}`)) &&
        (!q || s.name.toLowerCase().includes(q))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Finance</h1>
            <p className="text-sm text-on-surface/60">
              {tab === "payroll"
                ? `${prRows.length} payslips · Payroll ${CURR(prTotal)}`
                : `${payments.length} payments · Total ${CURR(total)}`}
            </p>
          </div>
          {tab === "collections" && (
            <GlassButton onClick={() => setAddOpen(true)}>
              <span className="material-symbols-outlined text-lg">add</span>
              Record Payment
            </GlassButton>
          )}
        </div>
        <div className="flex gap-2 mt-4 border-b border-on-surface/10">
          {(["collections", "payroll"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface/50 hover:text-on-surface"
              }`}
            >
              {t === "collections" ? "Collections" : "Payroll"}
            </button>
          ))}
        </div>
      </header>

      {tab === "collections" && (
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
      )}

      {tab === "payroll" && (
        <GlassCard className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Field label="Month">
              <Select className="!w-auto" value={prMonth} onChange={(e) => setPrMonth(e.target.value)}>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </Select>
            </Field>
            <div className="ml-auto">
              <GlassButton disabled={running} onClick={runPayroll}>
                <span className="material-symbols-outlined text-lg">bolt</span>
                {running ? "Generating…" : "Run Payroll"}
              </GlassButton>
            </div>
          </div>
          {prMsg && (
            <p className="text-xs text-on-surface/60 bg-white/40 border border-on-surface/10 rounded-lg px-3 py-2 mb-4">
              {prMsg}
            </p>
          )}

          {prRows.length === 0 ? (
            <p className="text-sm text-on-surface/60 py-8 text-center">
              No payslips for {monthLabel(prMonth)}. Click “Run Payroll” to generate them.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50 border-b border-on-surface/10">
                    <th className="py-2 pr-2">Staff</th>
                    <th className="py-2 pr-2 text-right">Basic</th>
                    <th className="py-2 pr-2 text-right">Allowances</th>
                    <th className="py-2 pr-2 text-right">Deductions</th>
                    <th className="py-2 pr-2 text-right">Net</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {prRows
                    .sort((a, b) => a.staff_name.localeCompare(b.staff_name))
                    .map((r) => (
                      <tr key={r.id} className="border-b border-on-surface/5">
                        <td className="py-3 pr-2">
                          <p className="font-medium text-on-surface">{r.staff_name}</p>
                          <p className="text-xs text-on-surface/50">{r.staff_id}</p>
                        </td>
                        <td className="py-3 pr-2 text-right">{CURR(r.basic)}</td>
                        <td className="py-3 pr-2 text-right text-emerald-600">+{CURR(r.allowances)}</td>
                        <td className="py-3 pr-2 text-right text-error">−{CURR(r.deductions)}</td>
                        <td className="py-3 pr-2 text-right font-semibold text-on-surface">{CURR(net(r))}</td>
                        <td className="py-3 pr-2">
                          <button onClick={() => setStatus(r, r.status === "paid" ? "pending" : "paid")} title="Toggle paid/pending">
                            <StatusPill tone={r.status === "paid" ? "success" : "neutral"}>{r.status}</StatusPill>
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <GlassButton variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEditPayslip(r)}>
                            Edit
                          </GlassButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-on-surface">
                    <td className="py-2 pr-2 pt-3">Totals</td>
                    <td className="py-2 pr-2 pt-3 text-right">{CURR(prRows.reduce((s, r) => s + r.basic, 0))}</td>
                    <td className="py-2 pr-2 pt-3 text-right">{CURR(prRows.reduce((s, r) => s + r.allowances, 0))}</td>
                    <td className="py-2 pr-2 pt-3 text-right">{CURR(prRows.reduce((s, r) => s + r.deductions, 0))}</td>
                    <td className="py-2 pr-2 pt-3 text-right">{CURR(prTotal)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Record payment">
        <form className="space-y-4" onSubmit={onAdd}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Class">
              <Select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSection("");
                }}
              >
                <option value="">All classes</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select value={section} onChange={(e) => setSection(e.target.value)} disabled={!classId}>
                <option value="">{classId ? "All sections" : "Select class"}</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Student *">
            <Input
              placeholder="Search student by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              required
            >
              <option value="">
                {filteredStudents.length === 0
                  ? "No students found…"
                  : `Select student… (${filteredStudents.length})`}
              </option>
              {filteredStudents.map((s) => (
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

      <Modal open={!!editPs} onClose={() => setEditPs(null)} title={`Edit Amounts · ${editPs ? editPs.staff_name : ""}`}>
        {editPs && (
          <form className="space-y-4" onSubmit={onSaveAmounts}>
            <Field label="Basic Salary">
              <Input type="number" inputMode="numeric" value={pb} onChange={(e) => setPb(e.target.value)} required />
            </Field>
            <Field label="Allowances">
              <Input type="number" inputMode="numeric" value={pa} onChange={(e) => setPa(e.target.value)} required />
            </Field>
            <Field label="Deductions">
              <Input type="number" inputMode="numeric" value={pd} onChange={(e) => setPd(e.target.value)} required />
            </Field>
            <div className="flex justify-between items-center pt-1">
              <p className="text-sm text-on-surface/70">
                Net: <span className="font-semibold text-on-surface">{CURR(Number(pb) + Number(pa) - Number(pd))}</span>
              </p>
              <GlassButton type="submit">
                <span className="material-symbols-outlined text-lg">save</span>
                Save
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}