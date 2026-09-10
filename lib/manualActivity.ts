/** Shared constants for hand-logged journal entries (see logManualActivity). */
export const MANUAL_ACTIVITY_TYPES = ["class", "practice", "party", "workshop"] as const;
export type ManualActivityType = (typeof MANUAL_ACTIVITY_TYPES)[number];

export const MANUAL_ACTIVITY_LABELS: Record<ManualActivityType, string> = {
  class: "Zajęcia",
  practice: "Praktyka",
  party: "Impreza",
  workshop: "Warsztat",
};
