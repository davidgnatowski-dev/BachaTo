import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-4xl">🔎</p>
      <h1 className="font-heading text-xl font-semibold text-zinc-50">Nie znaleziono strony</h1>
      <p className="text-sm text-muted">Ta strona nie istnieje albo została przeniesiona.</p>
      <Link
        href="/"
        className="mt-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
      >
        Strona główna
      </Link>
    </div>
  );
}
