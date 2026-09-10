"use client";

import { useState } from "react";
import type { EventRow } from "@/lib/types";
import { EventDiscoveryShelves } from "@/components/EventDiscoveryShelves";
import { AddToPlanModal } from "@/components/AddToPlanModal";

/** Thin client wrapper so the server-rendered homepage can gate "Dodaj do planu" on events behind login, same as the classes list. */
export function HomeEventsSection({ events, loggedIn }: { events: EventRow[]; loggedIn: boolean }) {
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  return (
    <>
      <EventDiscoveryShelves events={events} onRequireAuth={loggedIn ? undefined : () => setAuthPromptOpen(true)} />
      {authPromptOpen && <AddToPlanModal onClose={() => setAuthPromptOpen(false)} />}
    </>
  );
}
