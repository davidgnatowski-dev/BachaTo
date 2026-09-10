"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { requestPasswordReset } from "./actions";
import type { ResetRequestState } from "@/lib/auth";

const INPUT_CLASS =
  "rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const initialState: ResetRequestState = {};

export default function RequestPasswordResetPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Zapomniałeś/aś hasła?</h1>
        <p className="mt-1 text-sm text-muted">Podaj adres e-mail, na który zarejestrowałeś/aś konto.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          E-mail
          <input name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
        </label>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.message && <p className="text-sm text-green-400">{state.message}</p>}

        {state?.devResetUrl && (
          <div className="rounded-lg border border-dashed border-accent/50 bg-accent/10 p-3 text-xs text-zinc-200">
            <p className="font-semibold text-accent">Tryb deweloperski — bez skonfigurowanej wysyłki e-mail</p>
            <p className="mt-1">W produkcji ten link trafiłby na e-mail. Teraz otwórz go bezpośrednio:</p>
            <Link href={state.devResetUrl} className="mt-1 block break-all text-accent hover:text-accent-peach">
              {state.devResetUrl}
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Wysyłanie…" : "Wyślij link do resetu"}
        </button>
      </form>

      <p className="text-sm text-muted">
        <Link href="/logowanie" className="text-accent hover:text-accent-peach">
          ← Wróć do logowania
        </Link>
      </p>
    </div>
  );
}
