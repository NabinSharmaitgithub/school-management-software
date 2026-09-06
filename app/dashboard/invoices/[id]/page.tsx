"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listInvoicesHydrated, getSchoolSettings } from "@/lib/data";
import type { FeeInvoice, SchoolSettings } from "@/lib/data";
import { GlassButton, StatusPill } from "@/components/ui";

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
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inv, setInv] = useState<FeeInvoice | null>(null);
  const [school, setSchool] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [invs, s] = await Promise.all([listInvoicesHydrated(), getSchoolSettings()]);
      if (cancelled) return;
      setInv(invs.find((i) => i.id === params.id) ?? null);
      setSchool(s);
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const cur = (n: number) => `${school ? school.currency.match(/\((.+)\)/)?.[1] ?? "रु" : "रु"}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </button>
        <GlassButton onClick={() => window.print()}>
          <span className="material-symbols-outlined text-lg">print</span>
          Print Invoice
        </GlassButton>
      </div>

      {!inv || !school ? (
        <div className="glass-panel p-10 text-center text-on-surface/50 text-sm">Loading invoice…</div>
      ) : (
        <div className="max-w-3xl mx-auto relative bg-white text-[#1a1a1a] shadow-lg rounded-lg overflow-hidden print:shadow-none">
          <style>{`
            @media print { body { background: #fff; } .glass-panel, nav, aside { display: none !important; } }
          `}</style>

          <div className="relative px-8 py-10 sm:px-10">
            <div className="absolute top-0 left-0 w-[60px] h-9 bg-[#231f20]" />
            <div className="absolute top-0 right-0 w-36 h-9 bg-[#231f20]" />

            <div className="flex items-center mt-6 pb-6 border-b-2 border-[#d1d1d1]">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={`${school.school_name} logo`}
                  className="w-[90px] h-[90px] rounded-full shrink-0 mr-6 object-cover border border-black/10"
                />
              ) : (
                <div className="w-[90px] h-[90px] rounded-full shrink-0 mr-6 flex flex-col items-center justify-center"
                  style={{ background: "linear-gradient(180deg,#d3eaf7 65%,#88a31e 65%)" }}>
                  <span className="text-2xl font-black leading-none tracking-tight">{initials(school.school_name)}</span>
                  <span className="text-[8px] font-bold tracking-widest mt-0.5">1919</span>
                </div>
              )}
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase">{school.school_name}</h1>
                <p className="text-sm font-semibold text-[#333]">{school.school_address}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-6 mt-8 mb-9">
              <div className="max-w-[50%]">
                <p className="text-xs font-extrabold uppercase tracking-wide mb-3">Invoice To :</p>
                <p className="text-xl font-extrabold mb-3">{inv.student_name}</p>
                <p className="text-xs text-[#444] leading-relaxed">
                  Class : {inv.class_name}
                  <br />
                  Academic Year : {inv.academic_year}
                  <br />
                  Period : {monthLabel(inv.month)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold uppercase tracking-wide mb-3">Total Due</p>
                <div className="flex items-center gap-2 justify-end">
                  <p className="text-2xl sm:text-3xl font-black">{cur(inv.payable)}</p>
                  <StatusPill tone={inv.status === "PAID" ? "success" : inv.status === "OVERDUE" ? "error" : inv.status === "PARTIAL" ? "warning" : "neutral"}>{inv.status}</StatusPill>
                </div>
                <p className="text-xs text-[#333] leading-relaxed mt-2">
                  No : #{inv.id}
                  <br />
                  Due Date : {inv.due_date}
                </p>
              </div>
            </div>

            <table className="w-full border-collapse mb-8">
              <thead>
                <tr>
                  <th className="bg-[#231f20] text-white text-left py-3 px-4 text-xs font-extrabold uppercase tracking-wide w-[45%]">Fee Item</th>
                  <th className="bg-[#231f20] text-white text-center py-3 px-4 text-xs font-extrabold uppercase tracking-wide w-[15%]">Qty.</th>
                  <th className="bg-[#231f20] text-white text-center py-3 px-4 text-xs font-extrabold uppercase tracking-wide w-[20%]">Price</th>
                  <th className="bg-[#231f20] text-white text-center py-3 px-4 text-xs font-extrabold uppercase tracking-wide w-[20%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.fee_items.map((f, i) => (
                  <tr key={i}>
                    <td className="border border-[#777] py-3 px-4 text-sm font-bold text-left">{f.name}</td>
                    <td className="border border-[#777] py-3 px-4 text-sm font-bold text-center">1</td>
                    <td className="border border-[#777] py-3 px-4 text-sm font-bold text-center">{cur(f.amount)}</td>
                    <td className="border border-[#777] py-3 px-4 text-sm font-bold text-center">{cur(f.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap justify-between items-start gap-6 mb-16">
              <div className="max-w-[50%]">
                <h3 className="text-sm font-extrabold mb-2">Payment Method :</h3>
                <p className="text-xs text-[#333] leading-relaxed">
                  Bank Name : {school.school_name}
                  <br />
                  Pay at the school office or via online transfer.
                  <br />
                  Kindly quote invoice <span className="font-semibold">#{inv.id}</span> when paying.
                </p>
              </div>
              <div className="w-full sm:w-[35%]">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1.5 px-2.5 text-right text-[#333]">Sub-total :</td>
                      <td className="py-1.5 px-2.5 text-right font-semibold">{cur(inv.total)}</td>
                    </tr>
                    {inv.discount > 0 && (
                      <tr>
                        <td className="py-1.5 px-2.5 text-right text-[#333]">Discount :</td>
                        <td className="py-1.5 px-2.5 text-right font-semibold">−{cur(inv.discount)}</td>
                      </tr>
                    )}
                    {inv.late_fee > 0 && (
                      <tr>
                        <td className="py-1.5 px-2.5 text-right text-[#333]">Late Fee :</td>
                        <td className="py-1.5 px-2.5 text-right font-semibold">+{cur(inv.late_fee)}</td>
                      </tr>
                    )}
                    <tr className={inv.discount > 0 || inv.late_fee > 0 ? "" : "invisible"}>
                      <td colSpan={2} className="py-0.5" />
                    </tr>
                    <tr className="border-2 border-[#231f20]">
                      <td className="py-2.5 px-2.5 text-sm font-extrabold text-right">Total :</td>
                      <td className="py-2.5 px-2.5 text-sm font-extrabold text-right">{cur(inv.payable)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="py-1.5 px-2.5 text-right text-[#333]">
                        Paid : <span className="font-semibold">{cur(inv.paid)}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-[220px] text-center">
                <div className="border-t-2 border-[#231f20] mb-2" />
                <p className="text-xs text-[#333]">Administrator</p>
              </div>
            </div>

            <div className="absolute -bottom-10 -left-10 w-48 h-24 bg-[#3d393d] -z-10" style={{ borderTopLeftRadius: 80, transform: "rotate(-10deg)" }} />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex justify-between print:hidden">
        <Link href="/dashboard/finance" className="text-sm text-primary hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">payments</span>
          All Invoices
        </Link>
      </div>
    </div>
  );
}