import { redirect } from "next/navigation";

/** Merged into the single events hub — "Zawody" is now a category tab there. */
export default function KonkursyRedirect() {
  redirect("/eventy?kategoria=competition");
}
