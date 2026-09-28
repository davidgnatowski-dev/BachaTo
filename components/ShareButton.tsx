"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

/**
 * Native share sheet on phones (Instagram, WhatsApp, Messenger…), copy-link
 * fallback on desktop. `path` is app-relative so the link always points at
 * whichever host the visitor is on.
 */
export function ShareButton({ title, text, path, className = "" }: { title: string; text?: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text ? `${text}\n${url}` : url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing sensible to fall back to.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-accent/50 hover:text-accent ${className}`}
    >
      <ShareIcon className="h-4 w-4" />
      {copied ? "Skopiowano link ✓" : "Udostępnij"}
    </button>
  );
}
