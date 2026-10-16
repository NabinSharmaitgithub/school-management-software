import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <nav className="hidden md:flex justify-center items-center py-6 border-b border-border">
        <Link href="/" className="px-4 py-2 text-sm text-on-surface-v2 hover:text-teal-600">
          Home
        </Link>
        <Link href="/dashboard" className="px-4 py-2 text-sm text-on-surface-v2 hover:text-teal-600">
          Portal
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Cookie Policy</h1>
          <p className="text-slate-600">
            Last updated: October 16, 2026
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. What Are Cookies?</h2>
          <p className="text-slate-700 mb-4">
            Cookies are small text files placed on your device when you visit a website. They
            help the website remember information about your visit, such as your preferred
            language and other settings, to make your next visit easier and the site more
            useful to you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Cookies We Use</h2>
          <p className="text-slate-700 mb-4">
            We use only essential cookies necessary for the operation of the school management
            portal:
          </p>
          <table className="w-full text-left border-collapse text-slate-700 mb-4">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 text-slate-900 font-semibold">Cookie</th>
                <th className="pb-3 pr-4 text-slate-900 font-semibold">Purpose</th>
                <th className="pb-3 pr-4 text-slate-900 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 pr-4">Firebase Auth session</td>
                <td className="py-3 pr-4">Maintains your signed-in session</td>
                <td className="py-3 pr-4">Session</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 pr-4">csrf_token</td>
                <td className="py-3 pr-4">Protects against cross-site request forgery</td>
                <td className="py-3 pr-4">1 hour</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Third-Party Cookies</h2>
          <p className="text-slate-700 mb-4">
            We do not use third-party tracking cookies, advertising cookies, or analytics
            cookies. External services used (Firebase, Cloudinary, Google Fonts) may set
            their own cookies as part of their service operation, which are subject to their
            respective privacy policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Managing Cookies</h2>
          <p className="text-slate-700 mb-4">
            You can control and/or delete cookies as you wish. You can delete all cookies
            that are already on your computer and you can set most browsers to prevent them
            from being placed. If you do this, however, you may have to manually adjust some
            preferences every time you visit a site and some services and functionalities may
            not work.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Changes to This Policy</h2>
          <p className="text-slate-700 mb-4">
            We may update this Cookie Policy from time to time. Your continued use of the
            Portal after any changes constitutes your acceptance of the new policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this Cookie Policy, please contact the school
            administration.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-border text-sm text-slate-500">
          Greenwood International School &middot; 123 Education Boulevard, Knowledge City
        </footer>
      </main>
    </div>
  );
}