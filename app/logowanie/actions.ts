"use server";

import { redirect } from "next/navigation";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword, startSession, type AuthActionState } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function login(_prevState: AuthActionState | undefined, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Podaj e-mail i hasło." };
  }

  const rateLimitKey = `login:${email.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.retryAfterSeconds ?? 0) / 60);
    return { error: `Zbyt wiele prób logowania. Spróbuj ponownie za ${minutes} min.` };
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Nieprawidłowy e-mail lub hasło." };
  }

  resetRateLimit(rateLimitKey);
  await startSession(user.id);
  redirect("/");
}
