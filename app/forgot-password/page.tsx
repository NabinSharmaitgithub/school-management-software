"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await sendPasswordResetEmail(auth!, email);
      setSent(true);
    } catch {
      setError("Could not send reset link. Check the email and try again.");
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <div className="ambient-bg">
        <div className="ambient-blob blob-1" />
        <div className="ambient-blob blob-2" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="glass-panel p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/60 p-3 shadow-sm border border-white/80 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-4xl">lock_reset</span>
            </div>
            <h1 className="text-2xl font-semibold mb-2 tracking-tight">Forgot Password</h1>
            <p className="text-sm text-on-surface/70">
              {sent ? "Check your inbox for a reset link." : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {!sent ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-on-surface/80 mb-1.5 ml-1" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface/40 material-symbols-outlined text-xl">mail</span>
                  <input
                    id="email"
                    type="email"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-error bg-red-50/70 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button type="submit" className="glass-btn-primary w-full py-3 rounded-lg text-white font-semibold">
                Send Reset Link
              </button>
            </form>
          ) : (
            <button
              onClick={() => (window.location.href = "/")}
              className="glass-btn-primary w-full py-3 rounded-lg text-white font-semibold"
            >
              Continue to Login
            </button>
          )}

          <p className="text-center mt-6 text-xs text-on-surface/50">
            <a href="/" className="text-primary hover:text-tertiary transition-colors">← Back to login</a>
          </p>
        </div>
      </div>
    </main>
  );
}
