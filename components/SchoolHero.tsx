"use client";

import Link from "next/link";
import type { School } from "@/lib/types";
import { useSchoolFollow } from "@/lib/schoolFollows";
import { SchoolIcon, HeartIcon, ShareIcon, PinIcon } from "@/components/icons";
import { schoolTextClass } from "@/lib/schedule";

export function SchoolHero({
  school,
  address,
  styles,
  logoUrl,
  coverImageUrl,
}: {
  school: School;
  address?: string;
  styles: string[];
  logoUrl?: string;
  coverImageUrl?: string;
}) {
  const { isFollowing, toggle } = useSchoolFollow(school);

  async function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: school, url });
      } catch {
        // User cancelled the native share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard unavailable — silently ignore rather than break the page.
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-zinc-900/60">
      <div className="relative aspect-[16/7.5] w-full bg-zinc-800 sm:aspect-[21/7.5]">
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
          <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-violet/10">
            <SchoolIcon className="h-12 w-12 text-violet/50" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="flex items-start gap-4">
          {logoUrl ? (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-background bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school */}
              <img src={logoUrl} alt="" className="h-full w-full object-contain" />
            </span>
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-background bg-zinc-800 text-violet">
              <SchoolIcon className="h-8 w-8" />
            </span>
          )}
          <div className="min-w-0 flex-1 pt-1">
            <h1 className={`font-heading text-2xl font-bold leading-tight sm:text-3xl ${schoolTextClass(school)}`}>{school}</h1>
            {address && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-muted">
                <PinIcon className="h-4 w-4 shrink-0" />
                {address}
              </p>
            )}
          </div>
        </div>

        {styles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <span key={style} className="rounded-full bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300">
                {style}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/grafik?school=${encodeURIComponent(school)}`}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark"
          >
            Zobacz grafik
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isFollowing}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isFollowing
                ? "border-violet/50 bg-violet/15 text-violet"
                : "border-line bg-transparent text-foreground/80 hover:border-zinc-500"
            }`}
          >
            <HeartIcon className="h-3.5 w-3.5" filled={isFollowing} />
            {isFollowing ? "Obserwujesz" : "Obserwuj"}
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label="Udostępnij"
            title="Udostępnij"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-transparent text-foreground/80 hover:border-zinc-500"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
