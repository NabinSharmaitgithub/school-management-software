"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getStudent,
  listClasses,
  listInvoicesHydrated,
  getSchoolSettings,
} from "@/lib/data";
import type { Student, Class, FeeInvoice, SchoolSettings } from "@/lib/data";
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

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TCPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Student id comes from the Documents hub via ?id=
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      try {
        if (!id) throw new Error("No student selected. Pick a student from the Documents page.");
        const [s, c, invs, set] = await Promise.all([
          getStudent(id),
          listClasses(),
          listInvoicesHydrated(),
          getSchoolSettings(),
        ]);
        if (cancelled) return;
        setStudent(s);
        setClasses(c);
        const studentInvoices = invs.filter((i) => i.student_id === id);
        setInvoices(studentInvoices);
        setSettings(set);
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

  // Check fee clearance: any pending/overdue invoices?
  const hasDues = invoices.some(
    (i) => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIAL"
  );

  const pendingAmount = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIAL")
    .reduce((s, i) => s + (i.payable - i.paid), 0);

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading transfer certificate…
      </Card>
    );
  }

  if (error || !student) {
    return <Alert message={error || "Student not found."} type="error" />;
  }

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
          <h1 className="text-xl font-semibold text-slate-900">Transfer Certificate</h1>
          <p className="text-sm text-slate-500">
            Official TC for {student.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => window.print()} className="hidden md:block">
            <span className="material-symbols-outlined text-lg">print</span>
            Print
          </Button>
          <Button
            variant={hasDues ? "ghost" : "primary"}
            disabled={hasDues}
            onClick={() => window.print()}
          >
            {hasDues ? "Clear Dues First" : "Print TC"}
          </Button>
        </div>
      </header>

      {hasDues && (
        <Alert
          message={`Cannot issue TC: outstanding fees of ${pendingAmount.toLocaleString("en-IN")} must be cleared first.`}
          type="error"
        />
      )}

      <div className="max-w-3xl mx-auto relative bg-white text-slate-900 shadow-lg rounded-lg overflow-hidden print:shadow-none">
        <style>{`
          @media print {
            body { background: #fff; }
            .no-print { display: none !important; }
            .tc-doc { box-shadow: none; border: 2px solid #000; }
          }
        `}</style>

        <div className="tc-doc no-print p-8 sm:p-12 bg-white border-2 border-slate-900">
          <div className="flex items-center justify-between mb-8">
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
                  Transfer Certificate
                </div>
                <div className="text-xs text-slate-500">TC No: {student.roll_number}</div>
                <div className="text-xs text-slate-500">Date: {formatDate(new Date().toISOString().slice(0, 10))}</div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg text-slate-800 leading-relaxed">
              This is to certify that <span className="font-bold">{student.name}</span>, son/daughter of{" "}
              <span className="font-bold">{student.guardian || student.father_name || "—"}</span>, bearing
              Admission No. <span className="font-bold">{student.admission_number || student.roll_number}</span> and
              Roll No. <span className="font-bold">{student.roll_number}</span>, was a bonafide student of this school
              studying in <span className="font-bold">{className}</span>.
            </p>
            <p className="text-lg text-slate-800 leading-relaxed mt-4">
              The student&rsquo;s date of birth as per school records is{" "}
              <span className="font-bold">{student.dob || "—"}</span>. The student has completed the academic year and
              is hereby issued this Transfer Certificate for the purpose of seeking admission elsewhere.
            </p>
            <p className="text-lg text-slate-800 leading-relaxed mt-4">
              The student&rsquo;s conduct and character during the period of stay in this school has been
              <span className="font-bold text-emerald-600">satisfactory</span>.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Fee Clearance</h3>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total dues cleared:</span>
                <span className="font-medium">{hasDues ? "No" : "Yes"}</span>
              </div>
              {hasDues ? (
                <div className="flex justify-between text-sm text-rose-600 mt-1">
                  <span>Outstanding amount:</span>
                  <span className="font-bold">{pendingAmount.toLocaleString("en-IN")}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm text-emerald-600 mt-1">
                  <span>Outstanding amount:</span>
                  <span className="font-bold">0</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500">Principal</p>
              <div className="h-1 w-32 border-t border-slate-900 mt-2"></div>
              <p className="text-xs text-slate-500 mt-1">{settings?.school_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Date of Issue</p>
              <div className="h-1 w-32 border-t border-slate-900 mt-2"></div>
              <p className="text-xs text-slate-500 mt-1">{formatDate(new Date().toISOString().slice(0, 10))}</p>
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
          {!hasDues && (
            <Button variant="primary" onClick={() => window.print()}>
              <span className="material-symbols-outlined text-lg">print</span>
              Print Transfer Certificate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
