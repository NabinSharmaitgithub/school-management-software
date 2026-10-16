"use client";

import { useEffect, useRef, useState } from "react";
import { addNotification, listNotifications, markAllNotificationsRead } from "@/lib/data";
import type { NotificationItem } from "@/lib/data";
import { GlassButton, Input, Modal } from "@/components/ui";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [compose, setCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setItems(await listNotifications());
    } catch {
      /* auth guard shows login; keep silent */
    }
  }

  useEffect(() => {
    load();
    const onDoc = (e: MouseEvent) => {
      if (open && boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await addNotification({ title: title.trim(), body: body.trim() || undefined, read: false });
    setTitle("");
    setBody("");
    setCompose(false);
    setSaving(false);
    load();
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="glass-btn-ghost w-10 h-10 rounded-full flex items-center justify-center text-on-surface/70 relative"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-panel p-3 z-50 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-on-surface">Notifications</p>
            <div className="flex items-center gap-2">
              {items.some((n) => !n.read) && (
                <button
                  onClick={async () => {
                    await markAllNotificationsRead();
                    load();
                  }}
                  className="text-xs text-primary hover:text-tertiary"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setCompose(true)}
                className="glass-btn-ghost w-7 h-7 rounded-md flex items-center justify-center text-on-surface/60 hover:text-primary text-sm"
                aria-label="Broadcast"
              >
                <span className="material-symbols-outlined text-base">add_alert</span>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-on-surface/60 text-center py-6">No notifications yet.</p>
            ) : (
              items.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg p-3 border ${
                    n.read ? "bg-white/30 border-white/40" : "bg-primary/10 border-primary/20"
                  }`}
                >
                  <p className="text-sm font-medium text-on-surface">{n.title}</p>
                  {n.body && <p className="text-xs text-on-surface/60 mt-0.5">{n.body}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Modal open={compose} onClose={() => setCompose(false)} title="Broadcast notification">
        <form className="space-y-4" onSubmit={onSend}>
          <div className="space-y-4">
            <Input
              placeholder="Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              placeholder="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton type="button" variant="ghost" onClick={() => setCompose(false)}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" disabled={saving}>
              {saving ? "Sending…" : "Send"}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}