import { PinIcon } from "@/components/icons";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export function SearchBar() {
  return (
    <form
      id="szukaj"
      action="/szukaj"
      className="flex scroll-mt-6 flex-col gap-2 rounded-xl border border-line bg-zinc-900/60 p-2 sm:flex-row sm:items-center"
    >
      <SearchAutocomplete />
      <div className="flex shrink-0 items-center gap-2 rounded-full bg-black/30 px-4 py-2.5 text-sm text-zinc-200 sm:w-40">
        <PinIcon className="h-4 w-4 shrink-0 text-muted" />
        Warszawa
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Szukaj
      </button>
    </form>
  );
}
