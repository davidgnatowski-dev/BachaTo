"use client";

import { useActionState } from "react";
import { confirmPasswordReset } from "@/app/resetuj-haslo/actions";
import type { AuthActionState } from "@/lib/auth";

const INPUT_CLASS =
  "rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const initialState: AuthActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const action = confirmPasswordReset.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Nowe hasło
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLASS} />
        <span className="text-xs text-muted">Co najmniej 8 znaków.</span>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Powtórz nowe hasło
        <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={INPUT_CLASS} />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Zapisywanie…" : "Ustaw nowe hasło"}
      </button>
    </form>
  );
}
