"use server";

import { revalidatePath } from "next/cache";
import { saveUserPreferences, skipOnboardingSurvey, updateUserPreferences } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** No-ops silently when logged out — the survey only ever renders for a logged-in user anyway. */
export async function submitOnboardingSurvey(input: {
  levels: string[];
  formats: string[];
  days: number[];
  timeFrom: string | null;
}) {
  const user = await getCurrentUser();
  if (!user) return;
  saveUserPreferences(user.id, input);
  updateUserPreferences(user.id, {
    city: user.city,
    district: user.district,
    maxDistanceKm: user.maxDistanceKm,
    publicProfile: user.publicProfile,
    preferencesJson: JSON.stringify({
      ...user.preferences,
      level: null,
      levels: input.levels,
      formats: input.formats,
      days: input.days,
      timeFrom: input.timeFrom,
    }),
  });
  revalidatePath("/");
  revalidatePath("/konto");
  revalidatePath("/grafik");
}

export async function skipOnboardingSurveyAction() {
  const user = await getCurrentUser();
  if (!user) return;
  skipOnboardingSurvey(user.id);
  revalidatePath("/");
}
