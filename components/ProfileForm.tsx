"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(updateProfile, {});
  const [nameValue, setNameValue] = useState(name);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [avatarEmojiValue, setAvatarEmojiValue] = useState(avatarEmoji ?? "");
  const [avatarUrlValue, setAvatarUrlValue] = useState(avatarUrl ?? "");
  const [instagramValue, setInstagramValue] = useState(instagramUrl ?? "");
  const [facebookValue, setFacebookValue] = useState(facebookUrl ?? "");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "removing" | "error">("idle");
  const [avatarMessage, setAvatarMessage] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarStatus("error");
      setAvatarMessage("Wybierz zdjęcie JPG, PNG lub WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarStatus("error");
      setAvatarMessage("Zdjęcie może mieć maksymalnie 5 MB.");
      return;
    }

    setAvatarStatus("uploading");
    setAvatarMessage("");
    const body = new FormData();
    body.set("avatar", file);
    try {
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const data = await response.json() as { avatarUrl?: string; error?: string };
      if (!response.ok || !data.avatarUrl) throw new Error(data.error || "Nie udało się przesłać zdjęcia.");
      setAvatarUrlValue(data.avatarUrl);
      setAvatarEmojiValue("");
      setAvatarStatus("idle");
      setAvatarMessage("Zdjęcie profilowe zostało zaktualizowane.");
      window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
      router.refresh();
    } catch (error) {
      setAvatarStatus("error");
      setAvatarMessage(error instanceof Error ? error.message : "Nie udało się przesłać zdjęcia.");
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setAvatarStatus("removing");
    setAvatarMessage("");
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Nie udało się usunąć zdjęcia.");
      setAvatarUrlValue("");
      setAvatarStatus("idle");
      setAvatarMessage("Zdjęcie profilowe zostało usunięte.");
      window.dispatchEvent(new Event(SESSION_UPDATED_EVENT));
      router.refresh();
    } catch (error) {
      setAvatarStatus("error");
      setAvatarMessage(error instanceof Error ? error.message : "Nie udało się usunąć zdjęcia.");
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-zinc-950/35 p-4" aria-labelledby="profile-photo-heading">
        <h3 id="profile-photo-heading" className="text-sm font-semibold text-zinc-100">Zdjęcie profilowe</h3>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet/25 bg-zinc-900 text-3xl text-zinc-400">
            {avatarUrlValue ? (
              // eslint-disable-next-line @next/next/no-img-element -- accepts a local upload or a public social-profile image
              <img src={avatarUrlValue} alt="Podgląd zdjęcia profilowego" className="h-full w-full object-cover" />
            ) : avatarEmojiValue ? avatarEmojiValue : "🙂"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarStatus === "uploading" || avatarStatus === "removing"} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">
                {avatarStatus === "uploading" ? "Przesyłanie…" : "Wybierz zdjęcie"}
              </button>
              {avatarUrlValue && (
                <button type="button" onClick={() => void removeAvatar()} disabled={avatarStatus === "uploading" || avatarStatus === "removing"} className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-60">
                  {avatarStatus === "removing" ? "Usuwanie…" : "Usuń zdjęcie"}
                </button>
              )}
            </div>
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0])} className="sr-only" aria-label="Wybierz zdjęcie profilowe" />
            <p className="mt-2 text-xs text-muted">JPG, PNG lub WebP, maksymalnie 5 MB</p>
            {avatarMessage && <p className={`mt-2 text-xs ${avatarStatus === "error" ? "text-red-400" : "text-emerald-400"}`} role="status">{avatarMessage}</p>}
          </div>
        </div>
        <input type="hidden" name="avatarUrl" value={avatarUrlValue} />
      </section>

      <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
          Avatar emoji
          <input
            name="avatarEmoji"
            value={avatarEmojiValue}
            onChange={(event) => setAvatarEmojiValue(event.target.value)}
            maxLength={4}
            placeholder="🙂"
            aria-label="Avatar (emoji)"
            className={`${INPUT_CLASS} text-center text-lg`}
          />
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
        <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
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
          <button type="button" onClick={() => void importSocialProfile(instagramValue)} disabled={!instagramValue.trim() || lookupStatus === "loading"} className="w-fit text-xs font-semibold text-accent hover:text-accent-peach disabled:cursor-not-allowed disabled:opacity-50">Pobierz dane i zdjęcie</button>
        </div>
        <div className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
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
          <button type="button" onClick={() => void importSocialProfile(facebookValue)} disabled={!facebookValue.trim() || lookupStatus === "loading"} className="w-fit text-xs font-semibold text-accent hover:text-accent-peach disabled:cursor-not-allowed disabled:opacity-50">Pobierz dane i zdjęcie</button>
        </div>
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
