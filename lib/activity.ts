"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { ClassFormat, ClassRow } from "./types";
import { toLocalIsoDate } from "./format";
import { deleteActivity, fetchServerActivity, fetchServerActivitySkippedKeys, saveActivityReflection, syncActivity, syncActivitySkip } from "@/app/actions/activity";

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
  danceStyle?: string;
  durationMinutes?: number;
  type: "class";
  /** Hand-logged journal entries carry a kind: "class" | "practice" | "party" | "workshop". Undefined = catalog attendance. */
  activityType?: string;
  markedAt: string; // ISO datetime the checkbox was ticked
  autoMarked?: boolean;
  rating?: number;
  note?: string;
}

interface StoreData {
  entries: ActivityEntry[];
  skippedKeys: string[];
}

const EMPTY: StoreData = { entries: [], skippedKeys: [] };

let cache: StoreData = EMPTY;
let cacheRaw: string | null | undefined;
const listeners = new Set<() => void>();
// Merging account activity into localStorage only needs to happen once per
// page load, no matter how many components call useActivity().
let serverMergeStarted = false;

function readSnapshot(): StoreData {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    cache = {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      skippedKeys: Array.isArray(parsed.skippedKeys) ? parsed.skippedKeys : [],
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

/**
 * Always kept in this browser's localStorage; when logged in, checking
 * "Byłem/am na tych zajęciach" is additionally mirrored to the account
 * (fire-and-forget) and, once per page load, the account's saved attendance
 * is merged in — so /podsumowanie stats survive a cleared browser or a
 * second device.
 */
export function useActivity(initialEntries?: ActivityEntry[]) {
  const [ready, setReady] = useState(serverMergeStarted);
  const serverSnapshot = useMemo<StoreData>(() => ({ entries: initialEntries ?? [], skippedKeys: [] }), [initialEntries]);
  const data = useSyncExternalStore(subscribe, readSnapshot, () => serverSnapshot);

  useEffect(() => {
    if (initialEntries && initialEntries.length > 0) {
      const current = readSnapshot();
      const byKey = new Map(current.entries.map((entry) => [entry.key, entry]));
      for (const entry of initialEntries) byKey.set(entry.key, entry);
      persist({ ...current, entries: Array.from(byKey.values()) });
    }
    if (serverMergeStarted) return;
    serverMergeStarted = true;
    Promise.all([fetchServerActivity(), fetchServerActivitySkippedKeys()])
      .then(([serverEntries, serverSkippedKeys]) => {
        const current = readSnapshot();
        const existingKeys = new Set(current.entries.map((e) => e.key));
        const toAdd: ActivityEntry[] = serverEntries
          ? serverEntries
          .filter((e) => !existingKeys.has(e.key))
          .map((e) => ({
            key: e.key,
            classId: e.classId,
            dateIso: e.dateIso,
            title: e.title,
            instructor: e.instructor ?? undefined,
            school: e.school,
            level: e.level ?? undefined,
            format: e.format,
            danceStyle: e.danceStyle ?? undefined,
            durationMinutes: e.durationMinutes ?? undefined,
            type: "class",
            activityType: e.activityType ?? undefined,
            markedAt: e.markedAt,
            autoMarked: e.autoMarked ?? false,
            rating: e.rating ?? undefined,
            note: e.note ?? undefined,
          }))
          : [];
        const skippedKeys = Array.from(new Set([...current.skippedKeys, ...(serverSkippedKeys ?? [])]));
        if (toAdd.length > 0 || skippedKeys.length !== current.skippedKeys.length) {
          persist({ entries: [...current.entries, ...toAdd], skippedKeys });
        }
      })
      .catch(() => {
        // Logged-out visitors and network hiccups just keep local-only activity.
      })
      .finally(() => setReady(true));
  }, [initialEntries]);

  const setAttended = useCallback((row: ClassRow, occurrence: Date, attended: boolean, options?: { autoMarked?: boolean }) => {
    const current = readSnapshot();
    const key = attendanceKey(row, occurrence);
    const withoutKey = current.entries.filter((e) => e.key !== key);
    if (!attended) {
      persist({ ...current, entries: withoutKey });
      syncActivity(
        {
          key,
          classId: `${row.school}-${row.id}`,
          dateIso: toLocalIsoDate(occurrence),
          title: row.title,
          instructor: row.instructor ?? null,
          school: row.school,
          level: row.level ?? null,
          format: row.format,
          danceStyle: row.danceStyle ?? null,
          durationMinutes: durationMinutes(row) ?? null,
        },
        false
      ).catch(() => {});
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
      danceStyle: row.danceStyle,
      durationMinutes: durationMinutes(row),
      type: "class",
      markedAt: new Date().toISOString(),
      autoMarked: options?.autoMarked ?? false,
    };
    persist({ entries: [...withoutKey, entry], skippedKeys: current.skippedKeys.filter((item) => item !== key) });
    syncActivitySkip(key, false).catch(() => {});
    syncActivity(
      {
        key: entry.key,
        classId: entry.classId,
        dateIso: entry.dateIso,
        title: entry.title,
        instructor: entry.instructor ?? null,
        school: entry.school,
        level: entry.level ?? null,
        format: entry.format,
        danceStyle: entry.danceStyle ?? null,
        durationMinutes: entry.durationMinutes ?? null,
        autoMarked: entry.autoMarked,
      },
      true
    ).catch(() => {
      // Best-effort account sync — the local toggle above already succeeded.
    });
  }, []);

  const confirmEntry = useCallback((key: string) => {
    const current = readSnapshot();
    const entry = current.entries.find((item) => item.key === key);
    if (!entry) return;
    const confirmed = { ...entry, autoMarked: false, markedAt: new Date().toISOString() };
    persist({ ...current, entries: current.entries.map((item) => item.key === key ? confirmed : item) });
    syncActivity({
      key: confirmed.key,
      classId: confirmed.classId,
      dateIso: confirmed.dateIso,
      title: confirmed.title,
      instructor: confirmed.instructor ?? null,
      school: confirmed.school,
      level: confirmed.level ?? null,
      format: confirmed.format,
      danceStyle: confirmed.danceStyle ?? null,
      durationMinutes: confirmed.durationMinutes ?? null,
      autoMarked: false,
    }, true).catch(() => {});
  }, []);

  const markEntrySkipped = useCallback((key: string) => {
    const current = readSnapshot();
    persist({
      entries: current.entries.filter((entry) => entry.key !== key),
      skippedKeys: Array.from(new Set([...current.skippedKeys, key])),
    });
    syncActivitySkip(key, true).catch(() => {});
  }, []);

  const removeEntry = useCallback(async (key: string) => {
    const current = readSnapshot();
    const removed = current.entries.find((entry) => entry.key === key);
    if (!removed) return;

    persist({ ...current, entries: current.entries.filter((entry) => entry.key !== key) });
    try {
      await deleteActivity(key);
    } catch (error) {
      const latest = readSnapshot();
      if (!latest.entries.some((entry) => entry.key === key)) {
        persist({ ...latest, entries: [...latest.entries, removed] });
      }
      throw error;
    }
  }, []);

  const updateReflection = useCallback(async (key: string, rating: number | null, note: string) => {
    const current = readSnapshot();
    const previous = current.entries.find((entry) => entry.key === key);
    if (!previous) return;
    const cleanedNote = note.trim().slice(0, 500);
    persist({ ...current, entries: current.entries.map((entry) => entry.key === key ? { ...entry, rating: rating ?? undefined, note: cleanedNote || undefined } : entry) });
    try {
      await saveActivityReflection(key, rating, cleanedNote || null);
    } catch (error) {
      const latest = readSnapshot();
      persist({ ...latest, entries: latest.entries.map((entry) => entry.key === key ? previous : entry) });
      throw error;
    }
  }, []);

  return {
    ready,
    entries: data.entries,
    attendedKeys: new Set(data.entries.map((e) => e.key)),
    skippedKeys: new Set(data.skippedKeys),
    isAttended: (row: ClassRow, occurrence: Date) => data.entries.some((e) => e.key === attendanceKey(row, occurrence)),
    setAttended,
    confirmEntry,
    markEntrySkipped,
    removeEntry,
    updateReflection,
  };
}
