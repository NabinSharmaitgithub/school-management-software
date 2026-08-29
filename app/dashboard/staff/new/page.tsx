"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addStaff } from "@/lib/data";
import { useAuthEmail } from "@/components/dashboard/teacher-scope";
import { Field, GlassButton, GlassCard, Input, Select } from "@/components/ui";

export default function NewStaffPage() {
  const router = useRouter();
  const email = useAuthEmail();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    joined: "",
    status: "active" as "active" | "on_leave" | "inactive",
  });

  useEffect(() => {
    if (email === "teacher@school.local") router.replace("/dashboard/staff");
  }, [email, router]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.role.trim()) {
      setError("Name and role are required.");
      return;
    }
    setSaving(true);
    try {
      const id = await addStaff({
        name: form.name.trim(),
        role: form.role.trim(),
        department: form.department.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        joined: form.joined,
        status: form.status,
      });
      router.push(`/dashboard/staff/${id}`);
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
            href="/dashboard/staff"
            className="text-xs text-primary flex items-center gap-1 mb-1 hover:text-tertiary"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Staff
          </Link>
          <h1 className="text-xl font-semibold">Add Staff Member</h1>
        </div>
      </header>

      <GlassCard className="p-6">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name *">
              <Input
                placeholder="e.g. Maya Gurung"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="Role / Designation *">
              <Input
                placeholder="e.g. Teacher, Administrator"
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                required
              />
            </Field>
            <Field label="Department">
              <Input
                placeholder="e.g. Mathematics"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
              />
            </Field>
            <Field label="Date joined">
              <Input
                type="date"
                value={form.joined}
                onChange={(e) => set("joined", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                placeholder="e.g. 98XXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                placeholder="staff@school.edu"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/staff">
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
              Save Member
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}