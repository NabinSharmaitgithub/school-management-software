"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listBooks,
  addBook,
  deleteBook,
  listLoans,
  issueBook,
  returnLoan,
  collectLoanFine,
  studentNames,
} from "@/lib/data";
import type { Book, Loan } from "@/lib/data";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

const FINE_PER_DAY = 5; // ₹
const GENRES = ["Fiction", "Non-Fiction", "Science", "Science Fiction", "History", "Fantasy"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

function fineFor(loan: Loan, todayIso: string): number {
  if (loan.returned_date) return loan.fine ?? 0;
  const days = daysBetween(loan.due_date, todayIso);
  return days > 0 ? days * FINE_PER_DAY : 0;
}

type Tab = "catalog" | "borrowing" | "fines";

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Catalog filters
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All Genres");
  const [avail, setAvail] = useState("All");

  // Add book modal
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookForm, setBookForm] = useState({ title: "", author: "", isbn: "", genre: "Fiction", copies: "1" });

  // Issue / return modals
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ book_id: "", student_id: "", due_days: "14" });
  const [returnBookId, setReturnBookId] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);

  // Fines
  const [collectId, setCollectId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    try {
      const [b, l, n] = await Promise.all([listBooks(), listLoans(), studentNames()]);
      setBooks(b);
      setLoans(l);
      setNames(n);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** Active copies remaining per book (copies minus outstanding loans). */
  const remaining = useMemo(() => {
    const active = loans.filter((l) => !l.returned_date);
    const out: Record<string, number> = {};
    for (const b of books) out[b.id] = b.copies;
    for (const l of active) if (out[l.book_id] !== undefined) out[l.book_id] -= 1;
    return out;
  }, [books, loans]);

  const bookName = (id: string) => books.find((b) => b.id === id)?.title ?? id;

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = search.trim().toLowerCase();
      if (q && !`${b.title} ${b.author} ${b.isbn ?? ""}`.toLowerCase().includes(q)) return false;
      if (genre !== "All Genres" && b.genre !== genre) return false;
      if (avail === "Available" && (remaining[b.id] ?? 0) <= 0) return false;
      if (avail === "Issued" && (remaining[b.id] ?? 0) >= b.copies) return false;
      if (avail === "Reserved" && (remaining[b.id] ?? 0) <= 0 && b.copies - (remaining[b.id] ?? 0) > 0) return false;
      return true;
    });
  }, [books, search, genre, avail, remaining]);

  const activeLoanList = useMemo(
    () => loans.filter((l) => !l.returned_date),
    [loans]
  );

  const fines = useMemo(() => {
    const now = today();
    return loans
      .filter((l) => (l.returned_date ? (l.fine ?? 0) > 0 && !l.fine_paid : fineFor(l, now) > 0))
      .map((l) => ({ loan: l, fine: fineFor(l, now), active: !l.returned_date }));
  }, [loans]);

  const totalOutstanding = fines.reduce((s, f) => s + f.fine, 0);
  const collectedThisMonth = loans
    .filter((l) => l.returned_date && l.fine_paid && l.fine! > 0)
    .reduce((s, l) => s + (l.fine ?? 0), 0);

  async function onAddBook(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const copies = Number(bookForm.copies);
    if (!bookForm.title.trim() || !bookForm.author.trim() || !isFinite(copies) || copies < 1) {
      setError("Title, author and a positive copy count are required.");
      return;
    }
    setSaving(true);
    try {
      await addBook({
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        isbn: bookForm.isbn.trim() || undefined,
        genre: bookForm.genre,
        copies,
      });
      setAddOpen(false);
      setBookForm({ title: "", author: "", isbn: "", genre: "Fiction", copies: "1" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const remainingCount = remaining[issueForm.book_id] ?? 0;
    if (!issueForm.book_id || !issueForm.student_id) {
      setError("Pick a book and a student to issue it to.");
      return;
    }
    if (remainingCount <= 0) {
      setError("No copies of this book are available right now.");
      return;
    }
    setSaving(true);
    try {
      const issued = today();
      await issueBook(
        issueForm.book_id,
        issueForm.student_id,
        issued,
        addDays(issued, Number(issueForm.due_days) || 14)
      );
      setIssueOpen(false);
      setIssueForm({ book_id: "", student_id: "", due_days: "14" });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const selectedReturnLoan = loans.find(
    (l) => !l.returned_date && l.book_id === returnBookId
  );

  async function onReturn() {
    setError("");
    const loan = selectedReturnLoan;
    if (!loan) {
      setError("That book has no active loan to return.");
      return;
    }
    setSaving(true);
    try {
      const now = today();
      const fine = fineFor(loan, now);
      await returnLoan(loan.id, now, fine, false);
      setReturnOpen(false);
      setReturnBookId("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onCollect() {
    if (!collectId) return;
    const loan = loans.find((l) => l.id === collectId);
    if (loan) await collectLoanFine(loan.id, fineFor(loan, today()));
    setCollectId(null);
    load();
  }

  async function onDelete() {
    if (!confirmDelete) return;
    await deleteBook(confirmDelete);
    setConfirmDelete(null);
    load();
  }

  const studentOptions = Object.entries(names)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Library</h1>
          <p className="text-sm text-on-surface/60">
            {books.length} titles · {activeLoanList.length} books on loan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="ghost"
            onClick={() => setTab("catalog")}
            className={tab === "catalog" ? "bg-primary/15 text-primary font-semibold" : ""}
          >
            Catalog
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setTab("borrowing")}
            className={tab === "borrowing" ? "bg-primary/15 text-primary font-semibold" : ""}
          >
            Borrowing
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setTab("fines")}
            className={tab === "fines" ? "bg-primary/15 text-primary font-semibold" : ""}
          >
            Fines
          </GlassButton>
        </div>
      </header>

      {error && (
        <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-on-surface/60 py-8 text-center">Loading…</p>
      ) : (
        <>
          {/* ── Catalog ─────────────────────────────────────────── */}
          {tab === "catalog" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Library Catalog</h2>
                  <p className="text-xs text-on-surface/60">
                    Manage and browse the school&apos;s collection.
                  </p>
                </div>
                <GlassButton onClick={() => setAddOpen(true)}>
                  <span className="material-symbols-outlined text-lg">add</span>
                  Add New Book
                </GlassButton>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <Field label="Search">
                  <Input
                    placeholder="Search title, author or ISBN…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Field>
                <Field label="Genre">
                  <Select value={genre} onChange={(e) => setGenre(e.target.value)}>
                    {["All Genres", ...GENRES].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Availability">
                  <Select value={avail} onChange={(e) => setAvail(e.target.value)}>
                    {["All", "Available", "Issued"].map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {filteredBooks.length === 0 ? (
                <p className="text-sm text-on-surface/60 py-8 text-center">
                  No books match your filters yet. Click &ldquo;Add New Book&rdquo; to add the first
                  title.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map((b) => {
                    const left = remaining[b.id] ?? 0;
                    const out = b.copies - left;
                    return (
                      <div key={b.id} className="relative glass-panel p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="material-symbols-outlined text-2xl text-primary/60">
                            menu_book
                          </span>
                          {left > 0 ? (
                            <StatusPill tone="success">Available</StatusPill>
                          ) : out >= b.copies ? (
                            <StatusPill tone="warning">Issued</StatusPill>
                          ) : (
                            <StatusPill tone="neutral">Reserved</StatusPill>
                          )}
                        </div>
                        <h3 className="font-semibold text-on-surface leading-snug">{b.title}</h3>
                        <p className="text-xs text-on-surface/60 mt-0.5">
                          {b.author} · {b.genre}
                        </p>
                        <p className="text-xs text-on-surface/50 mt-1">
                          {b.isbn ? `${b.isbn} · ` : ""}
                          {left} of {b.copies} available
                        </p>
                        <button
                          onClick={() => setConfirmDelete(b.id)}
                          className="absolute top-3 right-3 glass-btn-ghost w-8 h-8 rounded-lg flex items-center justify-center text-on-surface/40 hover:text-rose"
                          aria-label="Delete book"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          )}

          {/* ── Borrowing ───────────────────────────────────────── */}
          {tab === "borrowing" && (
            <>
              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-1">Borrowing Operations</h2>
                <p className="text-xs text-on-surface/60 mb-5">
                  Manage book issuing and returns efficiently.
                </p>
                <div className="flex flex-wrap gap-3">
                  <GlassButton onClick={() => setIssueOpen(true)}>
                    <span className="material-symbols-outlined text-lg">book_4</span>
                    Issue Book
                  </GlassButton>
                  <GlassButton variant="ghost" onClick={() => setReturnOpen(true)}>
                    <span className="material-symbols-outlined text-lg">assignment_return</span>
                    Return Book
                  </GlassButton>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-on-surface">Active Loans</p>
                    <span className="text-xs text-on-surface/50">
                      {activeLoanList.length} active
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                          <th className="pb-3 pr-4">Book Title</th>
                          <th className="pb-3 pr-4">Borrower</th>
                          <th className="pb-3 pr-4 hidden sm:table-cell">Issue Date</th>
                          <th className="pb-3 pr-4 hidden md:table-cell">Due Date</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoanList.length === 0 && (
                          <tr>
                            <td className="py-3 text-on-surface/60" colSpan={5}>
                              No active loans. Use &ldquo;Issue Book&rdquo; to lend a title.
                            </td>
                          </tr>
                        )}
                        {activeLoanList.map((l) => {
                          const overdue = daysBetween(l.due_date, today()) > 0;
                          return (
                            <tr
                              key={l.id}
                              className="border-t border-on-surface/10 hover:bg-white/40"
                            >
                              <td className="py-3 pr-4 font-medium text-on-surface">
                                {bookName(l.book_id)}
                              </td>
                              <td className="py-3 pr-4 text-on-surface/70">
                                {names[l.student_id] ?? l.student_id}
                              </td>
                              <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                                {l.issued_date}
                              </td>
                              <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">
                                {l.due_date}
                              </td>
                              <td className="py-3 text-right">
                                {overdue ? (
                                  <StatusPill tone="error">Overdue</StatusPill>
                                ) : (
                                  <StatusPill tone="success">On Time</StatusPill>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassCard>
            </>
          )}

          {/* ── Fines ───────────────────────────────────────────── */}
          {tab === "fines" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-warning">warning</span>
                    Total Outstanding Fines
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">
                    ₹{totalOutstanding.toLocaleString("en-IN")}
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-success">
                      check_circle
                    </span>
                    Collected
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">
                    ₹{collectedThisMonth.toLocaleString("en-IN")}
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-xs text-on-surface/60 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">
                      auto_stories
                    </span>
                    Active Fines
                  </p>
                  <p className="text-2xl font-bold text-on-surface mt-1">{fines.length}</p>
                </GlassCard>
              </div>

              <GlassCard className="p-4 sm:p-6">
                <h2 className="text-base font-semibold mb-1">Fine Management</h2>
                <p className="text-xs text-on-surface/60 mb-1">
                  Overview and collection of outstanding library dues (₹{FINE_PER_DAY}/day overdue).
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                        <th className="pb-3 pr-4">Borrower</th>
                        <th className="pb-3 pr-4">Book Title</th>
                        <th className="pb-3 pr-4 hidden sm:table-cell">Days Overdue</th>
                        <th className="pb-3 pr-4 text-right">Fine Amount</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fines.length === 0 && (
                        <tr>
                          <td className="py-3 text-on-surface/60" colSpan={6}>
                            No outstanding fines. All loans are on time or settled.
                          </td>
                        </tr>
                      )}
                      {fines.map(({ loan: l, fine, active }) => {
                        const days = l.returned_date
                          ? Math.max(0, daysBetween(l.due_date, l.returned_date))
                          : Math.max(0, daysBetween(l.due_date, today()));
                        const returnId = l.id;
                        return (
                          <tr key={l.id} className="border-t border-on-surface/10 hover:bg-white/40">
                            <td className="py-3 pr-4 font-medium text-on-surface">
                              {names[l.student_id] ?? l.student_id}
                            </td>
                            <td className="py-3 pr-4 text-on-surface/70">{bookName(l.book_id)}</td>
                            <td className="py-3 pr-4 hidden sm:table-cell text-on-surface/70">
                              {days} Days
                            </td>
                            <td className="py-3 pr-4 text-right font-semibold text-error">
                              ₹{fine.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 pr-4">
                              {active ? (
                                <StatusPill tone="error">Overdue</StatusPill>
                              ) : (
                                <StatusPill tone="warning">Pending</StatusPill>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {active ? (
                                <GlassButton
                                  variant="ghost"
                                  onClick={() => setCollectId(returnId)}
                                >
                                  Collect
                                </GlassButton>
                              ) : (
                                <span className="text-xs text-on-surface/40">
                                  Awaiting return
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          )}
        </>
      )}

      {/* ── Add new book modal ─────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Book">
        <form className="space-y-4" onSubmit={onAddBook}>
          <Field label="Book Title *">
            <Input
              placeholder="e.g. The Great Gatsby"
              value={bookForm.title}
              onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </Field>
          <Field label="Author *">
            <Input
              placeholder="e.g. F. Scott Fitzgerald"
              value={bookForm.author}
              onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))}
              required
            />
          </Field>
          <Field label="ISBN">
            <Input
              placeholder="e.g. 978-3-16-148410-0"
              value={bookForm.isbn}
              onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre">
              <Select
                value={bookForm.genre}
                onChange={(e) => setBookForm((f) => ({ ...f, genre: e.target.value }))}
              >
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Copies Count *">
              <Input
                type="number"
                min="1"
                step="1"
                value={bookForm.copies}
                onChange={(e) => setBookForm((f) => ({ ...f, copies: e.target.value }))}
                required
              />
            </Field>
          </div>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Book"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Issue book modal ───────────────────────────────────── */}
      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Book">
        <form className="space-y-4" onSubmit={onIssue}>
          <Field label="Book *">
            <Select
              value={issueForm.book_id}
              onChange={(e) => setIssueForm((f) => ({ ...f, book_id: e.target.value, student_id: "" }))}
            >
              <option value="">Select a book…</option>
              {books.map((b) => (
                <option key={b.id} value={b.id} disabled={(remaining[b.id] ?? 0) <= 0}>
                  {b.title} · {remaining[b.id] ?? 0} left
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Student *">
            <Select
              value={issueForm.student_id}
              onChange={(e) => setIssueForm((f) => ({ ...f, student_id: e.target.value }))}
            >
              <option value="">Select student…</option>
              {studentOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Loan period">
            <Select
              value={issueForm.due_days}
              onChange={(e) => setIssueForm((f) => ({ ...f, due_days: e.target.value }))}
            >
              {["7", "14", "21", "30"].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </Select>
          </Field>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setIssueOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Issuing…" : "Issue Book"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── Return book modal ──────────────────────────────────── */}
      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Return Book">
        <div className="space-y-4">
          <Field label="Book *">
            <Select value={returnBookId} onChange={(e) => setReturnBookId(e.target.value)}>
              <option value="">Select a book…</option>
              {activeLoanList.map((l) => (
                <option key={l.id} value={l.book_id}>
                  {bookName(l.book_id)}
                </option>
              ))}
            </Select>
          </Field>

          {selectedReturnLoan && (
            <div className="rounded-lg bg-white/50 border border-white/70 p-3 text-sm space-y-1">
              <p className="text-on-surface/70">
                Current Borrower:{" "}
                <span className="font-medium text-on-surface">
                  {names[selectedReturnLoan.student_id] ?? selectedReturnLoan.student_id}
                </span>
              </p>
              <p className="text-on-surface/70">Due Date: {selectedReturnLoan.due_date}</p>
              <p className="text-on-surface/70">
                Calculated Fine:{" "}
                <span className="font-semibold text-error">
                  ₹{fineFor(selectedReturnLoan, today()).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setReturnOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton onClick={onReturn} disabled={saving || !returnBookId}>
              {saving ? "Processing…" : "Process Return"}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* ── Confirm collect fine ────────────────────────────────── */}
      <Modal open={!!collectId} onClose={() => setCollectId(null)} title="Collect fine?">
        {(() => {
          const loan = loans.find((l) => l.id === collectId);
          const amount = loan ? fineFor(loan, today()) : 0;
          return (
            <>
              <p className="text-sm text-on-surface/70 mb-6">
                Mark the <span className="font-semibold text-on-surface">₹{amount}</span> overdue
                fine for <span className="font-medium text-on-surface">{bookName(loan?.book_id ?? "")}</span>{" "}
                as collected. The book stays on loan until returned.
              </p>
              <div className="flex justify-end gap-3">
                <GlassButton variant="ghost" onClick={() => setCollectId(null)}>
                  Cancel
                </GlassButton>
                <GlassButton onClick={onCollect}>Collect</GlassButton>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* ── Confirm delete book ─────────────────────────────────── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete book?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes the title from the catalog. Existing loans are kept.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDelete}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}