"use server";

import { redirect } from "next/navigation";
import { createUser, getUserByEmail } from "@/lib/db";
import { hashPassword, startSession, type AuthActionState } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password) {
    return { error: "Uzupełnij wszystkie pola." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Podaj prawidłowy adres e-mail." };
  }
  if (password.length < 8) {
    return { error: "Hasło musi mieć co najmniej 8 znaków." };
  }
  if (password !== confirmPassword) {
    return { error: "Hasła nie są takie same." };
  }

  const rateLimit = checkRateLimit(`register:${email}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return { error: "Zbyt wiele prób rejestracji z tym adresem. Spróbuj ponownie później." };
  }

  if (getUserByEmail(email)) {
    return { error: "Konto z tym adresem e-mail już istnieje." };
  }

  const userId = createUser({ email, passwordHash: hashPassword(password), name });
  await startSession(userId);
  redirect("/konto");
}
