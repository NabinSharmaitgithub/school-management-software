"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserByEmail, getStudent } from "@/lib/data";
import type { UserRecord, Student } from "@/lib/data";
import { useTeacherScope } from "@/components/dashboard/teacher-scope";
import { Field, GlassButton, GlassCard, Input } from "@/components/ui";

export default function MyAccountPage() {
  const scope = useTeacherScope();
  const router = useRouter();
  const [user, setUser] = useState<UserRecord | null>(null);
  const [linked, setLinked] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scope.ready || !scope.email) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const u = await getUserByEmail(scope.email!);
        if (cancelled) return;
        setUser(u);
        if (u?.student_id) {
          const st = await getStudent(u.student_id);
          if (!cancelled) setLinked(st);
        }
      } catch {
        // profile read is optional for this page
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [scope.ready, scope.email]);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!current || !next || !confirm) {
      setError("All three password fields are required.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (next.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    const cu = auth!.currentUser;
    if (!cu) { setError("You are signed out. Please log in again."); return; }
    setSaving(true);
    try {
      // Firebase requires a recent login for password changes — reauthenticate first.
      await reauthenticateWithCredential(cu, EmailAuthProvider.credential(cu.email!, current));
      await updatePassword(cu, next);
      setMessage("Password updated.");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code.includes("wrong-password")) setError("Current password is incorrect.");
      else if (code.includes("weak-password")) setError("Password must be at least 6 characters long.");
      else setError("Could not update the password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    await signOut(auth!);
    router.replace("/");
  }

  if (loading || !scope.ready) {
    return <GlassCard className="p-8 text-center text-sm text-on-surface/60">Loading account…</GlassCard>;
  }

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">My Account</h1>
          <p className="text-sm text-on-surface/60">Your profile and sign-in settings</p>
        </div>
        {scope.isAdmin && (
          <Link href="/dashboard/settings" className="glass-btn-ghost inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
            <span className="material-symbols-outlined text-lg">settings</span>
            Admin Settings
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-4 space-y-4">
          <h2 className="font-semibold text-sm">Profile</h2>
          <Field label="Email">
            <Input value={user?.email ?? scope.email ?? ""} readOnly />
          </Field>
          <Field label="Role">
            <Input value={user?.role ?? ""} readOnly />
          </Field>
          <Field label="Linked student record">
            {linked ? (
              <Link href={`/dashboard/students/${linked.id}`} className="text-sm text-primary hover:underline">
                {linked.name}
              </Link>
            ) : (
              <p className="text-sm text-on-surface/50">{user ? "None" : "—"}</p>
            )}
          </Field>
          <div>
            <GlassButton variant="ghost" onClick={onSignOut}>
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign out
            </GlassButton>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="font-semibold text-sm mb-4">Change password</h2>
          <form className="space-y-4" onSubmit={onChangePassword}>
            <Field label="Current password *">
              <Input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="New password *">
              <Input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </Field>
            <Field label="Confirm new password *">
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </Field>
            {error && (
              <p className="text-xs text-rose bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">{message}</p>
            )}
            <div className="flex justify-end pt-1">
              <GlassButton type="submit" disabled={saving}>
                {saving ? "Updating…" : "Update password"}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
