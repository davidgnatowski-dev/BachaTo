"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "bachato:favorites:v2";

/**
 * Two distinct, independent user actions (see AGENTS spec): a heart means
 * "ulubione" (liked, might not attend), a plus means "w moim planie" (intend
 * to attend). Never conflate them — a class can be liked without being
 * planned, or planned without being liked.
 */
interface StoreData {
  likedClasses: string[];
  likedEvents: string[];
  plannedClasses: string[];
  plannedEvents: string[];
}

const EMPTY: StoreData = { likedClasses: [], likedEvents: [], plannedClasses: [], plannedEvents: [] };

let cache: StoreData = EMPTY;
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();

function readSnapshot(): StoreData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache; // stable reference when nothing changed, required by useSyncExternalStore
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      likedClasses: Array.isArray(parsed.likedClasses) ? parsed.likedClasses : [],
      likedEvents: Array.isArray(parsed.likedEvents) ? parsed.likedEvents : [],
      plannedClasses: Array.isArray(parsed.plannedClasses) ? parsed.plannedClasses : [],
      plannedEvents: Array.isArray(parsed.plannedEvents) ? parsed.plannedEvents : [],
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function getServerSnapshot(): StoreData {
  return EMPTY;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function persist(next: StoreData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage quota — favorites just won't persist across reloads.
  }
  cacheRaw = undefined; // force readSnapshot() to re-parse instead of returning the stale cached reference
  for (const listener of listeners) listener();
}

/** Class id: `${school}-${id}`. Event id: `${source}-${id}`. Kept only in this browser, no account. */
export function useFavorites() {
  const data = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  const toggle = useCallback((kind: keyof StoreData, id: string) => {
    const current = readSnapshot();
    const set = new Set(current[kind]);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    persist({ ...current, [kind]: Array.from(set) });
  }, []);

  return {
    likedClassIds: new Set(data.likedClasses),
    likedEventIds: new Set(data.likedEvents),
    plannedClassIds: new Set(data.plannedClasses),
    plannedEventIds: new Set(data.plannedEvents),
    toggleLikeClass: (id: string) => toggle("likedClasses", id),
    toggleLikeEvent: (id: string) => toggle("likedEvents", id),
    togglePlanClass: (id: string) => toggle("plannedClasses", id),
    togglePlanEvent: (id: string) => toggle("plannedEvents", id),
  };
}
