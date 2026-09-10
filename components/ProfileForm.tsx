"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile } from "@/app/konto/actions";
import type { AuthActionState } from "@/lib/auth";
import { SESSION_UPDATED_EVENT } from "@/lib/sessionEvents";

const INPUT_CLASS =
  "rounded-xl border border-line bg-zinc-950/65 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function ProfileForm({
  name,
  avatarEmoji,
  avatarUrl,
  bio,
  instagramUrl,
  facebookUrl,
}: {
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(updateProfile, {});
  const [nameValue, setNameValue] = useState(name);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [avatarEmojiValue, setAvatarEmojiValue] = useState(avatarEmoji ?? "");
  const [avatarUrlValue, setAvatarUrlValue] = useState(avatarUrl ?? "");
  const [instagramValue, setInstagramValue] = useState(instagramUrl ?? "");
  const [facebookValue, setFacebookValue] = useState(facebookUrl ?? "");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lookupMessage, setLookupMessage] = useState("");

  useEffect(() => {
    if (state?.success) window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
  }, [state]);

  async function importSocialProfile(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(normalized);
      if (!/(^|\.)(instagram|facebook)\.com$/i.test(url.hostname)) return;
      setLookupStatus("loading");
      setLookupMessage("Pobieram publiczne dane profilu…");
      const response = await fetch(`/api/social-profile?url=${encodeURIComponent(url.toString())}`);
      const data = await response.json() as { name?: string | null; description?: string | null; avatarUrl?: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Nie udało się pobrać profilu.");
      if (data.name) setNameValue(data.name);
      if (data.description) setBioValue(data.description);
      if (data.avatarUrl) {
        setAvatarUrlValue(data.avatarUrl);
        setAvatarEmojiValue("");
      }
      setLookupStatus("success");
      setLookupMessage("Dane publicznego profilu zostały uzupełnione. Możesz je poprawić przed zapisaniem.");
    } catch (error) {
      setLookupStatus("error");
      setLookupMessage(error instanceof Error ? error.message : "Nie udało się pobrać profilu.");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Avatar
          <span className="relative flex h-[42px] items-center rounded-xl border border-line bg-zinc-950/65 px-2">
            {avatarUrlValue ? (
              // eslint-disable-next-line @next/next/no-img-element -- public social profile images use short-lived external CDN URLs
              <img src={avatarUrlValue} alt="Podgląd zdjęcia profilowego" onError={() => setAvatarUrlValue("")} className="h-8 w-8 rounded-lg object-cover" />
            ) : null}
            <input
              name="avatarEmoji"
              value={avatarEmojiValue}
              onChange={(event) => setAvatarEmojiValue(event.target.value)}
              maxLength={4}
              placeholder={avatarUrlValue ? "" : "🙂"}
            aria-label="Avatar (emoji)"
              className="min-w-0 flex-1 bg-transparent text-center text-lg text-zinc-100 outline-none placeholder:text-zinc-600"
            />
          </span>
          <input type="hidden" name="avatarUrl" value={avatarUrlValue} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Imię i nazwisko
          <input name="name" value={nameValue} onChange={(event) => setNameValue(event.target.value)} required className={INPUT_CLASS} />
      </label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        O mnie
        <textarea name="bio" value={bioValue} onChange={(event) => setBioValue(event.target.value)} rows={4} placeholder="Napisz kilka słów o sobie i swoim tańcu…" className={`${INPUT_CLASS} resize-y`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Instagram
          <input
            name="instagramUrl"
            type="text"
            value={instagramValue}
            onChange={(event) => setInstagramValue(event.target.value)}
            onBlur={(event) => importSocialProfile(event.currentTarget.value)}
            onPaste={(event) => { void importSocialProfile(event.clipboardData.getData("text")); }}
            placeholder="instagram.com/twojnick"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Facebook
          <input
            name="facebookUrl"
            type="text"
            value={facebookValue}
            onChange={(event) => setFacebookValue(event.target.value)}
            onBlur={(event) => importSocialProfile(event.currentTarget.value)}
            onPaste={(event) => { void importSocialProfile(event.clipboardData.getData("text")); }}
            placeholder="facebook.com/twojprofil"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      {lookupStatus !== "idle" && (
        <p className={`text-xs ${lookupStatus === "success" ? "text-emerald-400" : lookupStatus === "error" ? "text-amber-400" : "text-muted"}`} role="status">
          {lookupMessage}
        </p>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-400">Zapisano.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Zapisywanie…" : "Zapisz profil"}
      </button>
    </form>
  );
}
