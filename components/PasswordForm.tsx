"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/konto/actions";
import type { AuthActionState } from "@/lib/auth";

const INPUT_CLASS =
  "rounded-xl border border-line bg-zinc-950/65 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Obecne hasło
        <input name="currentPassword" type="password" required autoComplete="current-password" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Nowe hasło
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-400">
        Powtórz nowe hasło
        <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLASS} />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-400">Hasło zmienione.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-60"
      >
        {pending ? "Zapisywanie…" : "Zmień hasło"}
      </button>
    </form>
  );
}
