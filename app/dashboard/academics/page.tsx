"use client";

import { useEffect, useState } from "react";
import { listClasses, listSubjects, addClass, updateClass, deleteClass, addSubject, updateSubject, deleteSubject } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal } from "@/components/ui";

type Class = { id: string; name: string; section: string };
type Subject = { id: string; name: string; code?: string; description?: string };

export default function AcademicsPage() {
  const [tab, setTab] = useState<"classes" | "subjects">("classes");
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [c, s] = await Promise.all([listClasses(), listSubjects()]);
    setClasses(c);
    setSubjects(s);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Academics</h1>
          <p className="text-sm text-on-surface/60">Classes, sections and subjects</p>
        </div>
        <div className="flex gap-1 bg-white/40 border border-white/60 rounded-lg p-1">
          {(["classes", "subjects"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${
                tab === t
                  ? "bg-white/70 text-on-surface shadow-sm font-semibold"
                  : "text-on-surface/60 hover:text-on-surface"
              }`}
            >
              {t === "classes" ? "Classes & Sections" : "Subjects"}
            </button>
          ))}
        </div>
      </header>

      {tab === "classes" ? (
        <ClassesTable
          classes={classes}
          loading={loading}
          onChanged={load}
        />
      ) : (
        <SubjectsTable
          subjects={subjects}
          loading={loading}
          onChanged={load}
        />
      )}
    </div>
  );
}

function ClassesTable({
  classes,
  loading,
  onChanged,
}: {
  classes: Class[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", section: "" });
  const [editId, setEditId] = useState<string | null>(null);

  function open(entry?: Class) {
    setEditId(entry?.id ?? null);
    setForm({ name: entry?.name ?? "", section: entry?.section ?? "" });
    setError("");
    setModal(entry ? "edit" : "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.section.trim()) {
      setError("Name and section are required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateClass(editId, { name: form.name.trim(), section: form.section.trim() });
      } else {
        await addClass({ name: form.name.trim(), section: form.section.trim() });
      }
      setModal(null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm) return;
    await deleteClass(confirm);
    setConfirm(null);
    onChanged();
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-on-surface/60">{classes.length} classes</p>
        <GlassButton onClick={() => open()}>
          <span className="material-symbols-outlined text-lg">add</span>
          New Class
        </GlassButton>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : classes.length === 0 ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">No classes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                <th className="pb-3 pr-4">Class</th>
                <th className="pb-3 pr-4">Section</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-t border-on-surface/10 hover:bg-white/40">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4 text-on-surface/70">{c.section}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => open(c)} className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-primary">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => setConfirm(c.id)} className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit class" : "New class"}
      >
        <form className="space-y-4" onSubmit={save}>
          <Field label="Class name *">
            <Input
              placeholder="e.g. Grade 7"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Section *">
            <Input
              placeholder="e.g. A"
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
              required
            />
          </Field>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete class?">
        <p className="text-sm text-on-surface/70 mb-6">
          Students linked to this class will keep their class_id reference but show the raw id.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={del}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </GlassCard>
  );
}

function SubjectsTable({
  subjects,
  loading,
  onChanged,
}: {
  subjects: Subject[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  function open(entry?: Subject) {
    setEditId(entry?.id ?? null);
    setForm({
      name: entry?.name ?? "",
      code: entry?.code ?? "",
      description: entry?.description ?? "",
    });
    setError("");
    setModal(entry ? "edit" : "new");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Subject name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateSubject(editId, {
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
        });
      } else {
        await addSubject({
          name: form.name.trim(),
          code: form.code.trim(),
          description: form.description.trim(),
        });
      }
      setModal(null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm) return;
    await deleteSubject(confirm);
    setConfirm(null);
    onChanged();
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-on-surface/60">{subjects.length} subjects</p>
        <GlassButton onClick={() => open()}>
          <span className="material-symbols-outlined text-lg">add</span>
          New Subject
        </GlassButton>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">No subjects yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Description</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id} className="border-t border-on-surface/10 hover:bg-white/40">
                  <td className="py-3 pr-4 font-mono text-xs text-on-surface/70">{s.code || "—"}</td>
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3 pr-4 hidden md:table-cell text-on-surface/60">{s.description || "—"}</td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => open(s)} className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-primary">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => setConfirm(s.id)} className="glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/60 hover:text-rose">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "edit" ? "Edit subject" : "New subject"}
      >
        <form className="space-y-4" onSubmit={save}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name *">
              <Input
                placeholder="e.g. Mathematics"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Code">
              <Input
                placeholder="e.g. MAT-101"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="glass-input w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none"
              placeholder="Optional description…"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setModal(null)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete subject?">
        <p className="text-sm text-on-surface/70 mb-6">
          Marks referencing this subject will keep their subject_id but lose the name.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={del}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </GlassCard>
  );
}