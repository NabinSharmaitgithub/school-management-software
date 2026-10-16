import Link from "next/link";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">
            Last updated: October 16, 2026
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Introduction</h2>
          <p className="text-slate-700 mb-4">
            Welcome to Greenwood International School&rsquo;s School Management System
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;). We are committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our school management portal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information We Collect</h2>
          <p className="text-slate-700 mb-4">
            We only collect personal data that is necessary for the operation of the school
            management system. This may include:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Contact information: name, email address, phone number, and address</li>
            <li>Identification information: admission number, roll number, student ID</li>
            <li>Academic information: class, section, subjects, marks, attendance records</li>
            <li>Financial information: fee payments, invoices, receipts, and outstanding balances</li>
            <li>Photos: student and staff profile photos (voluntarily uploaded)</li>
            <li>Authentication data: email and hashed password (via Firebase Auth)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How We Use Your Information</h2>
          <p className="text-slate-700 mb-4">
            We use your information to:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Provide and maintain the school management portal</li>
            <li>Process fee payments and generate receipts</li>
            <li>Record attendance and academic marks</li>
            <li>Send school announcements and communications</li>
            <li>Generate ID cards, report cards, and transfer certificates</li>
            <li>Manage staff payroll and leave requests</li>
            <li>Improve and secure our services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Information Sharing</h2>
          <p className="text-slate-700 mb-4">
            We do not sell or rent your personal information to third parties. We may share
            data only with:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li><strong>Firebase:</strong> For authentication and database hosting</li>
            <li><strong>Cloudinary:</strong> For storing profile photos and school logos</li>
            <li>Authorized school administrators and staff, on a need-to-know basis</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data Retention</h2>
          <p className="text-slate-700 mb-4">
            We retain personal data only as long as necessary to fulfill the purposes outlined
            in this policy. Students who are archived (not permanently deleted) retain their
            academic and financial records for historical purposes. You may request deletion
            of your personal data by contacting the school administration.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
          <p className="text-slate-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your personal data</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Lodge a complaint with the school administration</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Security</h2>
          <p className="text-slate-700 mb-4">
            We implement appropriate technical and organizational measures to protect your
            personal data, including encryption in transit and at rest, access controls, and
            audit logging for financial and administrative operations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Cookies</h2>
          <p className="text-slate-700 mb-4">
            We use essential cookies for authentication and session management. See our
            <Link href="/cookie-policy" className="text-teal-600 hover:underline">Cookie Policy</Link>
            for details.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this Privacy Policy, please contact the school
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