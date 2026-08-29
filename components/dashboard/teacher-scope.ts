"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listSubjects, teacherRoles } from "@/lib/data";
import type { TeacherRoles } from "@/lib/data";

export type TeacherScope = TeacherRoles & {
  email: string | null;
  isAdmin: boolean;
  ready: boolean;
};

const EMPTY: TeacherRoles = { classIds: [], subjectByClass: {} };

/** Signed-in user's email; null once auth state is known. */
export function useAuthEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (u) => setEmail(u?.email ?? null));
    return () => unsub();
  }, []);
  return email;
}

/**
 * Resolved access for the signed-in user.
 * - Admin (admin@school.local): isAdmin = true, unrestricted.
 * - Everyone else: classIds (classes they manage as class teacher) and
 *   subjectByClass (subject teaching scope). Wait for `ready` before rendering.
 */
export function useTeacherScope(): TeacherScope {
  const email = useAuthEmail();
  const [scope, setScope] = useState<TeacherScope>({
    ...EMPTY,
    email: null,
    isAdmin: false,
    ready: false,
  });

  useEffect(() => {
    if (email === null) {
      setScope((s) => ({ ...s, email: null, ready: true }));
      return;
    }
    if (email === "admin@school.local") {
      setScope((s) => ({ ...s, email, isAdmin: true, ready: true, ...EMPTY }));
      return;
    }
    listSubjects()
      .then((subs) => teacherRoles(email, subs))
      .then((roles) =>
        setScope({ ...roles, email, isAdmin: false, ready: true })
      )
      .catch(() => setScope((s) => ({ ...s, email, isAdmin: false, ready: true, ...EMPTY })));
  }, [email]);

  return scope;
}