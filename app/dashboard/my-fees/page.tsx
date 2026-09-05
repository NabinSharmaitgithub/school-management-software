"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getUserByEmail, listInvoicesHydrated } from "@/lib/data";
import type { FeeInvoice } from "@/lib/data";
import { auth } from "@/lib/firebase";
import { GlassCard, GlassButton } from "@/components/ui";

const CURR = (n: number) => `रु${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function monthLabel(month: string) {
  const [y, m] = month.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const STATUS_STYLE: Record<string, string> = {
  PAID: "text-success",
  PARTIAL: "text-amber-600",
  PENDING: "text-on-surface/50",
  OVERDUE: "text-rose",
};

export default function MyFeesPage() {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      const me = auth?.currentUser?.email ?? null;
      setEmail(me);
      if (!me) {
        setLoading(false);
        setNote("You are not signed in.");
        return;
      }
      const user = await getUserByEmail(me);
      if (!user?.student_id) {
        setLoading(false);
        setNote("No student account is linked to your login yet. Contact the school office.");
        return;
      }
      const all = await listInvoicesHydrated();
      const mine = all
        .filter((i) => i.student_id === user.student_id)
        .sort((a, b) => b.month.localeCompare(a.month));
      setInvoices(mine);
      setStudentName(mine[0]?.student_name ?? "");
      setLoading(false);
    })();
  }, []);

  function downloadReceipt(inv: FeeInvoice) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Fee Statement", 14, 18);
    doc.setFontSize(10);
    doc.text(`Student: ${inv.student_name}`, 14, 30);
    doc.text(`Class: ${inv.class_name}`, 14, 36);
    doc.text(`Period: ${monthLabel(inv.month)}`, 14, 42);
    autoTable(doc, {
      startY: 50,
      head: [["Item", "Amount"]],
      body: inv.fee_items.map((f) => [f.name, CURR(f.amount)]),
      foot: [
        ["Total", CURR(inv.total)],
        ["Discount", `-${CURR(inv.discount)}`],
        ["Late fee", CURR(inv.late_fee)],
        ["Payable", CURR(inv.payable)],
        ["Paid", CURR(inv.paid)],
      ],
    });
    doc.text(`Status: ${inv.status}`, 14, (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10);
    doc.save(`fees-${inv.student_name.replace(/\s+/g, "-").toLowerCase()}-${inv.month}.pdf`);
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4">
        <h1 className="text-xl font-semibold">My Fees</h1>
        <p className="text-sm text-on-surface/60">
          {studentName ? `Fee statement for ${studentName}` : "Read-only fee statement"}
        </p>
      </header>

      <GlassCard className="p-4">
        {loading ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
        ) : note ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">{note}</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-on-surface/60 py-8 text-center">
            No fee invoices yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50 border-b border-on-surface/10">
                  <th className="py-2 pr-2">Month</th>
                  <th className="py-2 pr-2">Due date</th>
                  <th className="py-2 pr-2 text-right hidden sm:table-cell">Payable</th>
                  <th className="py-2 pr-2 text-right hidden sm:table-cell">Paid</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id} className="border-b border-on-surface/5">
                    <td className="py-3 pr-2 font-medium text-on-surface">{monthLabel(i.month)}</td>
                    <td className="py-3 pr-2 text-on-surface/70">{i.due_date}</td>
                    <td className="py-3 pr-2 text-right hidden sm:table-cell">
                      {CURR(i.payable)}
                      {i.late_fee > 0 && <span className="block text-[11px] text-rose">+{CURR(i.late_fee)} late</span>}
                    </td>
                    <td className="py-3 pr-2 text-right hidden sm:table-cell text-on-surface/70">
                      {i.paid > 0 ? CURR(i.paid) : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      <span className={STATUS_STYLE[i.status] ?? "text-on-surface/50"}>{i.status}</span>
                    </td>
                    <td className="py-3 text-right">
                      <GlassButton variant="ghost" onClick={() => downloadReceipt(i)}>
                        <span className="material-symbols-outlined text-lg">download</span>
                        PDF
                      </GlassButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}