"use server";

import { revalidatePath } from "next/cache";
import { addUserActivity, getUserActivity, getUserActivitySkippedKeys, removeUserActivity, setUserActivitySkipped, updateUserActivityReflection, type UserActivityRow } from "@/lib/db";
import { getCurrentUser, type AuthActionState } from "@/lib/auth";
import { toLocalIsoDate } from "@/lib/format";
import { MANUAL_ACTIVITY_TYPES, type ManualActivityType } from "@/lib/manualActivity";

function minutesBetween(start: string, end: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/;
  const s = start.match(m);
  const e = end.match(m);
  if (!s || !e) return null;
  const diff = (Number(e[1]) * 60 + Number(e[2])) - (Number(s[1]) * 60 + Number(s[2]));
  return diff > 0 ? diff : null;
}

/**
 * A hand-written journal entry — a class, practice, party or workshop you
 * attended that isn't in the catalog, or one from the past. Private to the
 * account. Writes straight to `user_activity` so it counts in stats the
 * same way a ticked catalog attendance does.
 */
export async function logManualActivity(
  _prev: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Zaloguj się, aby dodać wpis do dziennika." };

  const rawType = String(formData.get("activityType") ?? "class");
  const activityType: ManualActivityType = (MANUAL_ACTIVITY_TYPES as readonly string[]).includes(rawType)
    ? (rawType as ManualActivityType)
    : "class";

  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (title.length < 2) return { error: "Podaj nazwę aktywności." };

  const dateIso = String(formData.get("dateIso") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return { error: "Wybierz datę." };
  if (dateIso > toLocalIsoDate(new Date())) return { error: "Data nie może być w przyszłości." };

  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const durationMinutes = startTime && endTime ? minutesBetween(startTime, endTime) : null;

  const ratingRaw = Number(formData.get("rating"));
  const rating = ratingRaw >= 1 && ratingRaw <= 5 ? Math.round(ratingRaw) : null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  const key = `manual-${crypto.randomUUID()}`;
  addUserActivity(user.id, {
    key,
    classId: key,
    dateIso,
    title,
    instructor: String(formData.get("instructor") ?? "").trim().slice(0, 160) || null,
    school: String(formData.get("school") ?? "").trim().slice(0, 120) || "",
    level: String(formData.get("level") ?? "").trim().slice(0, 80) || null,
    format: "unknown",
    danceStyle: null,
    durationMinutes,
    autoMarked: false,
    activityType,
  });
  if (rating !== null || note !== null) {
    updateUserActivityReflection(user.id, key, rating, note);
  }

  revalidatePath("/podsumowanie");
  revalidatePath("/");
  return { success: true };
}

/** Mirrors a localStorage attendance check onto the logged-in user's account. No-ops silently when logged out. */
export async function syncActivity(entry: Omit<UserActivityRow, "markedAt">, active: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  if (active) addUserActivity(user.id, entry);
  else removeUserActivity(user.id, entry.key);
}

/** Removes one attendance entry from the signed-in user's account. */
export async function deleteActivity(key: string) {
  const user = await getCurrentUser();
  if (!user) return;
  removeUserActivity(user.id, key);
}

export async function syncActivitySkip(key: string, skipped: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  setUserActivitySkipped(user.id, key, skipped);
}

export async function saveActivityReflection(key: string, rating: number | null, note: string | null) {
  const user = await getCurrentUser();
  if (!user) return;
  const safeRating = rating && rating >= 1 && rating <= 5 ? Math.round(rating) : null;
  updateUserActivityReflection(user.id, key, safeRating, note?.trim().slice(0, 500) || null);
}

/** Null when logged out. Used once on mount to merge account attendance into this browser's localStorage. */
export async function fetchServerActivity(): Promise<UserActivityRow[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserActivity(user.id);
}

export async function fetchServerActivitySkippedKeys(): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserActivitySkippedKeys(user.id);
}
