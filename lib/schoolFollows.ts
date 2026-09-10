"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { fetchServerFavorites, syncFavorite } from "@/app/actions/favorites";

const STORAGE_KEY = "bachato:followed-schools:v1";

interface StoreData {
  schools: string[];
}

const EMPTY: StoreData = { schools: [] };

let cache: StoreData = EMPTY;
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();
let serverMergeStarted = false;

function readSnapshot(): StoreData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = { schools: Array.isArray(parsed.schools) ? parsed.schools : [] };
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
    // Private browsing / storage quota — follows just won't persist across reloads.
  }
  cacheRaw = undefined;
  for (const listener of listeners) listener();
}

/** Same account-sync pattern as useFavorites/useActivity — local-first, mirrored to the account when logged in. */
export function useSchoolFollow(schoolName: string) {
  const data = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  useEffect(() => {
    if (serverMergeStarted) return;
    serverMergeStarted = true;
    fetchServerFavorites()
      .then((favorites) => {
        if (!favorites) return;
        const followedSchools = favorites.filter((f) => f.itemType === "school" && f.kind === "followed").map((f) => f.itemId);
        if (followedSchools.length === 0) return;
        const current = readSnapshot();
        const set = new Set(current.schools);
        for (const name of followedSchools) set.add(name);
        persist({ schools: Array.from(set) });
      })
      .catch(() => {});
  }, []);

  const isFollowing = data.schools.includes(schoolName);

  const toggle = useCallback(() => {
    const current = readSnapshot();
    const set = new Set(current.schools);
    const nextActive = !set.has(schoolName);
    if (nextActive) set.add(schoolName);
    else set.delete(schoolName);
    persist({ schools: Array.from(set) });
    syncFavorite("school", schoolName, "followed", nextActive).catch(() => {});
  }, [schoolName]);

  return { isFollowing, toggle };
}
