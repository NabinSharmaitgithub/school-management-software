"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addStudent, listClasses } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Select } from "@/components/ui";

export default function NewStudentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof listClasses>>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    class_id: "",
    gender: "",
    email: "",
    phone: "",
    guardian: "",
    address: "",
  });

  useEffect(() => {
    listClasses().then(setClasses).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.class_id) {
      setError("Name and class are required.");
      return;
    }
    setSaving(true);
    try {
      const id = await addStudent({
        name: form.name.trim(),
        roll_number: form.roll_number.trim(),
        class_id: form.class_id,
        gender: form.gender,
        email: form.email.trim(),
        phone: form.phone.trim(),
        guardian: form.guardian.trim(),
        address: form.address.trim(),
      });
      router.push(`/dashboard/students/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header className="glass-panel p-4 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/students"
            className="text-xs text-primary flex items-center gap-1 mb-1 hover:text-tertiary"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Students
          </Link>
          <h1 className="text-xl font-semibold">Add Student</h1>
        </div>
      </header>

      <GlassCard className="p-6">
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
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/students">
              <GlassButton type="button" variant="ghost">
                Cancel
              </GlassButton>
            </Link>
            <GlassButton type="submit" disabled={saving}>
              {saving ? (
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              Save Student
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}