import { redirect } from "next/navigation";

/** City browsing moved into the events hub's city filter. */
export default function MiastaRedirect() {
  redirect("/eventy");
}
