"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createUserClass,
  deleteUserClass,
  getUserByEmail,
  updateUserNotificationPreferences,
  saveUserPreferences,
  updateUserPassword,
  updateUserProfile,
  updateUserPreferences,
} from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword, endSession, type AuthActionState } from "@/lib/auth";
import type { ClassFormat } from "@/lib/types";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function updateNotifications(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  const allowedMinutes = [60, 180, 1440];
  const rawMinutes = Number(field(formData, "reminderMinutes"));
  await updateUserNotificationPreferences(user.id, {
    plannedClasses: formData.get("plannedClasses") === "on",
    plannedEvents: formData.get("plannedEvents") === "on",
    followed: formData.get("followed") === "on",
    reminderMinutes: allowedMinutes.includes(rawMinutes) ? rawMinutes : 60,
  });
  revalidatePath("/konto");
  return { success: true };
}

/** Empty stays null; a bare domain gets "https://" prefixed so the stored value is always a usable link. */
function urlField(formData: FormData, name: string): string | null {
  const raw = field(formData, name);
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function imageUrlField(formData: FormData, name: string): string | null {
  const raw = field(formData, name);
  if (!raw) return null;
  if (/^\/uploads\/avatars\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(raw) && raw.length <= 255) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && raw.length <= 2048 ? raw : null;
  } catch {
    return null;
  }
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function updateProfile(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const name = field(formData, "name");
  if (!name) return { error: "Podaj imię." };

  const avatarEmoji = field(formData, "avatarEmoji").slice(0, 4) || null;
  const avatarUrl = imageUrlField(formData, "avatarUrl");
  const bio = field(formData, "bio") || null;
  const instagramUrl = urlField(formData, "instagramUrl");
  const facebookUrl = urlField(formData, "facebookUrl");

  await updateUserProfile(user.id, { name, avatarEmoji, avatarUrl, bio, instagramUrl, facebookUrl });
  revalidatePath("/konto");
  return { success: true };
}

export async function updatePreferences(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const allowedFormats: ClassFormat[] = ["partner", "solo"];
  const allowedLevels = ["beginner", "basic", "intermediate", "advanced", "open"];
  const levels = formData.getAll("levels").map(String).filter((item) => allowedLevels.includes(item));
  const formats = formData.getAll("formats").map(String).filter((item): item is ClassFormat => allowedFormats.includes(item as ClassFormat));
  const days = formData.getAll("days").map(Number).filter((item) => Number.isInteger(item) && item >= 1 && item <= 7);
  const styles = formData.getAll("styles").map(String).map((item) => item.trim()).filter(Boolean).slice(0, 12);
  const maxDistanceRaw = Number(field(formData, "maxDistanceKm"));
  const timeFromRaw = field(formData, "timeFrom");
  const timeFrom = /^\d{2}:\d{2}$/.test(timeFromRaw) ? timeFromRaw : null;

  await saveUserPreferences(user.id, { levels, formats, days, timeFrom });

  await updateUserPreferences(user.id, {
    city: field(formData, "city") || null,
    district: field(formData, "district") || null,
    maxDistanceKm: Number.isFinite(maxDistanceRaw) && maxDistanceRaw > 0 ? Math.min(100, maxDistanceRaw) : null,
    publicProfile: formData.get("publicProfile") === "on",
    preferencesJson: JSON.stringify({
      level: null,
      levels,
      formats,
      styles,
      days,
      timeFrom,
    }),
  });
  revalidatePath("/");
  revalidatePath("/konto");
  revalidatePath("/grafik");
  return { success: true };
}

export async function changePassword(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const currentPassword = field(formData, "currentPassword");
  const newPassword = field(formData, "newPassword");
  const confirmPassword = field(formData, "confirmPassword");

  const row = await getUserByEmail(user.email);
  if (!row || !verifyPassword(currentPassword, row.passwordHash)) {
    return { error: "Obecne hasło jest nieprawidłowe." };
  }
  if (newPassword.length < 8) return { error: "Nowe hasło musi mieć co najmniej 8 znaków." };
  if (newPassword !== confirmPassword) return { error: "Nowe hasła nie są takie same." };

  await updateUserPassword(user.id, hashPassword(newPassword));
  return { success: true };
}

const FORMATS: ClassFormat[] = ["partner", "solo", "unknown"];

export async function addUserClass(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const title = field(formData, "title");
  if (!title) return { error: "Podaj nazwę zajęć." };

  const recurrence = field(formData, "recurrence");
  const dayOfWeek = /^[1-7]$/.test(recurrence) ? Number(recurrence) : null;
  const specificDate = recurrence === "once" ? field(formData, "specificDate") || null : null;
  if (!dayOfWeek && !specificDate) {
    return { error: "Wybierz dzień tygodnia albo podaj konkretną datę." };
  }

  const rawFormat = field(formData, "format");
  const format = (FORMATS as string[]).includes(rawFormat) ? (rawFormat as ClassFormat) : "unknown";

  await createUserClass(user.id, {
    title,
    danceStyle: field(formData, "danceStyle") || null,
    level: field(formData, "level") || null,
    format,
    instructor: field(formData, "instructor") || null,
    schoolName: field(formData, "schoolName") || null,
    location: field(formData, "location") || null,
    description: field(formData, "description") || null,
    dayOfWeek,
    specificDate,
    startTime: field(formData, "startTime") || null,
    endTime: field(formData, "endTime") || null,
    sourceUrl: field(formData, "sourceUrl") || null,
  });

  revalidatePath("/konto");
  redirect("/konto");
}

export async function deleteUserClassAction(classId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  await deleteUserClass(classId, user.id);
  revalidatePath("/konto");
}
