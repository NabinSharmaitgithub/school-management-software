import Link from "next/link";

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-600">
            Last updated: October 16, 2026
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-slate-700 mb-4">
            By accessing and using the Greenwood International School Management System
            (&ldquo;the Portal&rdquo;), you agree to be bound by these Terms of Service. If you do
            not agree, you may not use the Portal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Eligibility</h2>
          <p className="text-slate-700 mb-4">
            The Portal is intended for use by students, parents, staff, and administrators of
            Greenwood International School. Users must have a valid account issued by the
            school administration to access the Portal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. User Accounts</h2>
          <p className="text-slate-700 mb-4">
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account. You agree to:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Provide accurate and complete information during registration</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Not share your login credentials with unauthorized persons</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Acceptable Use</h2>
          <p className="text-slate-700 mb-4">
            You agree not to use the Portal for any unlawful purpose or in any way that could
            damage, disable, overburden, or impair the Portal. Prohibited activities include:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Attempting to gain unauthorized access to any part of the Portal</li>
            <li>Submitting false or misleading information</li>
            <li>Interfering with another user&rsquo;s account or data</li>
            <li>Using the Portal to transmit harmful code or viruses</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Fee Payments</h2>
          <p className="text-slate-700 mb-4">
            The Portal may be used to view fee invoices and record payments. All payments are
            subject to verification by the school administration. We do not process payments
            directly; payments are made at the school office or via the configured payment
            methods. Receipts issued through the Portal are for record-keeping purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Intellectual Property</h2>
          <p className="text-slate-700 mb-4">
            All content on the Portal, including text, graphics, logos, and software, is the
            property of Greenwood International School or its content suppliers and is
            protected by copyright and trademark laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Disclaimer of Warranties</h2>
          <p className="text-slate-700 mb-4">
            The Portal is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without
            warranties of any kind, either express or implied. We do not warrant that the
            Portal will be error-free, uninterrupted, or free of viruses or other harmful
            components.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Limitation of Liability</h2>
          <p className="text-slate-700 mb-4">
            To the fullest extent permitted by law, Greenwood International School shall not
            be liable for any indirect, incidental, special, consequential, or punitive
            damages, or any loss of profits or revenue, whether incurred directly or
            indirectly, in connection with the Portal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Termination</h2>
          <p className="text-slate-700 mb-4">
            We may terminate or suspend your account and access to the Portal immediately,
            without prior notice or liability, for any reason, including if you breach these
            Terms of Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Governing Law</h2>
          <p className="text-slate-700 mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which Greenwood International School is located, without regard to
            its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Changes to These Terms</h2>
          <p className="text-slate-700 mb-4">
            We may revise these Terms at any time. Your continued use of the Portal after any
            revision constitutes your acceptance of the new Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about these Terms, please contact the school administration.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-border text-sm text-slate-500">
          Greenwood International School &middot; 123 Education Boulevard, Knowledge City
        </footer>
      </main>
    </div>
  );
}