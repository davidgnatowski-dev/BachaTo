"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { SearchIcon } from "@/components/icons";

interface Suggestion {
  id: string;
  label: string;
  meta: string;
  href: string;
  kind: "class" | "event" | "instructor" | "school";
}

const KIND_LABELS = { class: "Zajęcia", event: "Wydarzenie", instructor: "Instruktor", school: "Szkoła" } as const;

export function SearchAutocomplete({
  defaultValue = "",
  placeholder = "Szukaj zajęć, szkół, instruktorów, wydarzeń...",
  rounded = "rounded-full",
}: {
  defaultValue?: string;
  placeholder?: string;
  rounded?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          setSuggestions(Array.isArray(data) ? data : []);
          setActiveIndex(-1);
        })
        .catch(() => {});
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      router.push(suggestions[activeIndex].href);
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className={`flex items-center gap-2 border border-line bg-black/30 px-4 py-2.5 focus-within:border-accent/60 focus-within:ring-1 focus-within:ring-accent/30 ${rounded}`}>
        <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setOpen(true);
            if (value.trim().length < 2) {
              setSuggestions([]);
              setActiveIndex(-1);
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          className="min-w-0 w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 top-full z-[70] mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-zinc-950 p-1.5 shadow-2xl">
          {suggestions.map((suggestion, index) => (
            <Link
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              key={suggestion.id}
              href={suggestion.href}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setOpen(false)}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${index === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
            >
              <span className="mt-0.5 w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-violet">{KIND_LABELS[suggestion.kind]}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-zinc-100">{suggestion.label}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{suggestion.meta}</span>
              </span>
            </Link>
          ))}
          <Link href={`/szukaj?q=${encodeURIComponent(query.trim())}`} className="mt-1 block rounded-lg border-t border-line px-3 py-2 text-center text-xs font-semibold text-accent hover:bg-zinc-900">
            Zobacz wszystkie wyniki →
          </Link>
        </div>
      )}
    </div>
  );
}
