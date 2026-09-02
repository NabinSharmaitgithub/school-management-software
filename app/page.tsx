"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { GlassButton, Input, Field, Alert } from "@/components/ui";

const ROLES = ["Admin", "Teacher", "Student", "Parent"] as const;

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C37.1 40.6 44 35 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 23 23" aria-hidden>
      <path fill="#F35325" d="M1 1h10v10H1z"/>
      <path fill="#81BC06" d="M12 1h10v10H12z"/>
      <path fill="#05A6F0" d="M1 12h10v10H1z"/>
      <path fill="#FFBA08" d="M12 12h10v10H12z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<(typeof ROLES)[number]>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      if (!auth) {
        setError("Authentication service unavailable. Please try again.");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
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

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <div className="ambient-bg">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
        <div className="ambient-blob blob-3" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/60 p-3 shadow-sm border border-white/80 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">school</span>
            </div>
            <h1 className="text-2xl font-semibold text-on-surface mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-on-surface/70">Sign in to Academix Portal</p>
          </div>

          <div className="flex p-1 bg-white/40 rounded-full mb-8 border border-white/60" role="radiogroup" aria-label="Select role">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                role="radio"
                aria-checked={role === r}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs transition-all ${
                  role === r
                    ? "bg-primary text-white font-semibold shadow-md"
                    : "font-medium text-on-surface/80 hover:bg-white/80"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Email or Username">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface/40 material-symbols-outlined text-xl">person</span>
                <Input
                  id="email"
                  type="text"
                  className="pl-11"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-describedby={error ? "email-error" : undefined}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface/40 material-symbols-outlined text-xl">lock</span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-11 pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-describedby={error ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface/40 hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="w-4 h-4 rounded border border-on-surface/30 bg-white/50 peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[12px] text-white opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                </span>
                <span className="text-xs text-on-surface/70">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-xs font-medium text-primary hover:text-tertiary transition-colors underline-offset-2 hover:underline">
                Forgot password?
              </a>
            </div>

            {error && <Alert message={error} type="error" />}

            <GlassButton
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-semibold text-base mt-6 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
            </GlassButton>
          </form>

          <div className="relative my-8 flex items-center">
            <div className="flex-grow border-t border-on-surface/10" />
            <span className="flex-shrink-0 mx-4 text-xs text-on-surface/50">or continue with</span>
            <div className="flex-grow border-t border-on-surface/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="glass-btn-ghost py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-on-surface/80"
            >
              <GoogleIcon /> Google
            </button>
            <button
              type="button"
              className="glass-btn-ghost py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-xs font-medium text-on-surface/80"
            >
              <MicrosoftIcon /> Microsoft
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-on-surface/50">
          Academix High © 2026 •{" "}
          <a href="#" className="text-primary/80 hover:text-primary transition-colors underline-offset-2 hover:underline">Support</a>
        </p>
      </div>
    </main>
  );
}
