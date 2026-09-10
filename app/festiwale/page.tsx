import { redirect } from "next/navigation";

/** Merged into the single events hub — "Festiwale" is now a category tab there. */
export default function FestiwaleRedirect() {
  redirect("/eventy?kategoria=festival");
}
