"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchServerFavorites, syncFavorite } from "@/app/actions/favorites";

const STORAGE_KEY = "bachato:followed-instructors:v1";
let cache: string[] = [];
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();
let mergeStarted = false;

function snapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try { const parsed = JSON.parse(raw ?? "[]"); cache = Array.isArray(parsed) ? parsed : []; } catch { cache = []; }
  return cache;
}
function serverSnapshot() { return [] as string[]; }
function subscribe(callback: () => void) { listeners.add(callback); window.addEventListener("storage", callback); return () => { listeners.delete(callback); window.removeEventListener("storage", callback); }; }
function persist(next: string[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {} cacheRaw = undefined; listeners.forEach((listener) => listener()); }

export function useInstructorFollow(name: string) {
  const followed = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    if (mergeStarted) return;
    mergeStarted = true;
    fetchServerFavorites().then((items) => {
      if (!items) return;
      const serverNames = items.filter((item) => item.itemType === "instructor" && item.kind === "followed").map((item) => item.itemId);
      persist(Array.from(new Set([...snapshot(), ...serverNames])));
    }).catch(() => {});
  }, []);
  const isFollowing = followed.includes(name);
  const toggle = useCallback(() => {
    const next = new Set(snapshot());
    const active = !next.has(name);
    if (active) next.add(name); else next.delete(name);
    persist([...next]);
    syncFavorite("instructor", name, "followed", active).catch(() => {});
  }, [name]);
  return { isFollowing, toggle };
}

