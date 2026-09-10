import { redirect } from "next/navigation";

/** Merged into the single events hub — "Praktyka taneczna" is now a category tab there. */
export default function ImprezyRedirect() {
  redirect("/eventy?kategoria=social");
}
