"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "system" ? value : "dark";
  } catch {
    return "dark";
  }
}

function applyPreference(preference: ThemePreference) {
  const light =
    preference === "light" || (preference === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.dataset.theme = light ? "light" : "dark";
}

function setPreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Private mode: the choice still applies for this page view.
  }
  applyPreference(preference);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const onSystemChange = () => {
    if (readPreference() === "system") applyPreference("system");
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Jasny" },
  { value: "dark", label: "Ciemny" },
  { value: "system", label: "Auto" },
];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "dark" as ThemePreference);

  return (
    <div role="radiogroup" aria-label="Motyw aplikacji" className={`inline-flex rounded-full border border-line bg-zinc-950/60 p-0.5 ${className}`}>
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(option.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              active ? "bg-accent text-white" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
