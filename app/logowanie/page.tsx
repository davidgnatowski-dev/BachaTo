"use client";

import { useActionState } from "react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Header } from "@/components/Header";
import { login } from "./actions";
import type { AuthActionState } from "@/lib/auth";

const INPUT_CLASS =
  "rounded-lg border border-line bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Zaloguj się</h1>
        <p className="mt-1 text-sm text-muted">Zaloguj się, żeby edytować profil i dodawać własne zajęcia.</p>
      </div>

      <GoogleSignInButton />

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          E-mail
          <input name="email" type="email" required autoComplete="email" className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Hasło
          <input name="password" type="password" required autoComplete="current-password" className={INPUT_CLASS} />
        </label>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {pending ? "Logowanie…" : "Zaloguj się"}
        </button>
      </form>

      <p className="text-sm text-muted">
        <Link href="/resetuj-haslo" className="text-accent hover:text-accent-peach">
          Zapomniałeś/aś hasła?
        </Link>
      </p>

      <p className="text-sm text-muted">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className="text-accent hover:text-accent-peach">
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
