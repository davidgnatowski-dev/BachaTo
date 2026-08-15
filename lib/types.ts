export type School = "Abra Studio" | "Salsa Libre" | "Warsaw Salsa Club";

/** Whether a class is danced with a partner or alone (styling/technique/ladies classes). */
export type ClassFormat = "solo" | "partner" | "unknown";

// A single class occurrence as extracted by a scraper, before it's stored.
export interface ScrapedClass {
  externalId: string; // stable id used for de-duplication across scrape runs
  title: string;
  danceStyle: string;
  level?: string;
  format: ClassFormat;
  instructor?: string;
  instructorBio?: string;
  /** Instructor full name -> profile photo URL, for schools that publish photos but no bios. */
  instructorPhotos?: Record<string, string>;
  location?: string;
  description?: string;
  /** 1 = Monday ... 7 = Sunday. Set for recurring weekly classes. */
  dayOfWeek?: number;
  /** ISO date (YYYY-MM-DD). Set for one-off / dated occurrences. */
  specificDate?: string;
  startTime?: string; // "HH:MM"
  endTime?: string; // "HH:MM"
  sourceUrl: string;
}

// A row as stored in and read back from the database.
export interface ClassRow extends ScrapedClass {
  id: number;
  school: School;
  firstSeenAt: string; // ISO datetime
  lastSeenAt: string; // ISO datetime
}

export interface ScrapeResult {
  school: string;
  ok: boolean;
  foundCount: number;
  newCount: number;
  error?: string;
}

/** A one-off dance event (festival, multi-day trip/camp, party/social, or competition), sourced from Tensy — Poland-wide, not limited to Warsaw. */
export type EventCategory = "festival" | "trip" | "social" | "competition";

export interface ScrapedEvent {
  externalId: string; // stable id used for de-duplication across scrape runs
  category: EventCategory;
  title: string;
  city?: string;
  venue?: string;
  address?: string;
  organizer?: string;
  coverImage?: string;
  description?: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date (YYYY-MM-DD)
  sourceUrl: string;
}

export interface EventRow extends ScrapedEvent {
  id: number;
  source: string;
  firstSeenAt: string; // ISO datetime
  lastSeenAt: string; // ISO datetime
}
