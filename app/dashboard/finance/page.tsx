"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  listPayments,
  addPayment,
  deletePayment,
  listStudents,
  listClasses,
  listInvoicesHydrated,
  generateInvoices,
  recordInvoicePayment,
  listFeeStructures,
  listDiscounts,
  addDiscount,
  setLateFee,
} from "@/lib/data";
import type { Class, Student, FeeInvoice, Discount, LateFee } from "@/lib/data";
import { auth } from "@/lib/firebase";
import { Field, GlassButton, GlassCard, Input, Modal, Select, Alert } from "@/components/ui";
import PayrollSection from "@/components/payroll/PayrollSection";

type Payment = { id: string; student_id: string; description: string; amount: number; date: string; method: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

const CURR = (n: number) => `रु${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  if (!m) return month;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
});

const STATUS_STYLE: Record<string, string> = {
  PAID: "text-success",
  PARTIAL: "text-amber-600",
  PENDING: "text-on-surface/50",
  OVERDUE: "text-rose",
};

export default function FinancePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<{ class_id: string; name: string; fees: { name: string; amount: number }[] }[]>([]);
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

  const [tab, setTab] = useState<"collections" | "payroll" | "fees">("collections");

  // Fees state
  const [invClass, setInvClass] = useState("");
  const [invMonth, setInvMonth] = useState(MONTHS[0]);
  const [invStatus, setInvStatus] = useState("");
  const [genOpen, setGenOpen] = useState(false);
  const [genStudent, setGenStudent] = useState("");
  const [genMsg, setGenMsg] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lateFee, setLateFeeState] = useState<LateFee>({ grace_days: 0, penalty_type: "FIXED", penalty_value: 0 });
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [discountStudent, setDiscountStudent] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  // Payment modal state
  const [payInv, setPayInv] = useState<FeeInvoice | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payDate, setPayDate] = useState(today());
  const [payRef, setPayRef] = useState("");
  const [payError, setPayError] = useState("");
  // Receipt modal
  const [receipt, setReceipt] = useState<{ number: string; inv: FeeInvoice; paid: number; method: string; date: string } | null>(null);

  async function load() {
    try {
      const [p, s, c, inv, fs, d] = await Promise.all([
        listPayments(),
        listStudents(),
        listClasses(),
        listInvoicesHydrated(),
        listFeeStructures(),
        listDiscounts(),
      ]);
      setPayments(p);
      setAllStudents(s);
      setStudents(Object.fromEntries(s.map((st) => [st.id, st.name])));
      setClasses(c);
      setInvoices(inv);
      setFeeStructures(fs);
      setDiscounts(d);
      setLoading(false);
    } catch {
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

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenMsg("");
    try {
      const n = await generateInvoices(invClass, invMonth, genStudent || undefined);
      setGenMsg(`${n ? `${n} invoice${n > 1 ? "s" : ""} generated for ` : "No new invoices for "}${monthLabel(invMonth)}.`);
      setGenOpen(false);
      load();
    } catch (err) {
      setGenMsg((err as Error).message);
    }
  }

  async function onRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPayError("");
    if (!payInv) return;
    const amount = Number(payAmount);
    if (!isFinite(amount) || amount <= 0) {
      setPayError("Enter a positive amount.");
      return;
    }
    setSaving(true);
    try {
      const receiptNumber = await recordInvoicePayment(
        payInv.id,
        amount,
        payMethod,
        payDate,
        payRef.trim() || undefined,
        auth?.currentUser?.email ?? undefined
      );
      setReceipt({ number: receiptNumber, inv: { ...payInv, paid: (payInv.paid || 0) + amount }, paid: amount, method: payMethod, date: payDate });
      setPayInv(null);
      setPayAmount("");
      setPayRef("");
      load();
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onAddDiscount(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(discountValue);
    if (!discountStudent || !isFinite(value) || value < 0) return;
    await addDiscount({
      student_id: discountStudent,
      type: discountType,
      value,
      reason: discountReason.trim(),
      approved_by: auth?.currentUser?.email ?? "admin",
      active: true,
    });
    setDiscountStudent("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setDiscountReason("");
    load();
  }

  function downloadReceipt(r: { number: string; inv: FeeInvoice; paid: number; method: string; date: string }) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Fee Payment Receipt", 14, 18);
    doc.setFontSize(10);
    doc.text(`Receipt No: ${r.number}`, 14, 28);
    doc.text(`Date: ${r.date}`, 14, 34);
    doc.text(`Student: ${r.inv.student_name}`, 14, 44);
    doc.text(`Class: ${r.inv.class_name}`, 14, 50);
    doc.text(`Period: ${monthLabel(r.inv.month)}`, 14, 56);
    const table = autoTable(doc, {
      startY: 64,
      head: [["Item", "Amount"]],
      body: r.inv.fee_items.map((f) => [f.name, CURR(f.amount)]),
      foot: [
        ["Total", CURR(r.inv.total)],
        ["Discount", `-${CURR(r.inv.discount)}`],
        ["Amount Paid", CURR(r.paid)],
      ],
    });
    doc.text(`Payment Method: ${r.method}`, 14, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10);
    doc.save(`receipt-${r.inv.student_name.replace(/\s+/g, "-").toLowerCase()}-${r.inv.month}.pdf`);
  }

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

  const selectedClassHasFees = feeStructures.some((f) => f.class_id === invClass && f.fees.length > 0);

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Finance</h1>
            <p className="text-sm text-on-surface/60">
              {tab === "payroll"
                ? "Staff salaries, payslips and payment tracking"
                : tab === "fees"
                ? "Monthly fee invoices, payments and receipts"
                : `${payments.length} payments · Total ${CURR(total)}`}
            </p>
          </div>
          {tab === "collections" && (
            <GlassButton onClick={() => setAddOpen(true)}>
              <span className="material-symbols-outlined text-lg">add</span>
              Record Payment
            </GlassButton>
          )}
          {tab === "fees" && (
            <div className="flex gap-2">
              <GlassButton variant="ghost" onClick={() => setSettingsOpen(true)}>
                <span className="material-symbols-outlined text-lg">settings</span>
                Fee Settings
              </GlassButton>
              <GlassButton onClick={() => { setGenStudent(""); setGenOpen(true); }}>
                <span className="material-symbols-outlined text-lg">receipt_long</span>
                Generate Invoices
              </GlassButton>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4 border-b border-on-surface/10">
          {(["collections", "payroll", "fees"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface/50 hover:text-on-surface"
              }`}
            >
              {t === "collections" ? "Collections" : t === "payroll" ? "Payroll" : "Fees"}
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
                      रु{p.amount.toLocaleString("en-IN")}
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

      {tab === "payroll" && <PayrollSection />}

      {tab === "fees" && (
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-end gap-3 mb-4">
            <Field label="Class">
              <Select className="!w-auto" value={invClass} onChange={(e) => setInvClass(e.target.value)}>
                <option value="">All classes</option>
                {classOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.section ? ` - ${c.section}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Month">
              <Select className="!w-auto" value={invMonth} onChange={(e) => setInvMonth(e.target.value)}>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select className="!w-auto" value={invStatus} onChange={(e) => setInvStatus(e.target.value)}>
                <option value="">All statuses</option>
                {["PAID", "PARTIAL", "PENDING", "OVERDUE"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
            {genMsg && (
              <p className="text-xs text-on-surface/60 bg-white/40 border border-on-surface/10 rounded-lg px-3 py-2">
                {genMsg}
              </p>
            )}
          </div>

          {(() => {
            const rows = invoices
              .filter((b) => b.month === invMonth && (!invClass || b.class_id === invClass) && (!invStatus || b.status === invStatus))
              .sort((a, b) => a.student_name.localeCompare(b.student_name));
            return rows.length === 0 ? (
              <p className="text-sm text-on-surface/60 py-8 text-center">
                No invoices for {monthLabel(invMonth)}. Click “Generate Invoices” to create them.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50 border-b border-on-surface/10">
                      <th className="py-2 pr-2">Student</th>
                      <th className="py-2 pr-2 hidden md:table-cell">Class</th>
                      <th className="py-2 pr-2 hidden lg:table-cell">Due date</th>
                      <th className="py-2 pr-2 text-right">Payable</th>
                      <th className="py-2 pr-2 text-right">Paid</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((b) => (
                      <tr key={b.id} className="border-b border-on-surface/5 hover:bg-white/40">
                        <td className="py-3 pr-2 font-medium text-on-surface">{b.student_name}</td>
                        <td className="py-3 pr-2 hidden md:table-cell text-on-surface/70">{b.class_name}</td>
                        <td className="py-3 pr-2 hidden lg:table-cell text-on-surface/70">{b.due_date}</td>
                        <td className="py-3 pr-2 text-right">{CURR(b.payable)}
                          {b.late_fee > 0 && <span className="block text-[11px] text-rose">+{CURR(b.late_fee)} late</span>}
                        </td>
                        <td className="py-3 pr-2 text-right text-on-surface/70">
                          {b.paid > 0 ? CURR(b.paid) : "—"}
                        </td>
                        <td className="py-3 pr-2">
                          <span className={STATUS_STYLE[b.status] ?? "text-on-surface/50"}>{b.status}</span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/dashboard/invoices/${b.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mr-2">
                              <span className="material-symbols-outlined text-lg">receipt_long</span>
                              View
                            </Link>
                            <GlassButton
                              variant="ghost"
                              disabled={b.status === "PAID"}
                              onClick={() => { setPayInv(b); setPayAmount(String(b.payable - b.paid > 0 ? b.payable - b.paid : "")); setPayDate(today()); setPayError(""); }}
                            >
                              <span className="material-symbols-outlined text-lg">payments</span>
                              Collect
                            </GlassButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-on-surface">
                      <td className="py-2 pr-2 pt-3" colSpan={2}>Due this month (all classes)</td>
                      <td className="hidden lg:table-cell" />
                      <td className="py-2 pr-2 pt-3 text-right">{CURR(rows.reduce((s, b) => s + (b.payable - b.paid), 0))}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}
        </GlassCard>
      )}

      {/* Generate invoices */}
      <Modal open={genOpen} onClose={() => { setGenOpen(false); setGenMsg(""); }} title="Generate monthly invoices">
        <form className="space-y-4" onSubmit={onGenerate}>
          <Field label="Class *">
            <Select
              value={invClass}
              onChange={(e) => { setInvClass(e.target.value); setGenStudent(""); }}
              required
            >
              <option value="">Select class…</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.section ? ` - ${c.section}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {invClass && !selectedClassHasFees && (
            <Alert type="error" message="This class has no fee structure yet. Set one up in Settings → Fee Structure first." />
          )}
          <Field label="Single student (optional)">
            <Select value={genStudent} onChange={(e) => setGenStudent(e.target.value)} disabled={!invClass}>
              <option value="">All students in class</option>
              {allStudents
                .filter((s) => s.class_id === invClass)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Month">
            <Select value={invMonth} onChange={(e) => setInvMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-on-surface/60">
            Invoices pull line items and amounts from the class fee structure. Discounts and late fees apply automatically.
          </p>
          {genMsg && <Alert message={genMsg} type="error" />}
          <div className="flex justify-end gap-3">
            <GlassButton type="button" variant="ghost" onClick={() => { setGenOpen(false); setGenMsg(""); }}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={!!invClass && !selectedClassHasFees}>
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              Generate
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* Record payment against invoice */}
      <Modal open={!!payInv} onClose={() => setPayInv(null)} title={`Collect payment — ${payInv?.student_name ?? ""}`}>
        {payInv && (
          <form className="space-y-4" onSubmit={onRecordPayment}>
            <div className="text-sm text-on-surface/70 space-y-1">
              <p>Period: {monthLabel(payInv.month)}</p>
              <p>Total {CURR(payInv.total)} · Paid {CURR(payInv.paid)} · <span className="font-semibold text-on-surface">Balance {CURR(payInv.payable - payInv.paid)}</span></p>
            </div>
            <Field label="Amount (रु) *">
              <Input type="number" min="1" inputMode="numeric" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Method">
                <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  {["Cash", "Card", "Bank Transfer", "UPI", "Cheque"].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Transaction ref (optional)">
              <Input placeholder="Cheque no / UPI id…" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
            </Field>
            {payError && <Alert message={payError} type="error" />}
            <div className="flex justify-end gap-3">
              <GlassButton type="button" variant="ghost" onClick={() => setPayInv(null)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Record & Issue Receipt"}
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>

      {/* Receipt */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment recorded">
        {receipt && (
          <div className="space-y-4">
            <div className="bg-white/40 border border-on-surface/10 rounded-lg p-4 text-sm space-y-1">
              <p className="font-semibold text-on-surface">Receipt {receipt.number}</p>
              <p>{receipt.inv.student_name} · {monthLabel(receipt.inv.month)}</p>
              <p className="text-success font-semibold">{CURR(receipt.paid)} via {receipt.method}</p>
            </div>
            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" onClick={() => setReceipt(null)}>
                Close
              </GlassButton>
              <GlassButton onClick={() => downloadReceipt(receipt)}>
                <span className="material-symbols-outlined text-lg">download</span>
                Download PDF
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Fee settings: late fee + discounts */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Fee settings">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-on-surface mb-2">Late fee</h3>
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); setLateFee(lateFee); setSettingsOpen(false); }}
            >
              <div className="grid grid-cols-3 gap-3">
                <Field label="Grace (days)">
                  <Input type="number" min="0" value={lateFee.grace_days} onChange={(e) => setLateFeeState({ ...lateFee, grace_days: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Type">
                  <Select value={lateFee.penalty_type} onChange={(e) => setLateFeeState({ ...lateFee, penalty_type: e.target.value as "PERCENT" | "FIXED" })}>
                    <option value="PERCENT">Percent</option>
                    <option value="FIXED">Fixed</option>
                  </Select>
                </Field>
                <Field label="Penalty">
                  <Input type="number" min="0" value={lateFee.penalty_value} onChange={(e) => setLateFeeState({ ...lateFee, penalty_value: Number(e.target.value) || 0 })} />
                </Field>
              </div>
              <p className="text-xs text-on-surface/60">Applied to unpaid invoices past the due date + grace period.</p>
              <div className="flex justify-end">
                <GlassButton type="submit">Save late fee</GlassButton>
              </div>
            </form>
          </div>

          <div className="border-t border-on-surface/10 pt-5">
            <h3 className="text-sm font-medium text-on-surface mb-2">Discounts</h3>
            <form className="space-y-3 mb-3" onSubmit={onAddDiscount}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Student *">
                  <Select value={discountStudent} onChange={(e) => setDiscountStudent(e.target.value)} required>
                    <option value="">Select student…</option>
                    {allStudents.sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <Select value={discountType} onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}>
                      <option value="PERCENT">Percent</option>
                      <option value="FIXED">Fixed</option>
                    </Select>
                  </Field>
                  <Field label="Value">
                    <Input type="number" min="0" inputMode="numeric" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} required />
                  </Field>
                </div>
              </div>
              <Field label="Reason">
                <Input placeholder="e.g. Sibling concession" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} />
              </Field>
              <div className="flex justify-end">
                <GlassButton type="submit">Add discount</GlassButton>
              </div>
            </form>
            {discounts.length === 0 ? (
              <p className="text-xs text-on-surface/60">No discounts yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {discounts.map((d) => (
                  <li key={d.id} className="flex justify-between text-on-surface/80">
                    <span>{students[d.student_id] ?? d.student_id} — {d.type === "PERCENT" ? `${d.value}%` : CURR(d.value)} {d.reason && `(${d.reason})`}</span>
                    <span className="text-on-surface/50">{d.active ? "Active" : "Inactive"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>

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
            <Field label="Amount (रु) *">
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
