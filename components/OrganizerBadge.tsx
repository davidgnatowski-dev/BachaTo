interface OrganizerBadgeDef {
  match: (row: { organizer?: string; competitionSeries?: string }) => boolean;
  src: string;
  label: string;
}

/**
 * Small corner logo marking which competition series an event belongs to —
 * useful now that many Bachata Social World Cup cards show only a country
 * flag, which alone doesn't say "this is a World Cup qualifier". Logos taken
 * from the organisers' own sites (bachatasocialworldcup.com,
 * worldbachatameetup.com).
 */
const ORGANIZER_BADGES: OrganizerBadgeDef[] = [
  {
    match: (row) => Boolean(row.competitionSeries?.includes("Bachata Social World Cup")),
    src: "/badges/bswc-logo.png",
    label: "Bachata Social World Cup — eliminacje/finał",
  },
  {
    // Covers both brandings the same real organiser uses ("World Bachata Meet Up" on
    // their event site, "Warsaw Bachata Meet Up" on some curated Tensy entries).
    match: (row) => Boolean(row.organizer?.includes("Bachata Meet Up")),
    src: "/badges/wbmu-logo.png",
    label: "World Bachata Meet Up",
  },
];

export function OrganizerBadge({
  organizer,
  competitionSeries,
  className = "",
}: {
  organizer?: string;
  competitionSeries?: string;
  className?: string;
}) {
  const badge = ORGANIZER_BADGES.find((b) => b.match({ organizer, competitionSeries }));
  if (!badge) return null;

  return (
    <span
      title={badge.label}
      aria-label={badge.label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-zinc-950/80 shadow-lg backdrop-blur ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small local badge asset, not remote/unpredictable */}
      <img src={badge.src} alt="" className="h-full w-full object-contain p-0.5" />
    </span>
  );
}
