"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  addStudent,
  listClasses,
  admissionNumberExists,
  uploadStudentPhoto,
} from "@/lib/data";
import { Field, Button, Card, Input, PhotoUpload, Select, Alert } from "@/components/ui";

export default function NewStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof listClasses>>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dupCheck, setDupCheck] = useState<{ checking: boolean; exists: boolean }>({
    checking: false,
    exists: false,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    admission_number: "",
    class_id: "",
    gender: "",
    email: "",
    phone: "",
    guardian: "",
    father_name: "",
    mother_name: "",
    dob: "",
    address: "",
    photo_url: "",
  });

  useEffect(() => {
    listClasses().then(setClasses).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function checkAdmissionNumber() {
    const val = form.admission_number.trim();
    if (!val) {
      setDupCheck({ checking: false, exists: false });
      return;
    }
    setDupCheck({ checking: true, exists: false });
    try {
      const exists = await admissionNumberExists(val);
      setDupCheck({ checking: false, exists });
    } catch {
      setDupCheck({ checking: false, exists: false });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.class_id) {
      setError("Name and class are required.");
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }
    if (form.admission_number.trim()) {
      const exists = await admissionNumberExists(form.admission_number.trim());
      if (exists) {
        setError("A student with this admission number already exists.");
        return;
      }
    }
    setSaving(true);
    try {
      const id = await addStudent({
        name: form.name.trim(),
        roll_number: form.roll_number.trim(),
        admission_number: form.admission_number.trim() || undefined,
        class_id: form.class_id,
        gender: form.gender,
        email: form.email.trim(),
        phone: form.phone.trim(),
        guardian: form.guardian.trim(),
        father_name: form.father_name.trim(),
        mother_name: form.mother_name.trim(),
        dob: form.dob,
        address: form.address.trim(),
        photo_url: form.photo_url,
        archived: false,
      });
      router.push(`/dashboard/students/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="card p-4 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/students"
            className="text-xs text-teal-600 flex items-center gap-1 mb-1 hover:text-teal-700"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Students
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">Add Student</h1>
        </div>
      </header>

      <Card className="p-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name *">
              <Input
                placeholder="e.g. Alex Johnson"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="Roll number">
              <Input
                placeholder="e.g. S-1024"
                value={form.roll_number}
                onChange={(e) => set("roll_number", e.target.value)}
              />
            </Field>
            <Field label="Admission number">
              <Input
                placeholder="e.g. A-1024 (optional)"
                value={form.admission_number}
                onChange={(e) => {
                  set("admission_number", e.target.value);
                  void checkAdmissionNumber();
                }}
              />
              {dupCheck.checking && (
                <p className="text-xs text-slate-500">Checking availability…</p>
              )}
              {dupCheck.exists && (
                <p className="text-xs text-rose-600">Admission number already exists.</p>
              )}
            </Field>
            <Field label="Class *">
              <Select
                value={form.class_id}
                onChange={(e) => set("class_id", e.target.value)}
                required
              >
                <option value="">Select class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </Select>
            </Field>
            <Field label="Guardian / Parent">
              <Input
                placeholder="Parent or guardian name"
                value={form.guardian}
                onChange={(e) => set("guardian", e.target.value)}
              />
            </Field>
            <Field label="Date of Birth">
              <Input
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </Field>
            <Field label="Father's Name">
              <Input
                placeholder="Father's full name"
                value={form.father_name}
                onChange={(e) => set("father_name", e.target.value)}
              />
            </Field>
            <Field label="Mother's Name">
              <Input
                placeholder="Mother's full name"
                value={form.mother_name}
                onChange={(e) => set("mother_name", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                placeholder="e.g. 98XXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <Input
                type="email"
                placeholder="student@school.edu"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Input
                placeholder="Home address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="Photo" className="sm:col-span-2">
              <PhotoUpload
                value={form.photo_url}
                onFile={async (file) => {
                  const url = await uploadStudentPhoto(file);
                  set("photo_url", url);
                  return url;
                }}
                alt="Student photo"
              />
            </Field>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="accent-teal-600 w-4 h-4 mt-0.5 focus:ring-2 focus:ring-teal-600 focus:ring-offset-1 focus:ring-offset-slate-50"
            />
            <label
              htmlFor="terms"
              className="text-xs text-slate-600 leading-tight cursor-pointer"
            >
              I have read and agree to the{" "}
              <Link
                href="/terms-of-service"
                className="text-teal-600 hover:underline font-medium"
              >
                Terms of Service
              </Link>
              {" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="text-teal-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/students">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || dupCheck.exists}>
              {saving ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              Save Student
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
