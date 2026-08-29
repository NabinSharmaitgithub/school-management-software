"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isRestrictedFor, navItemsFor, NAV_ITEMS } from "@/components/dashboard/nav";
import { NotificationBell } from "@/components/dashboard/notification-bell";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, (user) => {
      if (!user) router.replace("/");
      setEmail(user?.email ?? null);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (email && isRestrictedFor(email, pathname)) router.replace("/dashboard");
  }, [email, pathname, router]);

  if (!ready) return null;

  const items = navItemsFor(email);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 glass-panel m-3 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">school</span>
          <span className="font-semibold text-sm">Academix</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <MobileNav pathname={pathname} items={items} />
          <LogoutButton onLogout={() => router.replace("/")} />
        </div>
      </div>

      {/* Desktop notification bell */}
      <div className="hidden md:block fixed top-6 right-6 z-40">
        <NotificationBell />
      </div>

      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 m-4 glass-panel p-4 flex-col sticky top-4 h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-white/60 border border-white/80 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <p className="font-semibold text-on-surface leading-tight">Academix</p>
            <p className="text-xs text-on-surface/50">Admin Portal</p>
          </div>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-on-surface/70 hover:bg-white/60 hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-on-surface/10 pt-4 mt-4">
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
    <button
      onClick={async () => {
        await signOut(auth!);
        onLogout();
      }}
      className={`glass-btn-ghost flex items-center gap-2 rounded-lg text-sm text-on-surface/70 hover:text-rose ${
        wide ? "w-full justify-center py-2" : "w-9 h-9 justify-center"
      }`}
    >
      <span className="material-symbols-outlined text-lg">logout</span>
      {wide && <span>Sign Out</span>}
    </button>
  );
}

function MobileNav({ pathname, items }: { pathname: string; items: typeof NAV_ITEMS }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-btn-ghost w-9 h-9 rounded-lg flex items-center justify-center text-on-surface/70"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <nav className="absolute right-0 top-full mt-2 w-56 glass-panel p-2 z-50 space-y-1">
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
                    active ? "bg-primary/15 text-primary font-semibold" : "text-on-surface/80"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
