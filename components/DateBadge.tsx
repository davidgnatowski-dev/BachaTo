const MONTHS_SHORT = ["STY", "LUT", "MAR", "KWI", "MAJ", "CZE", "LIP", "SIE", "WRZ", "PAŹ", "LIS", "GRU"];
const WEEKDAYS_SHORT = ["NIEDZ", "PON", "WT", "ŚR", "CZW", "PT", "SOB"];

/** Compact two-tier date badge (day/month on orange, weekday on violet) for event cards. */
export function DateBadge({ isoDate }: { isoDate: string }) {
  const date = new Date(`${isoDate}T00:00:00`);
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const weekday = WEEKDAYS_SHORT[date.getDay()];

  return (
    <div className="flex w-14 flex-col overflow-hidden rounded-lg text-center shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="bg-accent px-1 py-1 leading-none text-white">
        <div className="text-base font-bold">{day}</div>
        <div className="text-[10px] font-semibold tracking-wide">{month}</div>
      </div>
      <div className="bg-violet px-1 py-0.5 text-[10px] font-semibold leading-none text-white">{weekday}</div>
    </div>
  );
}
