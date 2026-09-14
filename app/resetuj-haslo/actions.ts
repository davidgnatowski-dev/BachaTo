"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createPasswordReset, getPasswordReset, getUserByEmail, markPasswordResetUsed, updateUserPassword } from "@/lib/db";
import { hashPassword, startSession, type AuthActionState, type ResetRequestState } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const RESET_TOKEN_MINUTES = 30;
// Generic on purpose — never confirm whether an email is registered.
const GENERIC_MESSAGE = "Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy na niego link do zresetowania hasła.";

export async function requestPasswordReset(
  _prevState: ResetRequestState | undefined,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { error: "Podaj adres e-mail." };

  const rateLimit = checkRateLimit(`reset:${email}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return { error: "Zbyt wiele próśb o reset dla tego adresu. Spróbuj ponownie później." };
  }

  const user = await getUserByEmail(email);
  if (!user) return { message: GENERIC_MESSAGE };

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000).toISOString();
  await createPasswordReset(user.id, token, expiresAt);

  // Until an email service is configured, expose the link only during local development.
  // Returning it in production would let anyone reset a known user's password.
  if (process.env.NODE_ENV !== "production") {
    return { message: GENERIC_MESSAGE, devResetUrl: `/resetuj-haslo/${token}` };
  }
  return { message: GENERIC_MESSAGE };
}

export async function confirmPasswordReset(
  token: string,
  _prevState: AuthActionState | undefined,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { error: "Hasło musi mieć co najmniej 8 znaków." };
  if (password !== confirmPassword) return { error: "Hasła nie są takie same." };

  const reset = await getPasswordReset(token);
  if (!reset || reset.used || new Date(reset.expiresAt).getTime() < Date.now()) {
    return { error: "Ten link do resetu hasła jest nieprawidłowy lub wygasł. Poproś o nowy." };
  }

  await updateUserPassword(reset.userId, hashPassword(password));
  await markPasswordResetUsed(token);
  await startSession(reset.userId);
  redirect("/konto");
}
