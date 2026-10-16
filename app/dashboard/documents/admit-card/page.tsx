"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getStudent,
  listClasses,
  listExamSessions,
  listExams,
  listSubjects,
  getSchoolSettings,
} from "@/lib/data";
import type { Student, Class, ExamSession, Exam, Subject, SchoolSettings } from "@/lib/data";
import { Card, Button, StatusPill, Alert } from "@/components/ui";

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

export default function AdmitCardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examId, setExamId] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Student id comes from the Documents hub via ?id=
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    (async () => {
      try {
        if (!id) throw new Error("No student selected. Pick a student from the Documents page.");
        const [s, c, se, e, sub, set] = await Promise.all([
          getStudent(id),
          listClasses(),
          listExamSessions(),
          listExams(),
          listSubjects(),
          getSchoolSettings(),
        ]);
        if (cancelled) return;
        setStudent(s);
        setClasses(c);
        setSessions(se);
        setExams(e);
        setSubjects(sub);
        setSettings(set);
        if (e.length) setExamId(e[0].id);
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

  // Sessions for the selected exam that include this student's class
  const visibleSessions = sessions.filter(
    (s) => s.exam_id === examId && s.class_ids.includes(student?.class_id ?? "")
  );

  const subjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name ?? id;

  const missingInfo = student
    ? [
        !student.name && "Student name",
        !student.roll_number && "Roll number",
        !student.class_id && "Class",
        !settings?.school_name && "School name",
      ].filter(Boolean)
    : [];

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading admit card…
      </Card>
    );
  }

  if (error || !student) {
    return <Alert message={error || "Student not found."} type="error" />;
  }

  const canGenerate = missingInfo.length === 0 && settings && classOf;

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
          <h1 className="text-xl font-semibold text-slate-900">Admit Card</h1>
          <p className="text-sm text-slate-500">
            Examination hall ticket for {student.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="hidden md:block"
          >
            <span className="material-symbols-outlined text-lg">print</span>
            Print
          </Button>
          <Button
            variant="primary"
            disabled={!canGenerate}
            onClick={() => {
              // Trigger print via browser
              window.print();
            }}
          >
            {canGenerate ? "Download PDF (Print)" : "Missing information"}
          </Button>
        </div>
      </header>

      {missingInfo.length > 0 && (
        <Alert
          message={`Cannot generate admit card: missing ${missingInfo.join(", ")}. Please complete the student record first.`}
          type="error"
        />
      )}

      {canGenerate && settings && classOf && (
        <div className="max-w-3xl mx-auto relative bg-white text-slate-900 shadow-lg rounded-lg overflow-hidden print:shadow-none">
          <style>{`
            @media print {
              body { background: #fff; }
              .no-print { display: none !important; }
              .admit-card { box-shadow: none; border: 2px solid #000; }
            }
          `}</style>

          <div className="admit-card no-print p-8 sm:p-12 bg-white border-2 border-slate-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={`${settings.school_name} logo`}
                    className="w-[80px] h-[80px] rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-[80px] h-[80px] rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-3xl">
                    {initials(settings.school_name)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
                    {settings.school_name}
                  </h1>
                  <p className="text-xs text-slate-500">{settings.school_address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Admit Card
                </div>
                <div className="text-xs text-slate-500">No: {student.roll_number}</div>
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
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <p className="text-xs font-bold text-teal-700 uppercase">Examination</p>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Exam:</span>
                    <span className="font-medium text-teal-700">
                      {exams.find((x) => x.id === examId)?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Session:</span>
                    <span className="font-medium text-teal-700">
                      {exams.find((x) => x.id === examId)?.academic_year || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {visibleSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Examination Schedule</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="py-3 px-4 text-left text-xs font-bold">Date</th>
                      <th className="py-3 px-4 text-left text-xs font-bold">Subject</th>
                      <th className="py-3 px-4 text-left text-xs font-bold">Time</th>
                      <th className="py-3 px-4 text-left text-xs font-bold">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSessions.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="py-3 px-4">{new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                        <td className="py-3 px-4">{subjectName(s.subject_id)}</td>
                        <td className="py-3 px-4">{s.start} – {s.end}</td>
                        <td className="py-3 px-4">{s.room || "—"}</td>
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
                <p className="text-xs text-slate-500 mt-1">Principal / Controller of Examinations</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Student Signature</p>
                <div className="h-1 w-24 border-t border-slate-900 mt-2"></div>
                <p className="text-xs text-slate-500 mt-1">Signature of the Candidate</p>
              </div>
            </div>

            <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest rotate-[-15deg]">
              VALID WITH SEAL
            </div>
          </div>

          <div className="no-print mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <span className="material-symbols-outlined text-lg">print</span>
              Print Admit Card
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
