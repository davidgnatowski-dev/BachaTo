"use server";

import { getCurrentUser } from "@/lib/auth";
import { createEventSubmission } from "@/lib/db";

export interface SubmissionState {
  ok: boolean;
  message: string;
}

export async function submitEventRequest(_previous: SubmissionState, formData: FormData): Promise<SubmissionState> {
  const user = await getCurrentUser();
  const kindValue = String(formData.get("kind") ?? "new");
  const kind = kindValue === "correction" || kindValue === "claim" ? kindValue : "new";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase().slice(0, 200);
  const eventTitle = String(formData.get("eventTitle") ?? "").trim().slice(0, 200);
  const eventUrl = String(formData.get("eventUrl") ?? "").trim().slice(0, 500);
  const eventKey = String(formData.get("eventKey") ?? "").trim().slice(0, 240);
  const message = String(formData.get("message") ?? "").trim().slice(0, 3000);

  if (!/^\S+@\S+\.\S+$/.test(contactEmail)) return { ok: false, message: "Podaj poprawny adres e-mail." };
  if (eventTitle.length < 3) return { ok: false, message: "Podaj nazwę wydarzenia." };
  if (message.length < 10) return { ok: false, message: "Napisz krótko, co chcesz dodać lub poprawić." };

  await createEventSubmission({
    userId: user?.id ?? null,
    kind,
    eventKey: eventKey || null,
    contactEmail,
    eventTitle,
    eventUrl: eventUrl || null,
    message,
  });
  return { ok: true, message: "Dziękujemy. Zgłoszenie trafiło do moderacji." };
}
