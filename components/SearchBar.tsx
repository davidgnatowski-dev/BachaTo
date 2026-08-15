"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, PinIcon } from "@/components/icons";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/grafik?q=${encodeURIComponent(q)}` : "/grafik");
  }

  return (
    <form
      id="szukaj"
      onSubmit={onSubmit}
      className="flex scroll-mt-6 flex-col gap-2 rounded-xl border border-line bg-zinc-900/60 p-2 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 rounded-full bg-black/30 px-4 py-2.5 focus-within:ring-1 focus-within:ring-accent">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj zajęć, szkół, instruktorów, wydarzeń..."
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-black/30 px-4 py-2.5 text-sm text-zinc-200 sm:w-40">
        <PinIcon className="h-4 w-4 shrink-0 text-muted" />
        Warszawa
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Szukaj
      </button>
    </form>
  );
}
