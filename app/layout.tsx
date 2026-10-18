import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CookieConsentBanner } from "@/components/ui/cookie-consent";

export const metadata: Metadata = {
  title: "Academix Portal",
  description: "School Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen text-on-surface bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-600 focus:text-white focus:rounded focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
        <footer className="border-t border-border bg-slate-50 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-slate-500">
                Google Academy Birgunj &middot; 123 Education Boulevard, Knowledge City
              </div>
              <div className="flex gap-6 text-sm text-slate-500">
                <Link
                  href="/privacy-policy"
                  className="hover:text-teal-600 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-of-service"
                  className="hover:text-teal-600 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/refund-policy"
                  className="hover:text-teal-600 transition-colors"
                >
                  Refund Policy
                </Link>
                <Link
                  href="/cookie-policy"
                  className="hover:text-teal-600 transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
        <CookieConsentBanner />
      </body>
    </html>
  );
}