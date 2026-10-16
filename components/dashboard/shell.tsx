"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isRestrictedFor, navItemsFor, NAV_ITEMS, type NavRole } from "@/components/dashboard/nav";
import { getUserByEmail } from "@/lib/data";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<NavRole>("Admin");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (user) => {
      if (!user) router.replace("/");
      setEmail(user?.email ?? null);
      if (user?.email) {
        getUserByEmail(user.email)
          .then((u) => setRole((u?.role as NavRole) ?? "Admin"))
          .catch(() => setRole("Admin"));
      }
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (email && isRestrictedFor(role, pathname)) router.replace("/dashboard");
  }, [role, email, pathname, router]);

  if (!ready) return null;

  const items = navItemsFor(role);
  const portalLabel =
    role === "Student"
      ? "Student Portal"
      : role === "Teacher"
        ? "Teacher Portal"
        : role === "Parent"
          ? "Parent Portal"
          : "Admin Portal";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 card m-3 p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-600">school</span>
          <span className="font-semibold text-sm text-on-surface">Academix</span>
        </div>
        <div className="flex items-center gap-2">
          <MobileNav pathname={pathname} items={items} />
          <LogoutButton onLogout={() => router.replace("/")} />
        </div>
      </div>

      {/* Notification bell - desktop only */}
      <div className="hidden md:block fixed top-6 right-6 z-40">
        <NotificationBell />
      </div>

      {/* Sidebar — deep teal */}
      <aside className="hidden md:flex w-64 shrink-0 m-4 flex-col sticky top-4 h-[calc(100vh-2rem)]">
        <div className="bg-primary rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <p className="font-semibold text-white leading-tight">Academix</p>
              <p className="text-xs text-teal-100">{portalLabel}</p>
            </div>
          </div>
        </div>
        <nav className="space-y-0.5 flex-1 overflow-y-auto">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-on-surface-v2 hover:bg-muted-bg hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-border pt-4">
          <LogoutButton onLogout={() => router.replace("/")} wide />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 md:pl-2 space-y-6 overflow-y-auto pt-20 md:pt-0">
        {children}
      </main>
    </div>
  );
}

function LogoutButton({ onLogout, wide }: { onLogout: () => void; wide?: boolean }) {
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await signOut(auth!);
        onLogout();
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg text-sm text-on-surface-v2 hover:bg-rose-50 hover:text-rose-700",
        wide ? "w-full justify-center py-2" : "w-9 h-9 justify-center"
      )}
    >
      <span className="material-symbols-outlined text-lg">logout</span>
      {wide && <span>Sign Out</span>}
    </Button>
  );
}

function MobileNav({ pathname, items }: { pathname: string; items: typeof NAV_ITEMS }) {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={navRef}>
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-v2 hover:bg-muted-bg"
        aria-label="Open navigation menu"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined">{open ? "close" : "menu"}</span>
      </Button>
      {open && (
        <nav className="absolute right-0 top-full mt-2 w-56 card p-2 z-50 space-y-0.5 shadow-lg">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  active ? "bg-teal-50 text-teal-700 font-semibold" : "text-on-surface-v2"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
