"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getStudent, classNames, updateStudent, deleteStudent, listClasses } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select } from "@/components/ui";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Awaited<ReturnType<typeof getStudent>> | null>(null);
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof listClasses>>>([]);
  const [className, setClassName] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
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
    (async () => {
      const [s, c, names] = await Promise.all([getStudent(id!), listClasses(), classNames()]);
      if (s) {
        setStudent(s);
        setForm({
          name: s.name ?? "",
          roll_number: s.roll_number ?? "",
          class_id: s.class_id ?? "",
          gender: s.gender ?? "",
          email: s.email ?? "",
          phone: s.phone ?? "",
          guardian: s.guardian ?? "",
          address: s.address ?? "",
        });
        setClassName(names[s.class_id] ?? s.class_id);
      }
      setClasses(c);
    })();
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateStudent(id!, form);
      setStudent((s) => (s ? { ...s, ...form } : s));
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    await deleteStudent(id!);
    router.push("/dashboard/students");
  }

  if (!student) {
    return (
      <GlassCard className="p-8 text-center text-sm text-on-surface/60">
        Loading student…
      </GlassCard>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/students"
            className="text-xs text-primary flex items-center gap-1 mb-1 hover:text-tertiary"
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            Students
          </Link>
          <h1 className="text-xl font-semibold">{student.name}</h1>
          <p className="text-sm text-on-surface/60">
            {student.roll_number} · {className}
          </p>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <GlassButton variant="ghost" onClick={() => setEditing(true)}>
              <span className="material-symbols-outlined text-lg">edit</span>
              Edit
            </GlassButton>
          )}
          <GlassButton variant="danger" onClick={() => setConfirm(true)}>
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </header>

      {editing ? (
        <GlassCard className="p-6">
          <form className="space-y-5" onSubmit={onSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name *">
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </Field>
              <Field label="Roll number">
                <Input
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
                <Input value={form.guardian} onChange={(e) => set("guardian", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </Field>
            </div>

            {error && (
              <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <GlassButton type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </GlassButton>
              <GlassButton type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4 text-sm text-on-surface/60 uppercase tracking-wide">
              Personal
            </h2>
            <InfoRow label="Full name" value={student.name} />
            <InfoRow label="Gender" value={student.gender || "—"} />
            <InfoRow label="Address" value={student.address || "—"} />
          </GlassCard>
          <GlassCard className="p-6">
            <h2 className="font-semibold mb-4 text-sm text-on-surface/60 uppercase tracking-wide">
              Contact
            </h2>
            <InfoRow label="Guardian" value={student.guardian || "—"} />
            <InfoRow label="Phone" value={student.phone || "—"} />
            <InfoRow label="Email" value={student.email || "—"} />
          </GlassCard>
        </div>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Delete student?">
        <p className="text-sm text-on-surface/70 mb-6">
          Permanently remove <strong>{student.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(false)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-on-surface/10 last:border-0">
      <span className="text-sm text-on-surface/60">{label}</span>
      <span className="text-sm font-medium text-on-surface text-right">{value}</span>
    </div>
  );
}