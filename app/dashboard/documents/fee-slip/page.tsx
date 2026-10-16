"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  listInvoicesHydrated,
  listPayments,
  getStudent,
  listClasses,
  getSchoolSettings,
} from "@/lib/data";
import type { FeeInvoice, Student, Class, SchoolSettings, Payment } from "@/lib/data";
import { Card, Button, Alert } from "@/components/ui";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  if (!m) return month;
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function cur(n: number, currency?: string) {
  const symbol = currency?.match(/\((.+)\)/)?.[1] ?? "रु";
  return `${symbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function FeeSlipPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Student id comes from the Documents hub via ?id=
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      try {
        if (!id) throw new Error("No student selected. Pick a student from the Documents page.");
        const [s, c, invs, pay, set] = await Promise.all([
          getStudent(id),
          listClasses(),
          listInvoicesHydrated(),
          listPayments(),
          getSchoolSettings(),
        ]);
        if (cancelled) return;
        setStudent(s);
        setClasses(c);
        const studentInvoices = invs.filter((i) => i.student_id === id);
        setInvoices(studentInvoices);
        const studentPayments = pay.filter((p) => p.student_id === id);
        setPayments(studentPayments);
        setSettings(set);
        if (studentInvoices.length) setSelectedMonth(studentInvoices[0].month);
        setError("");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const classOf = classes.find((c) => c.id === student?.class_id);
  const className = classOf ? `${classOf.name} ${classOf.section}` : "";
  const inv = invoices.find((i) => i.month === selectedMonth) || invoices[0];

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading fee slip…
      </Card>
    );
  }

  if (error || !student) {
    return <Alert message={error || "Student not found."} type="error" />;
  }

  if (!inv) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        No fee invoices found for this student.
      </Card>
    );
  }

  const paymentsForInvoice = payments.filter((p) => p.invoice_id === inv.id);
  const totalPaid = paymentsForInvoice.reduce((s, p) => s + p.amount, 0);
  const balance = inv.payable - totalPaid;

  return (
    <div className="space-y-6">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/documents"
          className="text-xs text-teal-600 flex items-center gap-1 hover:text-teal-700"
        >
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          Documents
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fee Slip</h1>
          <p className="text-sm text-slate-500">
            Fee statement for {student.name} · {monthLabel(inv.month)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.print()} className="hidden md:block">
            <span className="material-symbols-outlined text-lg">print</span>
            Print
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-lg">print</span>
            Print Fee Slip
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto relative bg-white text-slate-900 shadow-lg rounded-lg overflow-hidden print:shadow-none">
        <style>{`
          @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            .fee-slip { box-shadow: none; border: 2px solid #000; }
          }
        `}</style>

        <div className="fee-slip no-print p-8 sm:p-12 bg-white border-2 border-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={`${settings?.school_name} logo`}
                  className="w-[80px] h-[80px] rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-[80px] h-[80px] rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-3xl">
                  {initials(settings?.school_name ?? "S")}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
                  {settings?.school_name}
                </h1>
                <p className="text-xs text-slate-500">{settings?.school_address}</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Fee Slip
                </div>
                <div className="text-xs text-slate-500">
                  No: {inv.id} · {monthLabel(inv.month)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase">Student Information</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-medium">{student.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Roll No:</span>
                  <span className="font-medium">{student.roll_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-medium">{student.admission_number || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Class:</span>
                  <span className="font-medium">{className}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-bold text-slate-500 uppercase">Fee Summary</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Period:</span>
                  <span className="font-medium">{monthLabel(inv.month)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Payable:</span>
                  <span className="font-medium">{cur(inv.payable, settings?.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Paid:</span>
                  <span className="font-medium text-emerald-600">{cur(totalPaid, settings?.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="font-medium text-rose-600">{cur(Math.max(0, balance), settings?.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-medium ${inv.status === "PAID" ? "text-emerald-600" : inv.status === "OVERDUE" ? "text-rose-600" : "text-amber-600"}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Fee Items</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="py-3 px-4 text-left text-xs font-bold">Item</th>
                  <th className="py-3 px-4 text-left text-xs font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.fee_items.map((f, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 px-4">{f.name}</td>
                    <td className="py-3 px-4 text-right">{cur(f.amount, settings?.currency)}</td>
                  </tr>
                ))}
                {inv.discount > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4">Discount</td>
                    <td className="py-3 px-4 text-right text-emerald-600">−{cur(inv.discount, settings?.currency)}</td>
                  </tr>
                )}
                {inv.late_fee > 0 && (
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4">Late Fee</td>
                    <td className="py-3 px-4 text-right text-rose-600">+{cur(inv.late_fee, settings?.currency)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="py-3 px-4 text-right">Total Payable</td>
                  <td className="py-3 px-4 text-right">{cur(inv.payable, settings?.currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {paymentsForInvoice.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Payment History</h3>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="py-3 px-4 text-left text-xs font-bold">Date</th>
                    <th className="py-3 px-4 text-left text-xs font-bold">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-bold">Method</th>
                    <th className="py-3 px-4 text-left text-xs font-bold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsForInvoice.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-3 px-4">{p.date}</td>
                      <td className="py-3 px-4">{cur(p.amount, settings?.currency)}</td>
                      <td className="py-3 px-4">{p.method}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{p.receipt_number || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500">Authorized Signatory</p>
              <div className="h-1 w-24 border-t border-slate-900 mt-2"></div>
              <p className="text-xs text-slate-500 mt-1">Accounts Office</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Received By</p>
              <div className="h-1 w-24 border-t border-slate-900 mt-2"></div>
              <p className="text-xs text-slate-500 mt-1">Parent / Guardian Signature</p>
            </div>
          </div>

          <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest rotate-[-15deg]">
            OFFICIAL DOCUMENT
          </div>
        </div>

        <div className="no-print mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <span className="material-symbols-outlined text-lg">print</span>
            Print Fee Slip
          </Button>
        </div>
      </div>
    </div>
  );
}
