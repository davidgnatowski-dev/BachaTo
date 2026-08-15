"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ClassFormat, ClassRow } from "./types";
import { toLocalIsoDate } from "./format";

const STORAGE_KEY = "bachato:activity:v1";

/**
 * One confirmed attendance at a specific occurrence of a class — richer than
 * a favorites id because this is the raw material for future stats (hours
 * danced, most common instructor/school/level, BachaTo Wrapped) without a
 * user account. Keyed by class id + occurrence date so attending the same
 * weekly class on different weeks creates separate entries.
 */
export interface ActivityEntry {
  key: string; // `${school}-${id}__${dateIso}`
  classId: string; // `${school}-${id}`
  dateIso: string;
  title: string;
  instructor?: string;
  school: string;
  level?: string;
  format: ClassFormat;
  durationMinutes?: number;
  type: "class";
  markedAt: string; // ISO datetime the checkbox was ticked
}

interface StoreData {
  entries: ActivityEntry[];
}

const EMPTY: StoreData = { entries: [] };

let cache: StoreData = EMPTY;
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();

function readSnapshot(): StoreData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
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
    // Private browsing / storage quota — activity just won't persist across reloads.
  }
  cacheRaw = undefined;
  for (const listener of listeners) listener();
}

function durationMinutes(row: ClassRow): number | undefined {
  if (!row.startTime || !row.endTime) return undefined;
  const [sh, sm] = row.startTime.split(":").map(Number);
  const [eh, em] = row.endTime.split(":").map(Number);
  const diff = eh * 60 + em - (sh * 60 + sm);
  return diff > 0 ? diff : undefined;
}

/** Attendance is only offered once the occurrence has actually started. */
export function attendanceKey(row: ClassRow, occurrence: Date): string {
  return `${row.school}-${row.id}__${toLocalIsoDate(occurrence)}`;
}

/** Only in this browser, no account — see AGENTS spec for the future account-sync plan. */
export function useActivity() {
  const data = useSyncExternalStore(subscribe, readSnapshot, getServerSnapshot);

  const setAttended = useCallback((row: ClassRow, occurrence: Date, attended: boolean) => {
    const current = readSnapshot();
    const key = attendanceKey(row, occurrence);
    const withoutKey = current.entries.filter((e) => e.key !== key);
    if (!attended) {
      persist({ entries: withoutKey });
      return;
    }
    const entry: ActivityEntry = {
      key,
      classId: `${row.school}-${row.id}`,
      dateIso: toLocalIsoDate(occurrence),
      title: row.title,
      instructor: row.instructor,
      school: row.school,
      level: row.level,
      format: row.format,
      durationMinutes: durationMinutes(row),
      type: "class",
      markedAt: new Date().toISOString(),
    };
    persist({ entries: [...withoutKey, entry] });
  }, []);

  return {
    entries: data.entries,
    attendedKeys: new Set(data.entries.map((e) => e.key)),
    isAttended: (row: ClassRow, occurrence: Date) => data.entries.some((e) => e.key === attendanceKey(row, occurrence)),
    setAttended,
  };
}
