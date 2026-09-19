import { PinIcon } from "@/components/icons";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export function SearchBar() {
  return (
    <form
      id="szukaj"
      action="/szukaj"
      className="grid scroll-mt-6 grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(255,106,24,.06),rgba(13,18,29,.9))] p-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center"
    >
      <div className="col-span-2 sm:col-span-1"><SearchAutocomplete /></div>
      <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/30 px-4 py-2.5 text-sm text-zinc-200">
        <PinIcon className="h-4 w-4 shrink-0 text-muted" />
        Warszawa
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(255,106,24,.18)] hover:bg-accent-dark"
      >
        Szukaj
      </button>
    </form>
  );
}
