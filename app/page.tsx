"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  GraduationCap,
  BookOpen,
  Users,
  CalendarDays,
  ClipboardList,
  Library,
  Bus,
  Wallet,
  BarChart3,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { ensureUser } from "@/lib/data";
import {
  Ripple,
  TechOrbitDisplay,
  AnimatedForm,
} from "@/components/ui/modern-animated-sign-in";

const ROLES = ["Admin", "Teacher", "Student", "Parent"] as const;

// Orbiting module icons (lucide = local SVGs, no remote image loading)
const iconsArray = [
  { component: () => <GraduationCap className="text-primary size-8" />, className: "border-none bg-transparent", duration: 20, delay: 20, radius: 100, path: false, reverse: false },
  { component: () => <BookOpen className="text-primary size-8" />, className: "border-none bg-transparent", duration: 20, delay: 10, radius: 100, path: false, reverse: false },
  { component: () => <Wallet className="text-tertiary size-8" />, className: "border-none bg-transparent", duration: 20, delay: 20, radius: 100, path: false, reverse: false },
  { component: () => <ClipboardList className="text-primary size-7" />, className: "border-none bg-transparent", duration: 20, delay: 0, radius: 210, path: false, reverse: false },
  { component: () => <CalendarDays className="text-tertiary size-7" />, className: "border-none bg-transparent", duration: 20, delay: 20, radius: 210, path: false, reverse: false },
  { component: () => <Users className="text-primary size-7" />, className: "border-none bg-transparent", duration: 20, delay: 10, radius: 210, path: false, reverse: false },
  { component: () => <Library className="text-tertiary size-8" />, className: "border-none bg-transparent", duration: 20, delay: 10, radius: 150, path: false, reverse: true },
  { component: () => <Bus className="text-primary size-8" />, className: "border-none bg-transparent", duration: 20, delay: 0, radius: 150, path: false, reverse: true },
  { component: () => <BarChart3 className="text-primary size-6" />, className: "border-none bg-transparent", duration: 20, delay: 0, radius: 270, path: false, reverse: true },
];

export default function LoginPage() {
  const router = useRouter();
  // Role chip only matters for first-time sign-ins (writes users/{email});
  // default to Student so nobody self-promotes to Admin by default.
  const [role, setRole] = useState<(typeof ROLES)[number]>("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!auth) {
        setError("Authentication service unavailable. Please try again.");
        return;
      }
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await ensureUser(email.trim(), role);
      router.push("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential")
        setError("Invalid email or password.");
      else if (code === "auth/invalid-email")
        setError("Please enter a valid email address.");
      else if (code === "auth/user-disabled")
        setError("This account has been disabled.");
      else if (code === "auth/too-many-requests")
        setError("Too many failed attempts. Please try again later.");
      else setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Role chips + remember-me rendered inside the animated form
  const extraEl = (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">
          I am signing in as <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={role === r}
              className={
                role === r
                  ? "h-10 rounded-md text-sm font-medium border bg-primary text-white border-primary hover:bg-primary-hover transition-colors"
                  : "h-10 rounded-md text-sm font-medium border bg-white text-slate-600 border-slate-200 hover:border-teal-600 hover:text-teal-700 transition-colors"
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded border border-slate-300 accent-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600"
        />
        <span className="text-sm text-slate-600">Keep me signed in</span>
      </label>
    </div>
  );

  return (
    <main className="relative min-h-screen flex bg-background">
      {/* Left: orbiting modules + ripple (desktop only) */}
      <span className="relative hidden lg:flex flex-col justify-center w-1/2 overflow-hidden">
        <Ripple mainCircleSize={100} className="bg-muted-bg" />
        <TechOrbitDisplay iconsArray={iconsArray} text="Academix" />
        <p className="absolute bottom-10 inset-x-0 text-center text-sm text-slate-500">
          School Management System
        </p>
      </span>

      {/* Right: sign-in form */}
      <span className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-center items-center px-5 py-10 sm:px-[8%]">
        <AnimatedForm
          header="Welcome back"
          subHeader="Sign in to your school account"
          fields={[
            {
              label: "Email",
              required: true,
              type: "email",
              placeholder: "you@school.edu",
              autoComplete: "email",
              onChange: (e) => setEmail(e.target.value),
            },
            {
              label: "Password",
              required: true,
              type: "password",
              placeholder: "Enter your password",
              autoComplete: "current-password",
              onChange: (e) => setPassword(e.target.value),
            },
          ]}
          extra={extraEl}
          submitButton={loading ? "Signing in…" : "Sign in"}
          submitDisabled={loading}
          errorField={error || undefined}
          textVariantButton="Forgot password?"
          goTo={() => router.push("/forgot-password")}
          onSubmit={handleSubmit}
        />
      </span>
    </main>
  );
}
