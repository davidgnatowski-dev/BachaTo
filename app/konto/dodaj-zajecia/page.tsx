import { redirect } from "next/navigation";

/** Old path — the manual journal entry now lives at /konto/dodaj-aktywnosc. */
export default function AddClassRedirect() {
  redirect("/konto/dodaj-aktywnosc");
}
