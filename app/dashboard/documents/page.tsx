"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listStudents, listClasses, getSchoolSettings } from "@/lib/data";
import type { Student, Class, SchoolSettings } from "@/lib/data";
import { Card, Button, Select, StatusPill, Alert, EmptyState } from "@/components/ui";

export default function DocumentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c, set] = await Promise.all([
          listStudents(),
          listClasses(),
          getSchoolSettings(),
        ]);
        if (cancelled) return;
        setStudents(s);
        setClasses(c);
        setSettings(set);
        setError("");
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const student = students.find((s) => s.id === selectedStudent);
  const classOf = classes.find((c) => c.id === student?.class_id);
  const canGenerate = Boolean(student && !student.archived && settings);

  const documentTypes = [
    {
      key: "id-card",
      label: "Student ID Card",
      icon: "badge",
      description: "Official student identity card with photo and details.",
      href: (sid: string) => `/dashboard/id-cards`,
    },
    {
      key: "report-card",
      label: "Report Card",
      icon: "description",
      description: "Academic results summary with grades and GPA.",
      href: (sid: string) => `/dashboard/report-cards`,
    },
    {
      key: "admit-card",
      label: "Admit Card",
      icon: "insert_drive_file",
      description: "Examination hall ticket with schedule and venue.",
      href: (sid: string) => `/dashboard/documents/admit-card?id=${sid}`,
    },
    {
      key: "fee-slip",
      label: "Fee Slip",
      icon: "receipt",
      description: "Fee payment receipt and outstanding dues statement.",
      href: (sid: string) => `/dashboard/documents/fee-slip?id=${sid}`,
    },
    {
      key: "tc",
      label: "Transfer Certificate",
      icon: "logout",
      description: "Official transfer certificate for leaving students.",
      href: (sid: string) => `/dashboard/documents/tc?id=${sid}`,
    },
    {
      key: "character",
      label: "Character Certificate",
      icon: "emoji_events",
      description: "Character and conduct certificate.",
      href: (sid: string) => `/dashboard/documents/character?id=${sid}`,
    },
  ];

  if (loading) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        Loading documents…
      </Card>
    );
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon="person_off"
        title="No students"
        description="Add students first to generate documents."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Documents & Certificates</h1>
          <p className="text-sm text-slate-500">
            Generate official documents using real student and school records.
          </p>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Select Student *</label>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select a student…</option>
              {students
                .filter((s) => !s.archived)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll_number}) · {classOf?.name ?? ""}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="primary"
              disabled={!canGenerate}
              onClick={() => {}}
              className="w-full"
            >
              Generate Selected
            </Button>
          </div>
        </div>
      </Card>

      {student && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documentTypes.map((doc) => {
            const disabled = !canGenerate;
            return (
              <Card key={doc.key} className="p-4 hover:bg-slate-50 transition-colors border border-e2e8f0 cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <span className="material-symbols-outlined text-lg">{doc.icon}</span>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">
                    {disabled ? "Select student" : "Available"}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900">{doc.label}</h3>
                <p className="text-xs text-slate-500 mb-3">{doc.description}</p>
                <Button
                  variant={disabled ? "ghost" : "primary"}
                  disabled={disabled}
                  onClick={disabled ? undefined : () => {}}
                  className="w-full text-sm"
                >
                  {disabled ? "Select student first" : "Generate"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {!student && selectedStudent && (
        <Alert message="Selected student is archived or not found." type="error" />
      )}
    </div>
  );
}
