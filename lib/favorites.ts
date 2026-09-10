"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { fetchServerFavorites, syncFavorite } from "@/app/actions/favorites";
import type { FavoriteItemType, FavoriteKind } from "@/lib/db";

const STORAGE_KEY = "bachato:favorites:v2";

/**
 * Two distinct, independent user actions (see AGENTS spec): a heart means
 * "ulubione" (liked, might not attend), a plus means "w moim planie" (intend
 * to attend). Never conflate them — a class can be liked without being
 * planned, or planned without being liked.
 */
export interface FavoritesSnapshot {
  likedClasses: string[];
  likedEvents: string[];
  plannedClasses: string[];
  plannedEvents: string[];
  plannedEventSessions: string[];
}

type StoreData = FavoritesSnapshot;

const EMPTY: StoreData = { likedClasses: [], likedEvents: [], plannedClasses: [], plannedEvents: [], plannedEventSessions: [] };

const STORE_KEY_TO_SERVER: Record<keyof StoreData, [FavoriteItemType, FavoriteKind]> = {
  likedClasses: ["class", "liked"],
  likedEvents: ["event", "liked"],
  plannedClasses: ["class", "planned"],
  plannedEvents: ["event", "planned"],
  plannedEventSessions: ["event_session", "planned"],
};

function serverToStoreKey(itemType: FavoriteItemType, kind: FavoriteKind): keyof StoreData | null {
  if (itemType === "class") return kind === "liked" ? "likedClasses" : "plannedClasses";
  if (itemType === "event") return kind === "liked" ? "likedEvents" : "plannedEvents";
  if (itemType === "event_session" && kind === "planned") return "plannedEventSessions";
  return null;
}

let cache: StoreData = EMPTY;
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();
// Merging account favorites into localStorage only needs to happen once per
// page load, no matter how many components call useFavorites().
let serverMergeStarted = false;

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
      plannedEventSessions: Array.isArray(parsed.plannedEventSessions) ? parsed.plannedEventSessions : [],
    };
  } catch {
    cache = EMPTY;
  }
  return cache;
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

/**
 * Class id: `${school}-${id}`. Event id: `${source}-${id}`. Always kept in
 * this browser's localStorage; when logged in, toggles are additionally
 * mirrored to the account (fire-and-forget) and, once per page load, the
 * account's saved favorites are merged in — so likes/plans made on another
 * device show up here too, and vice versa.
 */
export function useFavorites(initialData?: FavoritesSnapshot) {
  const serverSnapshot = useMemo(() => initialData ?? EMPTY, [initialData]);
  const data = useSyncExternalStore(subscribe, readSnapshot, () => serverSnapshot);

  useEffect(() => {
    if (initialData) {
      const current = readSnapshot();
      const merged: StoreData = {
        likedClasses: Array.from(new Set([...current.likedClasses, ...initialData.likedClasses])),
        likedEvents: Array.from(new Set([...current.likedEvents, ...initialData.likedEvents])),
        plannedClasses: Array.from(new Set([...current.plannedClasses, ...initialData.plannedClasses])),
        plannedEvents: Array.from(new Set([...current.plannedEvents, ...initialData.plannedEvents])),
        plannedEventSessions: Array.from(new Set([...current.plannedEventSessions, ...initialData.plannedEventSessions])),
      };
      persist(merged);
    }
    if (serverMergeStarted) return;
    serverMergeStarted = true;
    fetchServerFavorites()
      .then((favorites) => {
        if (!favorites || favorites.length === 0) return;
        const current = readSnapshot();
        const next: StoreData = { ...current };
        for (const fav of favorites) {
          const key = serverToStoreKey(fav.itemType, fav.kind);
          if (!key) continue;
          const set = new Set(next[key]);
          set.add(fav.itemId);
          next[key] = Array.from(set);
        }
        persist(next);
      })
      .catch(() => {
        // Logged-out visitors and network hiccups just keep local-only favorites.
      });
  }, [initialData]);

  const toggle = useCallback((kind: keyof StoreData, id: string) => {
    const current = readSnapshot();
    const set = new Set(current[kind]);
    const nextActive = !set.has(id);
    if (nextActive) set.add(id);
    else set.delete(id);
    persist({ ...current, [kind]: Array.from(set) });

    const [itemType, favKind] = STORE_KEY_TO_SERVER[kind];
    syncFavorite(itemType, id, favKind, nextActive).catch(() => {
      // Best-effort account sync — the local toggle above already succeeded.
    });
  }, []);

  return {
    likedClassIds: new Set(data.likedClasses),
    likedEventIds: new Set(data.likedEvents),
    plannedClassIds: new Set(data.plannedClasses),
    plannedEventIds: new Set(data.plannedEvents),
    plannedEventSessionIds: new Set(data.plannedEventSessions),
    toggleLikeClass: (id: string) => toggle("likedClasses", id),
    toggleLikeEvent: (id: string) => toggle("likedEvents", id),
    togglePlanClass: (id: string) => toggle("plannedClasses", id),
    togglePlanEvent: (id: string) => toggle("plannedEvents", id),
    togglePlanEventSession: (id: string) => toggle("plannedEventSessions", id),
  };
}
