import Link from "next/link";

export default function RefundPolicyPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Refund Policy</h1>
          <p className="text-slate-600">
            Last updated: October 16, 2026
          </p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Policy Overview</h2>
          <p className="text-slate-700 mb-4">
            Greenwood International School strives to provide clear and fair fee collection
            practices. This Refund Policy explains how overpayments, duplicate payments, and
            withdrawals are handled.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Fee Payments</h2>
          <p className="text-slate-700 mb-4">
            All fee payments made through the school office or configured payment methods are
            recorded in the school management system. Each payment is assigned a unique
            receipt number and is linked to a specific invoice. Payments are applied first to
            outstanding balances, then to the current invoice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Overpayments</h2>
          <p className="text-slate-700 mb-4">
            If a payment exceeds the amount due on an invoice, the excess amount is applied
            to the student&rsquo;s account as a credit toward future invoices. Refunds of
            overpayments are considered on a case-by-case basis and require approval from the
            school administration.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Duplicate Payments</h2>
          <p className="text-slate-700 mb-4">
            Our system prevents duplicate payments for the same invoice, amount, date, and
            transaction reference. If a duplicate payment is recorded in error, it will be
            voided and the funds will either be:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Refunded to the payer, or</li>
            <li>Applied as a credit to the student&rsquo;s account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Student Withdrawal</h2>
          <p className="text-slate-700 mb-4">
            If a student withdraws from the school, any prepaid fees for the current term may
            be refunded on a pro-rated basis, subject to the school&rsquo;s withdrawal policy.
            Refund requests must be submitted in writing to the school administration.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Refund Request Process</h2>
          <p className="text-slate-700 mb-4">
            To request a refund:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Submit a written request to the school administration</li>
            <li>Include the student&rsquo;s name, admission number, and invoice/receipt number</li>
            <li>Provide the reason for the refund request</li>
            <li>Attach supporting documentation (e.g., bank statement, receipt)</li>
          </ul>
          <p className="text-slate-700 mb-4">
            Refund requests are reviewed within 10 business days. Approved refunds are
            processed within 30 days of approval.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Non-Refundable Fees</h2>
          <p className="text-slate-700 mb-4">
            The following fees are non-refundable once incurred:
          </p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2">
            <li>Application and admission fees</li>
            <li>Examination fees</li>
            <li>Late fees and penalties</li>
            <li>Transport fees for services already rendered</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this Refund Policy, please contact the school
            administration office.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-border text-sm text-slate-500">
          Greenwood International School &middot; 123 Education Boulevard, Knowledge City
        </footer>
      </main>
    </div>
  );
}