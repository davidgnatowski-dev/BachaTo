"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/icons";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: string;
  notifyAt?: string | null;
}

const STORAGE_KEY = "bachato:read-notifications:v1";
const BROWSER_KEY = "bachato:browser-notifications:v1";
const DELIVERED_KEY = "bachato:delivered-notifications:v1";

export function NotificationBell({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;
    fetch("/api/notifications")
      .then((response) => response.json())
      .then((data) => {
        try { setReadIds(new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"))); } catch { setReadIds(new Set()); }
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]));
  }, [enabled]);

  useEffect(() => {
    if (items.length === 0 || !("Notification" in window) || Notification.permission !== "granted") return;
    if (localStorage.getItem(BROWSER_KEY) !== "on") return;
    let delivered = new Set<string>();
    try { delivered = new Set(JSON.parse(localStorage.getItem(DELIVERED_KEY) ?? "[]")); } catch {}
    const timers: number[] = [];
    const now = Date.now();
    for (const item of items) {
      if (!item.notifyAt || delivered.has(item.id)) continue;
      const delay = new Date(item.notifyAt).getTime() - now;
      if (delay < -2 * 60 * 60 * 1000 || delay > 7 * 24 * 60 * 60 * 1000) continue;
      timers.push(window.setTimeout(() => {
        new Notification(item.title, { body: item.body, tag: item.id });
        delivered.add(item.id);
        try { localStorage.setItem(DELIVERED_KEY, JSON.stringify([...delivered].slice(-100))); } catch {}
      }, Math.max(0, delay)));
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [items]);

  const unread = useMemo(() => items.filter((item) => !readIds.has(item.id)).length, [items, readIds]);

  function persistRead(next: Set<string>) {
    setReadIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
  }

  function markRead(id: string) {
    persistRead(new Set([...readIds, id]));
    setOpen(false);
  }

  if (!enabled) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-zinc-300 hover:border-accent/50 hover:text-accent"
        aria-label={unread > 0 ? `Powiadomienia: ${unread} nowych` : "Powiadomienia"}
        aria-expanded={open}
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[60] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Powiadomienia</p>
              <p className="text-[11px] text-muted">Najbliższe pozycje z Twojego planu</p>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => persistRead(new Set(items.map((item) => item.id)))} className="text-[11px] font-semibold text-accent hover:text-accent-peach">
                Oznacz jako przeczytane
              </button>
            )}
          </div>
          <div className="max-h-80 divide-y divide-line overflow-y-auto">
            {items.map((item) => (
              <Link key={item.id} href={item.href} onClick={() => markRead(item.id)} className="flex gap-3 px-4 py-3 hover:bg-zinc-900">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${readIds.has(item.id) ? "bg-zinc-700" : "bg-accent"}`} />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-zinc-100">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{item.body}</span>
                </span>
              </Link>
            ))}
          </div>
          <Link href="/konto#powiadomienia" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-[11px] font-semibold text-violet hover:bg-zinc-900">Ustawienia powiadomień</Link>
        </div>
      )}
    </div>
  );
}
