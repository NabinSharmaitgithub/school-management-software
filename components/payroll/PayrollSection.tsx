"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listStaff,
  getPayslips,
  generatePayroll,
  updatePayslipStatus,
  updatePayslipAmounts,
} from "@/lib/data";
import type { Staff, Payslip } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

const CURR = (n: number) => `रु${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

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

export default function PayrollSection() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(MONTHS[0]);
  const [dept, setDept] = useState("All");
  const [running, setRunning] = useState(false);
  const [preview, setPreview] = useState<Payslip | null>(null);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState<Payslip | null>(null);
  const [basic, setBasic] = useState("");
  const [allowances, setAllowances] = useState("");
  const [deductions, setDeductions] = useState("");

  const load = async () => {
    try {
      const [st, ps] = await Promise.all([listStaff(), getPayslips()]);
      setStaff(st);
      setPayslips(ps);
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

  const depts = useMemo(() => Array.from(new Set(staff.map((s) => s.department || "General"))).sort(), [staff]);

  const rows = useMemo(
    () =>
      payslips
        .filter((p) => p.month === month && (dept === "All" || p.department === dept))
        .sort((a, b) => a.staff_name.localeCompare(b.staff_name)),
    [payslips, month, dept]
  );

  const totalBasic = rows.reduce((s, r) => s + r.basic, 0);
  const totalDed = rows.reduce((s, r) => s + r.deductions, 0);
  const totalNet = rows.reduce((s, r) => s + net(r), 0);
  const paidCount = rows.filter((r) => r.status === "paid").length;

  const activeStaff = staff.filter((s) => s.status === "active");
  const covered = useMemo(
    () => new Set(payslips.filter((p) => p.month === month).map((p) => p.staff_id)),
    [payslips, month]
  );
  const uncovered = activeStaff.filter((s) => !covered.has(s.id));

  async function onRunPayroll(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (uncovered.length === 0) {
      setToast("All active staff already have payslips for this month.");
      return;
    }
    setRunning(true);
    try {
      const created = await generatePayroll(month);
      setToast(`Payroll generated for ${created} staff member${created === 1 ? "" : "s"}.`);
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function setStatus(ps: Payslip, status: "paid" | "pending") {
    setToast("");
    try {
      await updatePayslipStatus(ps.id, status);
      setPayslips((prev) => prev.map((p) => (p.id === ps.id ? { ...p, status } : p)));
      if (preview?.id === ps.id) setPreview((pr) => (pr ? { ...pr, status } : pr));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openEdit(ps: Payslip) {
    setBasic(String(ps.basic));
    setAllowances(String(ps.allowances));
    setDeductions(String(ps.deductions));
    setEditing(ps);
  }

  async function saveAmounts(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const b = Number(basic), a = Number(allowances), d = Number(deductions);
      await updatePayslipAmounts(editing.id, b, a, d);
      const updated = { ...editing, basic: b, allowances: a, deductions: d };
      setPayslips((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      if (preview?.id === editing.id) setPreview(updated);
      setEditing(null);
      setToast("Payslip amounts updated.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      {error && <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>}
      {toast && <p className="text-xs text-success bg-emerald/10 border border-emerald/20 rounded-lg px-3 py-2">{toast}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <p className="text-[11px] uppercase text-on-surface/50 font-semibold">Payroll Month</p>
          <p className="text-lg font-bold text-on-surface">{monthLabel(month)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] uppercase text-on-surface/50 font-semibold">Roster Size</p>
          <p className="text-lg font-bold text-on-surface">{rows.length} <span className="text-sm font-normal text-on-surface/50">({paidCount} paid)</span></p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] uppercase text-on-surface/50 font-semibold">Gross (Basic + Allowances)</p>
          <p className="text-lg font-bold text-on-surface">{CURR(totalBasic + rows.reduce((s, r) => s + r.allowances, 0))}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-[11px] uppercase text-on-surface/50 font-semibold">Net Payable</p>
          <p className="text-lg font-bold text-on-surface text-emerald-600">{CURR(totalNet)}</p>
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Field label="Month">
            <Select className="!w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select className="!w-auto" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option>All</option>
              {depts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <div className="ml-auto text-xs text-on-surface/50">
            {uncovered.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber">
                <span className="material-symbols-outlined text-sm">info</span>
                {uncovered.length} active staff not yet in this payroll
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-success">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                All active staff covered
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-on-surface/60">
            <p className="mb-3">No payslips for {monthLabel(month)}{dept !== "All" ? ` in ${dept}` : ""}.</p>
            <GlassButton onClick={() => onRunPayroll({ preventDefault: () => {} } as React.FormEvent)} disabled={running}>
              <span className="material-symbols-outlined text-lg">bolt</span>
              Generate {uncovered.length} Payslips
            </GlassButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-on-surface/50 border-b border-on-surface/10">
                  <th className="py-2 pr-2">Staff</th>
                  <th className="py-2 pr-2">Department</th>
                  <th className="py-2 pr-2 text-right">Basic</th>
                  <th className="py-2 pr-2 text-right">Allowances</th>
                  <th className="py-2 pr-2 text-right">Deductions</th>
                  <th className="py-2 pr-2 text-right">Net</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-on-surface/5">
                    <td className="py-3 pr-2">
                      <p className="font-medium text-on-surface">{r.staff_name}</p>
                      <p className="text-xs text-on-surface/50">{r.staff_id}</p>
                    </td>
                    <td className="py-3 pr-2 text-on-surface/70">{r.department}</td>
                    <td className="py-3 pr-2 text-right">{CURR(r.basic)}</td>
                    <td className="py-3 pr-2 text-right text-emerald-600">+{CURR(r.allowances)}</td>
                    <td className="py-3 pr-2 text-right text-error">−{CURR(r.deductions)}</td>
                    <td className="py-3 pr-2 text-right font-semibold text-on-surface">{CURR(net(r))}</td>
                    <td className="py-3 pr-2">
                      <StatusPill tone={r.status === "paid" ? "success" : "neutral"}>{r.status}</StatusPill>
                    </td>
                    <td className="py-3 text-right">
                      <GlassButton variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setPreview(r)}>
                        Payslip
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-on-surface">
                  <td className="py-2 pr-2 pt-3" colSpan={2}>Totals</td>
                  <td className="py-2 pr-2 pt-3 text-right">{CURR(totalBasic)}</td>
                  <td className="py-2 pr-2 pt-3 text-right">{CURR(rows.reduce((s, r) => s + r.allowances, 0))}</td>
                  <td className="py-2 pr-2 pt-3 text-right">{CURR(totalDed)}</td>
                  <td className="py-2 pr-2 pt-3 text-right">{CURR(totalNet)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </GlassCard>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={`Payslip · ${preview ? monthLabel(preview.month) : ""}`}>
        {preview && (
          <div>
            <div className="rounded-xl border border-white/70 bg-white p-4">
              <div className="flex items-center justify-between border-b border-on-surface/10 pb-3 mb-3">
                <div>
                  <p className="font-bold text-primary">Greenwood International School</p>
                  <p className="text-xs text-on-surface/50">Salary Statement · {monthLabel(preview.month)}</p>
                </div>
                <StatusPill tone={preview.status === "paid" ? "success" : "neutral"}>{preview.status}</StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-sm mb-4">
                <p className="text-xs text-on-surface/50">Employee</p>
                <p className="font-medium text-right">{preview.staff_name}</p>
                <p className="text-xs text-on-surface/50">Staff ID</p>
                <p className="text-right text-on-surface/80">{preview.staff_id}</p>
                <p className="text-xs text-on-surface/50">Department</p>
                <p className="text-right text-on-surface/80">{preview.department}</p>
                {preview.payment_date && (
                  <>
                    <p className="text-xs text-on-surface/50">Paid On</p>
                    <p className="text-right text-on-surface/80">{preview.payment_date}</p>
                  </>
                )}
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-on-surface/10">
                    <td className="py-2 text-on-surface/70">Basic Salary</td>
                    <td className="py-2 text-right font-medium">{CURR(preview.basic)}</td>
                  </tr>
                  <tr className="border-b border-on-surface/10">
                    <td className="py-2 text-on-surface/70">Allowances</td>
                    <td className="py-2 text-right font-medium text-emerald-600">+{CURR(preview.allowances)}</td>
                  </tr>
                  <tr className="border-b border-on-surface/10">
                    <td className="py-2 text-on-surface/70">Deductions</td>
                    <td className="py-2 text-right font-medium text-error">−{CURR(preview.deductions)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-on-surface">Net Payable</td>
                    <td className="py-3 text-right font-bold text-on-surface">{CURR(net(preview))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <GlassButton variant="ghost" onClick={() => openEdit(preview)}>
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Edit Amounts
                </GlassButton>
                {preview.status === "pending" ? (
                  <GlassButton onClick={() => setStatus(preview, "paid")}>
                    <span className="material-symbols-outlined text-lg">check</span>
                    Mark as Paid
                  </GlassButton>
                ) : (
                  <GlassButton variant="ghost" onClick={() => setStatus(preview, "pending")}>
                    Revert to Pending
                  </GlassButton>
                )}
              </div>
              <GlassButton variant="ghost" onClick={() => window.print()}>
                <span className="material-symbols-outlined text-lg">print</span>
                Print
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit Amounts · ${editing ? editing.staff_name : ""}`}>
        {editing && (
          <form onSubmit={saveAmounts} className="space-y-4">
            <Field label="Basic Salary">
              <Input type="number" inputMode="numeric" value={basic} onChange={(e) => setBasic(e.target.value)} required />
            </Field>
            <Field label="Allowances">
              <Input type="number" inputMode="numeric" value={allowances} onChange={(e) => setAllowances(e.target.value)} required />
            </Field>
            <Field label="Deductions">
              <Input type="number" inputMode="numeric" value={deductions} onChange={(e) => setDeductions(e.target.value)} required />
            </Field>
            <div className="flex justify-between items-center pt-1">
              <p className="text-sm text-on-surface/70">Net Payable: <span className="font-semibold text-on-surface">{CURR(Number(basic) + Number(allowances) - Number(deductions))}</span></p>
              <GlassButton type="submit">
                <span className="material-symbols-outlined text-lg">save</span>
                Save
              </GlassButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
