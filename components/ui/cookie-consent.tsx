"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./index";

const COOKIE_CONSENT_KEY = "school_mgmt_cookie_consent";

export function CookieConsentBanner() {
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    setShow(stored ? null : true);
  }, []);

  const accept = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setShow(false);
  };

  const decline = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(COOKIE_CONSENT_KEY, "false");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-md border-t border-border/50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">Use of cookies</h3>
            <p className="text-xs text-slate-400">
              We use essential cookies to keep you signed in and to protect against CSRF
              attacks. For details, see our{" "}
              <Link
                href="/cookie-policy"
                className="text-teal-400 hover:underline text-sm"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={decline} className="text-sm text-slate-300 hover:bg-slate-800 border-slate-700">
              Decline
            </Button>
            <Button onClick={accept} className="text-sm">
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}