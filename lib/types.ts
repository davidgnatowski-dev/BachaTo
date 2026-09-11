export type School = "Abra Studio" | "Salsa Libre" | "Warsaw Salsa Club" | "Oye!" | "Viva Cuba";

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
  /** Instructor name -> bio. Unlike instructorBio, this also supports co-taught classes. */
  instructorBios?: Record<string, string>;
  /** Instructor full name -> profile photo URL, for schools that publish photos but no bios. */
  instructorPhotos?: Record<string, string>;
  /** Instructor name -> official profile or school team page. */
  instructorProfileUrls?: Record<string, string>;
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
export type CompetitionStage = "qualifier" | "final";
export type EventRegistrationStatus = "open" | "closed" | "pending" | "through_qualifiers";

export interface EventPerson {
  id: string;
  name: string;
  role: "instructor" | "dj" | "jury" | "artist";
  photoUrl?: string;
  bio?: string;
}

export interface EventProgramItem {
  id: string;
  title: string;
  description?: string;
  startAt: string; // ISO datetime with timezone
  endAt?: string;
  room?: string;
  instructors: string[];
  levels: string[];
}

export interface ScrapedEvent {
  externalId: string; // stable id used for de-duplication across scrape runs
  category: EventCategory;
  title: string;
  city?: string;
  venue?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  organizer?: string;
  coverImage?: string;
  description?: string;
  /** Shared label used to present qualifiers and their final as one competition path. */
  competitionSeries?: string;
  competitionStage?: CompetitionStage;
  /** Human-readable final reached through this qualifier. */
  qualifiesFor?: string;
  /** External ID of an umbrella cup whose entry path consists of this event. */
  competitionParentId?: string;
  registrationStatus?: EventRegistrationStatus;
  registrationPrice?: string;
  qualifyingSpotsLeaders?: number;
  qualifyingSpotsFollowers?: number;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date (YYYY-MM-DD)
  people?: EventPerson[];
  programItems?: EventProgramItem[];
  sourceUrl: string;
}

export interface EventRow extends ScrapedEvent {
  id: number;
  source: string;
  firstSeenAt: string; // ISO datetime
  lastSeenAt: string; // ISO datetime
}
