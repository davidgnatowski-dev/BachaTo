import Link from "next/link";

const messages: Record<string, string> = {
  config: "Logowanie przez Google nie jest jeszcze skonfigurowane. Na razie skorzystaj z e-maila i hasła.",
  cancelled: "Logowanie przez Google zostało anulowane. Możesz spróbować ponownie.",
  exists: "Konto z tym adresem e-mail już istnieje. Zaloguj się dotychczasowym hasłem lub skorzystaj z opcji resetowania hasła.",
  invalid: "Nie udało się zalogować przez Google. Spróbuj ponownie.",
};

export default async function GoogleLoginError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12">
    <h1 className="font-heading text-2xl font-semibold">Logowanie przez Google</h1>
    <p role="alert" className="text-sm text-muted">{messages[error ?? "invalid"] ?? messages.invalid}</p>
    <Link href="/logowanie" className="text-accent">Wróć do logowania</Link>
  </main>;
}
