import { AMENITY_LABELS, type SchoolAmenity } from "@/lib/schools";
import { CheckIcon } from "@/components/icons";

/** Hidden entirely unless at least one amenity is actually confirmed true — never a placeholder grid of unknowns. */
export function SchoolAmenities({ amenities }: { amenities?: SchoolAmenity[] }) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Udogodnienia</h2>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => (
          <span
            key={amenity}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-zinc-900/60 px-3 py-1.5 text-sm text-foreground"
          >
            <CheckIcon className="h-3.5 w-3.5 text-accent" />
            {AMENITY_LABELS[amenity]}
          </span>
        ))}
      </div>
    </section>
  );
}
