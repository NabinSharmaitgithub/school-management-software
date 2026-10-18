"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserByEmail, listClasses, listSubjects, teacherRoles } from "@/lib/data";
import type { TeacherRoles, UserRole } from "@/lib/data";

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
 * - Users with role "Admin" (stored in users/{email}): isAdmin = true, unrestricted.
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
    // Resolve role from Firestore users/{email} record (set at login via ensureUser).
    getUserByEmail(email)
      .then((u) => {
        const role = (u?.role as UserRole) ?? null;
        if (role === "Admin") {
          setScope((s) => ({ ...s, email, isAdmin: true, ready: true, ...EMPTY }));
          return;
        }
        return Promise.all([listClasses(), listSubjects()]).then(([cls, subs]) =>
          teacherRoles(email, subs, cls)
        );
      })
      .then((roles) => {
        // Only reached for non-admin users: apply class/subject scope.
        if (roles) {
          setScope((s) => ({ ...roles, email, isAdmin: false, ready: true }));
        }
      })
      .catch(() =>
        setScope((s) => ({ ...s, email, isAdmin: false, ready: true, ...EMPTY }))
      );
  }, [email]);

  return scope;
}