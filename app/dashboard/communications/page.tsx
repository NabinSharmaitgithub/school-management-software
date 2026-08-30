"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ensureThread,
  listClasses,
  listAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  listBroadcasts,
  addBroadcast,
  listStaff,
  listThreads,
  sendThreadMessage,
} from "@/lib/data";
import type { Announcement, Broadcast, Staff, Thread } from "@/lib/data";
import { useAuthEmail } from "@/components/dashboard/teacher-scope";
import { Field, GlassButton, GlassCard, Input, Modal, Select, StatusPill } from "@/components/ui";

type Tab = "notice" | "broadcast" | "messenger";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function clock(iso: string): string {
  const d = new Date(iso);
  if (!isFinite(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const AUDIENCE_LABELS: Record<Announcement["audience"], string> = {
  all: "School Wide",
  staff: "Staff Only",
  parents: "Parents",
  class: "Class",
};

const PRIORITY_TONES = {
  high: "error" as const,
  normal: "neutral" as const,
  low: "success" as const,
};

const CHANNEL_ICON: Record<Broadcast["channel"], string> = {
  inapp: "smartphone",
  sms: "sms",
  email: "mail",
};

const BROADCAST_TEMPLATES: Record<string, string> = {
  "Attendance Alert":
    "This is a reminder that daily attendance must be marked in the portal before 9:00 AM.",
  "Fee Reminder":
    "Dear parents, the next installment of school fees is due by the end of this week. Please clear pending dues through the portal.",
  "Holiday Notice":
    "Please note that the school will remain closed on account of an upcoming holiday. Classes resume on the next working day.",
};

export default function CommunicationsPage() {
  const [tab, setTab] = useState<Tab>("notice");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeThread, setActiveThread] = useState<string>("");
  const email = useAuthEmail();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notice board state
  const [noticeFilter, setNoticeFilter] = useState<"all" | "important" | "drafts">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    body: "",
    audience: "all" as Announcement["audience"],
    class_id: "",
    date: today(),
    priority: "normal" as Announcement["priority"],
    draft: false,
  });

  // Broadcast state
  const [composeOpen, setComposeOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    subject: "",
    body: "",
    channel: "inapp" as Broadcast["channel"],
    groups: [] as string[],
  });
  const [draftGroup, setDraftGroup] = useState("");

  // Messenger state
  const [draft, setDraft] = useState("");

  const load = async () => {
    try {
      const [c, a, b, t, s] = await Promise.all([
        listClasses(),
        listAnnouncements(),
        listBroadcasts(),
        listThreads(),
        listStaff(),
      ]);
      setClasses(c.map((x) => ({ id: x.id, name: x.name })));
      setAnnouncements(a);
      setBroadcasts(b);
      setThreads(t);
      setStaff(s);
      setActiveThread((cur) => (cur && t.some((th) => th.id === cur) ? cur : (t[0]?.id ?? "")));
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

  const visibleNotices = useMemo(() => {
    if (noticeFilter === "drafts") return announcements.filter((a) => a.draft);
    if (noticeFilter === "important") return announcements.filter((a) => a.priority === "high");
    return announcements.filter((a) => !a.draft);
  }, [announcements, noticeFilter]);

  const active = threads.find((t) => t.id === activeThread);

  const myName = useMemo(() => {
    if (!email) return "";
    if (email === "admin@school.local") return "Admin";
    return staff.find((s) => s.email === email)?.name ?? "Admin";
  }, [email, staff]);

  const roster = useMemo(
    () =>
      staff
        .map((s) => ({ name: s.name, role: s.role }))
        .concat([{ name: "Admin", role: "Administrator" }])
        .filter((p) => !threads.some((t) => t.name === p.name)),
    [staff, threads]
  );

  async function startConversation(name: string) {
    setError("");
    try {
      const id = await ensureThread(name);
      setActiveThread(id);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onPost(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!noticeForm.title.trim() || !noticeForm.body.trim()) {
      setError("Both a title and content are required.");
      return;
    }
    setSaving(true);
    try {
      await addAnnouncement({
        title: noticeForm.title.trim(),
        body: noticeForm.body.trim(),
        audience: noticeForm.audience,
        class_id:
          noticeForm.audience === "class" && noticeForm.class_id
            ? noticeForm.class_id
            : undefined,
        priority: noticeForm.priority,
        draft: noticeForm.draft,
        author: "Principal's Office",
        date: noticeForm.date,
      });
      setPostOpen(false);
      setNoticeForm({
        title: "",
        body: "",
        audience: "all",
        class_id: "",
        date: today(),
        priority: "normal",
        draft: false,
      });
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteNotice() {
    if (!confirmDelete) return;
    await deleteAnnouncement(confirmDelete);
    setConfirmDelete(null);
    load();
  }

  function pickGroup(name: string) {
    if (broadcastForm.groups.includes(name)) return;
    setBroadcastForm((f) => ({ ...f, groups: [...f.groups, name] }));
  }

  function removeGroup(name: string) {
    setBroadcastForm((f) => ({ ...f, groups: f.groups.filter((g) => g !== name) }));
  }

  const totalRecipients =
    broadcastForm.groups.length === 0
      ? 0
      : broadcastForm.groups.reduce(
          (s, g) => s + (g.startsWith("Grade") ? 85 : g === "Staff" ? 142 : 210),
          0
        );

  async function onSendBroadcast() {
    setError("");
    if (!broadcastForm.subject.trim() || !broadcastForm.body.trim()) {
      setError("Add a subject and message before sending.");
      return;
    }
    setSaving(true);
    try {
      await addBroadcast({
        subject: broadcastForm.subject.trim(),
        body: broadcastForm.body.trim(),
        channel: broadcastForm.channel,
        groups: broadcastForm.groups,
        count: totalRecipients,
        status: "delivered",
      });
      setComposeOpen(false);
      setBroadcastForm({ subject: "", body: "", channel: "inapp", groups: [] });
      setDraftGroup("");
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !draft.trim()) return;
    await sendThreadMessage(activeThread, {
      text: draft.trim(),
      from: myName,
      at: new Date().toISOString(),
      mine: true,
    });
    setDraft("");
    load();
  }

  const groupOptions = [
    ...classes.map((c) => `${c.name} (class)`),
    "Staff",
    "Parents",
    "All Students",
  ].filter((g) => !broadcastForm.groups.includes(g));

  const tabClass = (t: Tab) =>
    tab === t ? "bg-primary/15 text-primary font-semibold" : "";

  return (
    <div className="space-y-6">
      <header className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Communications</h1>
          <p className="text-sm text-on-surface/60">
            Announcements, broadcasts, and instant messaging
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="ghost"
            onClick={() => setTab("notice")}
            className={tabClass("notice")}
          >
            Notice Board
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setTab("broadcast")}
            className={tabClass("broadcast")}
          >
            Broadcast
          </GlassButton>
          <GlassButton
            variant="ghost"
            onClick={() => setTab("messenger")}
            className={tabClass("messenger")}
          >
            Messenger
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
          {/* ── Notice Board ───────────────────────────────────── */}
          {tab === "notice" && (
            <GlassCard className="p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold">Notice Board</h2>
                  <p className="text-xs text-on-surface/60">
                    Publish and manage campus-wide announcements.
                  </p>
                </div>
                <GlassButton onClick={() => setPostOpen(true)}>
                  <span className="material-symbols-outlined text-lg">campaign</span>
                  Create Announcement
                </GlassButton>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {(
                  [
                    ["all", "All Notices"],
                    ["important", "Important"],
                    ["drafts", "Drafts"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNoticeFilter(key)}
                    className={`text-sm rounded-full px-3 py-1.5 border border-white/70 transition ${
                      noticeFilter === key
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "text-on-surface/70 hover:bg-white/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {visibleNotices.length === 0 && (
                  <p className="text-sm text-on-surface/60 py-8 text-center">
                    No notices in this view yet.
                  </p>
                )}
                {visibleNotices.map((n) => {
                  const isOpen = expanded === n.id;
                  const cls = classes.find((c) => c.id === n.class_id);
                  return (
                    <div key={n.id} className="relative glass-panel p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <span
                            className={`material-symbols-outlined text-xl ${
                              n.priority === "high" ? "text-error" : "text-primary/50"
                            }`}
                          >
                            {n.priority === "high" ? "push_pin" : "campaign"}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-on-surface">{n.title}</p>
                              <StatusPill tone={PRIORITY_TONES[n.priority]}>
                                {n.priority === "normal"
                                  ? "Normal"
                                  : n.priority === "high"
                                    ? "High Priority"
                                    : "Low Priority"}
                              </StatusPill>
                              <StatusPill tone="neutral">{AUDIENCE_LABELS[n.audience]}</StatusPill>
                              {n.draft && <StatusPill tone="warning">Draft</StatusPill>}
                            </div>
                            <p className="text-xs text-on-surface/50 mt-1">
                              {n.author} · {n.date}
                              {cls ? ` · ${cls.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setExpanded(isOpen ? null : n.id)}
                            className="text-xs text-primary font-medium whitespace-nowrap"
                          >
                            {isOpen ? "Collapse" : "Read Full"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(n.id)}
                            className="text-on-surface/40 hover:text-error transition"
                            aria-label="Delete notice"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                      <p
                        className={`text-sm text-on-surface/70 mt-3 ${
                          isOpen ? "" : "line-clamp-3"
                        }`}
                      >
                        {n.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* ── Broadcast ─────────────────────────────────────── */}
          {tab === "broadcast" && (
            <>
              <GlassCard className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div>
                    <h2 className="text-base font-semibold">Broadcast Center</h2>
                    <p className="text-xs text-on-surface/60">
                      Compose targeted messages to parents, staff, or classes.
                    </p>
                  </div>
                  <GlassButton onClick={() => setComposeOpen(true)}>
                    <span className="material-symbols-outlined text-lg">edit_square</span>
                    New Broadcast
                  </GlassButton>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-on-surface">Recent Broadcasts</p>
                    <span className="text-xs text-on-surface/50">View all</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-on-surface/50">
                          <th className="pb-3 pr-4">Date</th>
                          <th className="pb-3 pr-4">Subject</th>
                          <th className="pb-3 pr-4 hidden sm:table-cell">Channel</th>
                          <th className="pb-3 pr-4 hidden md:table-cell">Recipients</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {broadcasts.length === 0 && (
                          <tr>
                            <td className="py-3 text-on-surface/60" colSpan={5}>
                              No broadcasts sent yet. Start with &ldquo;New Broadcast&rdquo;.
                            </td>
                          </tr>
                        )}
                        {broadcasts.map((b) => (
                          <tr key={b.id} className="border-t border-on-surface/10 hover:bg-white/40">
                            <td className="py-3 pr-4 text-on-surface/70">
                              {b.createdAt && typeof b.createdAt === "object" && "seconds" in b.createdAt
                                ? new Date(
                                    Number((b.createdAt as { seconds: number }).seconds) * 1000
                                  ).toLocaleString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                            <td className="py-3 pr-4 font-medium text-on-surface">{b.subject}</td>
                            <td className="py-3 pr-4 hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1.5 text-on-surface/70 capitalize">
                                <span className="material-symbols-outlined text-base text-on-surface/50">
                                  {CHANNEL_ICON[b.channel]}
                                </span>
                                {b.channel === "inapp" ? "In-App" : b.channel.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 pr-4 hidden md:table-cell text-on-surface/70">
                              {b.groups.join(", ") || "—"} ({b.count})
                            </td>
                            <td className="py-3 text-right">
                              {b.status === "delivered" && <StatusPill tone="success">Delivered</StatusPill>}
                              {b.status === "pending" && <StatusPill tone="warning">Pending</StatusPill>}
                              {b.status === "failed" && <StatusPill tone="error">Failed</StatusPill>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </GlassCard>
            </>
          )}

          {/* ── Messenger ─────────────────────────────────────── */}
          {tab === "messenger" && (
            <GlassCard className="p-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[280px,1fr]">
                {/* Conversations */}
                <div className="border-b md:border-b-0 md:border-r border-white/50">
                  <div className="p-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold">Messenger</h2>
                  </div>
                  <div className="max-h-[520px] overflow-y-auto">
                    {threads.length === 0 && (
                      <p className="text-sm text-on-surface/60 px-4 py-8 text-center">
                        No conversations yet.
                      </p>
                    )}
                    {threads.map((t) => {
                      const last = t.messages[t.messages.length - 1];
                      const latestText = last ? `${last.from}: ${last.text}` : "";
                      const isActive = t.id === activeThread;
                      const initials = t.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase();
                      return (
                        <button
                          key={t.id}
                          onClick={() => setActiveThread(t.id)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-b border-white/40 ${
                            isActive ? "bg-primary/10" : "hover:bg-white/40"
                          }`}
                        >
                          <span className="relative shrink-0 w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                            {initials}
                            {t.online && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm text-on-surface truncate">
                                {t.name}
                              </span>
                              <span className="text-[10px] text-on-surface/40 shrink-0">
                                {last ? timeAgo(last.at) : ""}
                              </span>
                            </span>
                            <span className="flex items-center justify-between gap-2">
                              <span className="text-xs text-on-surface/50 truncate">
                                {latestText}
                              </span>
                              {t.unread > 0 && (
                                <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                                  {t.unread}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {roster.length > 0 && (
                      <>
                        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface/40">
                          Start a conversation
                        </p>
                        {roster.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => startConversation(p.name)}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition border-b border-white/40 ${
                              activeThread === p.name ? "bg-primary/10" : "hover:bg-white/40"
                            }`}
                          >
                            <span className="shrink-0 w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold text-sm">
                              {p.name
                                .split(" ")
                                .slice(0, 2)
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-on-surface truncate">
                                {p.name}
                              </span>
                              <span className="block text-xs text-on-surface/50 truncate">
                                {p.role}
                              </span>
                            </span>
                            <span className="shrink-0 text-on-surface/40">
                              <span className="material-symbols-outlined text-base">add_comment</span>
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Conversation pane */}
                {active ? (
                  <div className="flex flex-col">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/50">
                      <div className="flex items-center gap-3">
                        <span className="relative">
                          <span className="material-symbols-outlined text-2xl text-primary/60">
                            account_circle
                          </span>
                          {active.online && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
                          )}
                        </span>
                        <div>
                          <p className="font-medium text-sm text-on-surface">{active.name}</p>
                          <p className="text-xs text-success">
                            {active.online ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface/50">
                        <span className="material-symbols-outlined text-lg">call</span>
                        <span className="material-symbols-outlined text-lg">videocam</span>
                      </div>
                    </div>

                    <div className="flex-1 px-4 py-4 space-y-3 max-h-[440px] overflow-y-auto">
                      {active.messages.length === 0 && (
                        <p className="text-sm text-on-surface/60 text-center py-8">
                          Say hello to {active.name.split(" ")[0]} to start the conversation.
                        </p>
                      )}
                      {active.messages.map((m, i) => (
                        <div
                          key={`${m.at}-${i}`}
                          className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                              m.mine
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-white/70 border border-white/80 text-on-surface rounded-bl-md"
                            }`}
                          >
                            <p
                              className={`text-[10px] font-medium mb-0.5 ${
                                m.mine ? "text-white/70" : "text-primary"
                              }`}
                            >
                              {m.from}
                            </p>
                            <p>{m.text}</p>
                            <p
                              className={`text-[10px] mt-1 flex items-center gap-1 ${
                                m.mine ? "text-white/70" : "text-on-surface/40"
                              }`}
                            >
                              {clock(m.at)}
                              {m.mine && (
                                <span className="material-symbols-outlined text-[12px]">
                                  done_all
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={onSendMessage}
                      className="px-4 py-3 border-t border-white/50 flex items-center gap-2"
                    >
                      <button type="button" className="text-on-surface/40" aria-label="Attach">
                        <span className="material-symbols-outlined">attach_file</span>
                      </button>
                      <Input
                        placeholder="Type a message…"
                        className="!rounded-full flex-1"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <button
                        type="submit"
                        aria-label="Send"
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface/60 py-16 text-center">
                    Select a conversation to read and reply.
                  </p>
                )}
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* ── Create announcement modal ─────────────────────────── */}
      <Modal open={postOpen} onClose={() => setPostOpen(false)} title="Create Announcement" wide>
        <form className="space-y-4" onSubmit={onPost}>
          <Field label="Title *">
            <Input
              placeholder="e.g. Science Fair Registration Open"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </Field>
          <Field label="Content *">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-white/70 bg-white/50 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              placeholder="Add the details of this notice…"
              value={noticeForm.body}
              onChange={(e) => setNoticeForm((f) => ({ ...f, body: e.target.value }))}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Target Audience">
              <Select
                value={noticeForm.audience}
                onChange={(e) =>
                  setNoticeForm((f) => ({
                    ...f,
                    audience: e.target.value as Announcement["audience"],
                  }))
                }
              >
                <option value="all">All</option>
                <option value="staff">Staff</option>
                <option value="parents">Parents</option>
                <option value="class">Class</option>
              </Select>
            </Field>
            <Field label="Publish Date">
              <Input
                type="date"
                value={noticeForm.date}
                onChange={(e) => setNoticeForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            {noticeForm.audience === "class" && (
              <Field label="Class">
                <Select
                  value={noticeForm.class_id}
                  onChange={(e) => setNoticeForm((f) => ({ ...f, class_id: e.target.value }))}
                >
                  <option value="">Select class…</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Priority">
              <Select
                value={noticeForm.priority}
                onChange={(e) =>
                  setNoticeForm((f) => ({
                    ...f,
                    priority: e.target.value as Announcement["priority"],
                  }))
                }
              >
                <option value="high">High Priority</option>
                <option value="normal">Normal</option>
                <option value="low">Low Priority</option>
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-on-surface/80">
            <input
              type="checkbox"
              checked={noticeForm.draft}
              onChange={(e) => setNoticeForm((f) => ({ ...f, draft: e.target.checked }))}
              className="accent-primary"
            />
            Save as draft
          </label>

          <p className="text-[11px] text-on-surface/40">
            Attachments: PDF, DOCX, JPG or PNG up to 5MB (coming soon).
          </p>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setPostOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Posting…" : noticeForm.draft ? "Save Draft" : "Post Announcement"}
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* ── New broadcast modal ────────────────────────────────── */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="New Broadcast" wide>
        <div className="space-y-4">
          <Field label="Channel">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["inapp", "smartphone", "In-App"],
                  ["sms", "sms", "SMS"],
                  ["email", "mail", "Email"],
                ] as const
              ).map(([val, icon, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBroadcastForm((f) => ({ ...f, channel: val }))}
                  className={`rounded-xl border px-3 py-2.5 flex flex-col items-center gap-1 text-sm transition ${
                    broadcastForm.channel === val
                      ? "border-primary text-primary bg-primary/10 font-medium"
                      : "border-white/70 text-on-surface/70 hover:bg-white/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Recipients">
            <div className="flex flex-wrap gap-2 mb-2">
              {broadcastForm.groups.length === 0 && (
                <span className="text-xs text-on-surface/40 py-1">No groups selected yet.</span>
              )}
              {broadcastForm.groups.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-3 py-1"
                >
                  {g}
                  <button
                    type="button"
                    onClick={() => removeGroup(g)}
                    className="hover:text-error"
                    aria-label={`Remove ${g}`}
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={draftGroup} onChange={(e) => setDraftGroup(e.target.value)}>
                <option value="">Add group…</option>
                {groupOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              <GlassButton
                type="button"
                variant="ghost"
                onClick={() => {
                  if (draftGroup) {
                    pickGroup(draftGroup);
                    setDraftGroup("");
                  }
                }}
              >
                Add
              </GlassButton>
            </div>
          </Field>

          <Field label="Message Subject">
            <Input
              placeholder="e.g. Weekly Newsletter"
              value={broadcastForm.subject}
              onChange={(e) => setBroadcastForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </Field>

          <Field label="Message Content">
            <textarea
              rows={4}
              className="w-full rounded-xl border border-white/70 bg-white/50 px-3 py-2 text-sm text-on-surface placeholder:text-on-surface/40 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              placeholder="Type your message…"
              value={broadcastForm.body}
              onChange={(e) => setBroadcastForm((f) => ({ ...f, body: e.target.value }))}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(BROADCAST_TEMPLATES).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() =>
                      setBroadcastForm((f) => ({
                        ...f,
                        subject: f.subject || t,
                        body: BROADCAST_TEMPLATES[t],
                      }))
                    }
                    className="text-[11px] rounded-full border border-white/70 px-2.5 py-1 text-on-surface/60 hover:bg-white/50"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-on-surface/40">
                {broadcastForm.body.length}/160
              </span>
            </div>
          </Field>

          {error && (
            <p className="text-xs text-error bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-on-surface/50">
              {totalRecipients > 0
                ? `Sending to ${broadcastForm.groups.length} group(s) · ${totalRecipients.toLocaleString("en-IN")} recipients`
                : "No recipients selected"}
            </span>
            <div className="flex gap-3">
              <GlassButton type="button" variant="ghost" onClick={() => setComposeOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton onClick={onSendBroadcast} disabled={saving}>
                {saving ? "Sending…" : "Send Now"}
              </GlassButton>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Confirm delete notice ──────────────────────────────── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete notice?">
        <p className="text-sm text-on-surface/70 mb-6">
          This permanently removes the announcement from the notice board.
        </p>
        <div className="flex justify-end gap-3">
          <GlassButton variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </GlassButton>
          <GlassButton variant="danger" onClick={onDeleteNotice}>
            Delete
          </GlassButton>
        </div>
      </Modal>
    </div>
  );
}