import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { ClassFormat, ClassRow, EventProgramItem, EventRow, ScrapedClass, ScrapedEvent, School } from "./types";
import { isCancelledClass, specificDateFromTitle, splitInstructors } from "./schedule";
import { SCHOOL_INFO } from "./schools";
import { toLocalIsoDate } from "./format";
import { applyCuratedEventOverride, eventDedupKey, eventProgramFavoriteId, EVENT_SOURCES, isCuratedEventSuppressed } from "./events";
import { parseNotificationPreferences, type NotificationPreferences } from "./notificationPreferences";
import { enrichInstructorProfiles } from "./instructorProfiles";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "bachata.sqlite");

// Reuse a single connection across hot-reloads in dev.
const globalForDb = globalThis as unknown as { __db?: Database.Database };
export const db = globalForDb.__db ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    dance_style TEXT NOT NULL,
    level TEXT,
    instructor TEXT,
    location TEXT,
    day_of_week INTEGER,
    specific_date TEXT,
    start_time TEXT,
    end_time TEXT,
    source_url TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    UNIQUE(school, external_id)
  );

  CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    ok INTEGER,
    found_count INTEGER,
    new_count INTEGER,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    category TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    city TEXT,
    organizer TEXT,
    cover_image TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    source_url TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    UNIQUE(source, external_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_emoji TEXT,
    bio TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, item_type, item_id, kind)
  );

  CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    class_id TEXT NOT NULL,
    date_iso TEXT NOT NULL,
    title TEXT NOT NULL,
    instructor TEXT,
    school TEXT NOT NULL,
    level TEXT,
    format TEXT NOT NULL,
    dance_style TEXT,
    duration_minutes INTEGER,
    marked_at TEXT NOT NULL,
    UNIQUE(user_id, key)
  );

  CREATE TABLE IF NOT EXISTS user_activity_skips (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    marked_at TEXT NOT NULL,
    PRIMARY KEY(user_id, key)
  );

  CREATE TABLE IF NOT EXISTS user_event_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    date_iso TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT,
    organizer TEXT,
    marked_at TEXT NOT NULL,
    UNIQUE(user_id, event_key)
  );

  CREATE TABLE IF NOT EXISTS user_event_program_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    event_key TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    date_iso TEXT NOT NULL,
    title TEXT NOT NULL,
    event_title TEXT NOT NULL,
    instructors TEXT,
    duration_minutes INTEGER,
    marked_at TEXT NOT NULL,
    UNIQUE(user_id, session_key)
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_key TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(user_id, event_key)
  );

  CREATE TABLE IF NOT EXISTS event_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind TEXT NOT NULL,
    event_key TEXT,
    contact_email TEXT NOT NULL,
    event_title TEXT NOT NULL,
    event_url TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    dance_style TEXT,
    level TEXT,
    format TEXT NOT NULL DEFAULT 'unknown',
    instructor TEXT,
    school_name TEXT,
    location TEXT,
    description TEXT,
    day_of_week INTEGER,
    specific_date TEXT,
    start_time TEXT,
    end_time TEXT,
    source_url TEXT,
    created_at TEXT NOT NULL
  );
`);

// Migrations for columns added after the initial schema.
function ensureColumn(table: string, column: string, ddl: string) {
  const has = db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ?`).get(table, column);
  if (!has) {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    } catch (error) {
      // `next build` can evaluate this module in parallel workers. Another
      // worker may add the column between the check and ALTER TABLE.
      if (!(error instanceof Error) || !error.message.includes("duplicate column name")) throw error;
    }
  }
}
ensureColumn("classes", "format", `format TEXT NOT NULL DEFAULT 'unknown'`);
ensureColumn("classes", "description", `description TEXT`);
ensureColumn("classes", "instructor_bio", `instructor_bio TEXT`);
ensureColumn("classes", "instructor_bios", `instructor_bios TEXT`);
ensureColumn("classes", "instructor_photos", `instructor_photos TEXT`);
ensureColumn("classes", "instructor_profile_urls", `instructor_profile_urls TEXT`);
ensureColumn("events", "description", `description TEXT`);
ensureColumn("events", "competition_series", `competition_series TEXT`);
ensureColumn("events", "competition_stage", `competition_stage TEXT`);
ensureColumn("events", "qualifies_for", `qualifies_for TEXT`);
ensureColumn("events", "competition_parent_id", `competition_parent_id TEXT`);
ensureColumn("events", "registration_status", `registration_status TEXT`);
ensureColumn("events", "registration_price", `registration_price TEXT`);
ensureColumn("events", "qualifying_spots_leaders", `qualifying_spots_leaders INTEGER`);
ensureColumn("events", "qualifying_spots_followers", `qualifying_spots_followers INTEGER`);
ensureColumn("events", "country", `country TEXT`);
ensureColumn("events", "venue", `venue TEXT`);
ensureColumn("events", "address", `address TEXT`);
ensureColumn("events", "latitude", `latitude REAL`);
ensureColumn("events", "longitude", `longitude REAL`);
ensureColumn("events", "people_json", `people_json TEXT`);
ensureColumn("events", "program_json", `program_json TEXT`);
ensureColumn("users", "instagram_url", `instagram_url TEXT`);
ensureColumn("users", "facebook_url", `facebook_url TEXT`);
ensureColumn("users", "pref_levels", `pref_levels TEXT`);
ensureColumn("users", "pref_formats", `pref_formats TEXT`);
ensureColumn("users", "pref_days", `pref_days TEXT`);
ensureColumn("users", "pref_time_from", `pref_time_from TEXT`);
ensureColumn("users", "onboarding_survey_done_at", `onboarding_survey_done_at TEXT`);
ensureColumn("users", "avatar_url", `avatar_url TEXT`);
ensureColumn("users", "city", `city TEXT`);
ensureColumn("users", "district", `district TEXT`);
ensureColumn("users", "max_distance_km", `max_distance_km INTEGER`);
ensureColumn("users", "preferences_json", `preferences_json TEXT`);
ensureColumn("users", "public_profile", `public_profile INTEGER NOT NULL DEFAULT 0`);
ensureColumn("users", "notification_preferences_json", `notification_preferences_json TEXT`);
ensureColumn("user_activity", "dance_style", `dance_style TEXT`);
ensureColumn("user_activity", "rating", `rating INTEGER`);
ensureColumn("user_activity", "note", `note TEXT`);
ensureColumn("user_activity", "auto_marked", `auto_marked INTEGER NOT NULL DEFAULT 0`);
// Manually-logged journal entries carry a type ("class" | "party" | "practice" | "workshop");
// null means a catalog class attendance ticked via the schedule (the original path).
ensureColumn("user_activity", "activity_type", `activity_type TEXT`);

const upsertStmt = db.prepare(`
  INSERT INTO classes (
    school, external_id, title, dance_style, level, format, instructor, instructor_bio, instructor_bios,
    instructor_photos, instructor_profile_urls, location,
    description, day_of_week, specific_date, start_time, end_time, source_url,
    first_seen_at, last_seen_at
  ) VALUES (
    @school, @externalId, @title, @danceStyle, @level, @format, @instructor, @instructorBio, @instructorBios,
    @instructorPhotos, @instructorProfileUrls, @location,
    @description, @dayOfWeek, @specificDate, @startTime, @endTime, @sourceUrl,
    @now, @now
  )
  ON CONFLICT(school, external_id) DO UPDATE SET
    title = excluded.title,
    dance_style = excluded.dance_style,
    level = excluded.level,
    format = excluded.format,
    instructor = excluded.instructor,
    instructor_bio = excluded.instructor_bio,
    instructor_bios = excluded.instructor_bios,
    instructor_photos = excluded.instructor_photos,
    instructor_profile_urls = excluded.instructor_profile_urls,
    location = excluded.location,
    description = excluded.description,
    day_of_week = excluded.day_of_week,
    specific_date = excluded.specific_date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    source_url = excluded.source_url,
    last_seen_at = excluded.last_seen_at
`);

const wasNewStmt = db.prepare(
  `SELECT first_seen_at as firstSeenAt, last_seen_at as lastSeenAt FROM classes WHERE school = ? AND external_id = ?`
);

/**
 * Upsert one school's freshly-scraped classes in a single transaction.
 * Returns how many were brand new (first time ever seen for this school+id).
 */
export function saveScrapedClasses(school: School, items: ScrapedClass[]): { foundCount: number; newCount: number } {
  const now = new Date().toISOString();
  let newCount = 0;

  const run = db.transaction((rows: ScrapedClass[]) => {
    for (const item of rows) {
      const existing = wasNewStmt.get(school, item.externalId);
      if (!existing) newCount++;
      upsertStmt.run({
        school,
        externalId: item.externalId,
        title: item.title,
        danceStyle: item.danceStyle,
        level: item.level ?? null,
        format: item.format,
        instructor: item.instructor ?? null,
        instructorBio: item.instructorBio ?? null,
        instructorBios: item.instructorBios ? JSON.stringify(item.instructorBios) : null,
        instructorPhotos: item.instructorPhotos ? JSON.stringify(item.instructorPhotos) : null,
        instructorProfileUrls: item.instructorProfileUrls ? JSON.stringify(item.instructorProfileUrls) : null,
        location: item.location ?? null,
        description: item.description ?? null,
        dayOfWeek: item.dayOfWeek ?? null,
        specificDate: item.specificDate ?? null,
        startTime: item.startTime ?? null,
        endTime: item.endTime ?? null,
        sourceUrl: item.sourceUrl,
        now,
      });
    }
  });
  run(items);

  return { foundCount: items.length, newCount };
}

export function logScrapeRun(entry: {
  school: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  foundCount: number;
  newCount: number;
  error?: string;
}) {
  db.prepare(
    `INSERT INTO scrape_runs (school, started_at, finished_at, ok, found_count, new_count, error)
     VALUES (@school, @startedAt, @finishedAt, @ok, @foundCount, @newCount, @error)`
  ).run({
    school: entry.school,
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
    ok: entry.ok ? 1 : 0,
    foundCount: entry.foundCount,
    newCount: entry.newCount,
    error: entry.error ?? null,
  });
}

/**
 * Current bachata schedule: only rows from each school's most recent scrape
 * (so classes removed from a school's site quietly drop off the display
 * instead of lingering forever), and only present/future dated occurrences.
 */
export function getCurrentSchedule(): ClassRow[] {
  const today = toLocalIsoDate(new Date());
  const rows = db
    .prepare(
      `SELECT
         c.id, c.school, c.external_id as externalId, c.title, c.dance_style as danceStyle,
         c.level, c.format, c.instructor, c.instructor_bio as instructorBio,
         c.instructor_bios as instructorBiosJson, c.instructor_photos as instructorPhotosJson,
         c.instructor_profile_urls as instructorProfileUrlsJson, c.location,
         c.description, c.day_of_week as dayOfWeek,
         c.specific_date as specificDate, c.start_time as startTime, c.end_time as endTime,
         c.source_url as sourceUrl, c.first_seen_at as firstSeenAt, c.last_seen_at as lastSeenAt
       FROM classes c
       INNER JOIN (
         SELECT school, MAX(last_seen_at) as maxSeen FROM classes GROUP BY school
       ) latest ON latest.school = c.school AND latest.maxSeen = c.last_seen_at
       WHERE c.specific_date IS NULL OR c.specific_date >= ?
       ORDER BY COALESCE(c.day_of_week, 8), c.start_time`
    )
    .all(today) as (ClassRow & {
      instructorBiosJson: string | null;
      instructorPhotosJson: string | null;
      instructorProfileUrlsJson: string | null;
    })[];
  return rows
    .map(({ instructorBiosJson, instructorPhotosJson, instructorProfileUrlsJson, ...row }) => {
      const inferredDate = row.specificDate ? undefined : specificDateFromTitle(row.title, new Date(`${today}T12:00:00`));
      return enrichInstructorProfiles({
        ...row,
        dayOfWeek: inferredDate ? undefined : row.dayOfWeek,
        specificDate: inferredDate ?? row.specificDate,
        instructorBios: instructorBiosJson ? JSON.parse(instructorBiosJson) : undefined,
        instructorPhotos: instructorPhotosJson ? JSON.parse(instructorPhotosJson) : undefined,
        instructorProfileUrls: instructorProfileUrlsJson ? JSON.parse(instructorProfileUrlsJson) : undefined,
      });
    })
    .filter((row) => !isCancelledClass(row));
}

export function getLastRunPerSchool(): Record<string, { finishedAt: string; ok: boolean; foundCount: number } | undefined> {
  const rows = db
    .prepare(
      `SELECT school, finished_at as finishedAt, ok, found_count as foundCount
       FROM scrape_runs r
       WHERE r.id = (SELECT MAX(id) FROM scrape_runs r2 WHERE r2.school = r.school)`
    )
    .all() as { school: string; finishedAt: string; ok: number; foundCount: number }[];
  const out: Record<string, { finishedAt: string; ok: boolean; foundCount: number }> = {};
  for (const r of rows) out[r.school] = { finishedAt: r.finishedAt, ok: !!r.ok, foundCount: r.foundCount };
  return out;
}

const upsertEventStmt = db.prepare(`
  INSERT INTO events (
    source, category, external_id, title, city, country, venue, address, latitude, longitude, organizer, cover_image,
    description, competition_series, competition_stage, qualifies_for, competition_parent_id,
    registration_status, registration_price, qualifying_spots_leaders, qualifying_spots_followers,
    start_date, end_date, people_json, program_json, source_url, first_seen_at, last_seen_at
  ) VALUES (
    @source, @category, @externalId, @title, @city, @country, @venue, @address, @latitude, @longitude, @organizer, @coverImage,
    @description, @competitionSeries, @competitionStage, @qualifiesFor, @competitionParentId,
    @registrationStatus, @registrationPrice, @qualifyingSpotsLeaders, @qualifyingSpotsFollowers,
    @startDate, @endDate, @peopleJson, @programJson, @sourceUrl, @now, @now
  )
  ON CONFLICT(source, external_id) DO UPDATE SET
    category = excluded.category,
    title = excluded.title,
    city = excluded.city,
    country = excluded.country,
    venue = excluded.venue,
    address = excluded.address,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    organizer = excluded.organizer,
    cover_image = excluded.cover_image,
    description = excluded.description,
    competition_series = excluded.competition_series,
    competition_stage = excluded.competition_stage,
    qualifies_for = excluded.qualifies_for,
    competition_parent_id = excluded.competition_parent_id,
    registration_status = excluded.registration_status,
    registration_price = excluded.registration_price,
    qualifying_spots_leaders = excluded.qualifying_spots_leaders,
    qualifying_spots_followers = excluded.qualifying_spots_followers,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    people_json = excluded.people_json,
    program_json = excluded.program_json,
    source_url = excluded.source_url,
    last_seen_at = excluded.last_seen_at
`);

const wasNewEventStmt = db.prepare(
  `SELECT 1 FROM events WHERE source = ? AND external_id = ?`
);

/**
 * Upsert one source's freshly-scraped events in a single transaction.
 * Returns how many were brand new (first time ever seen for this source+id).
 */
export function saveScrapedEvents(source: string, items: ScrapedEvent[]): { foundCount: number; newCount: number } {
  const now = new Date().toISOString();
  let newCount = 0;

  const run = db.transaction((rows: ScrapedEvent[]) => {
    for (const item of rows) {
      const existing = wasNewEventStmt.get(source, item.externalId);
      if (!existing) newCount++;
      upsertEventStmt.run({
        source,
        category: item.category,
        externalId: item.externalId,
        title: item.title,
        city: item.city ?? null,
        country: item.country ?? null,
        venue: item.venue ?? null,
        address: item.address ?? null,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        organizer: item.organizer ?? null,
        coverImage: item.coverImage ?? null,
        description: item.description ?? null,
        competitionSeries: item.competitionSeries ?? null,
        competitionStage: item.competitionStage ?? null,
        qualifiesFor: item.qualifiesFor ?? null,
        competitionParentId: item.competitionParentId ?? null,
        registrationStatus: item.registrationStatus ?? null,
        registrationPrice: item.registrationPrice ?? null,
        qualifyingSpotsLeaders: item.qualifyingSpotsLeaders ?? null,
        qualifyingSpotsFollowers: item.qualifyingSpotsFollowers ?? null,
        startDate: item.startDate,
        endDate: item.endDate ?? null,
        peopleJson: item.people?.length ? JSON.stringify(item.people) : null,
        programJson: item.programItems?.length ? JSON.stringify(item.programItems) : null,
        sourceUrl: item.sourceUrl,
        now,
      });
    }
  });
  run(items);

  return { foundCount: items.length, newCount };
}

/**
 * Upcoming bachata events (festivals/socials/competitions) from each
 * source's most recent scrape, still ongoing or in the future.
 */
type EventDbRow = Omit<EventRow, "people" | "programItems"> & { peopleJson: string | null; programJson: string | null };

const EVENT_SELECT = `e.id, e.source, e.category, e.external_id as externalId, e.title, e.city, e.country, e.venue, e.address,
  e.latitude, e.longitude, e.organizer, e.cover_image as coverImage, e.description,
  e.competition_series as competitionSeries, e.competition_stage as competitionStage, e.qualifies_for as qualifiesFor,
  e.competition_parent_id as competitionParentId, e.registration_status as registrationStatus,
  e.registration_price as registrationPrice, e.qualifying_spots_leaders as qualifyingSpotsLeaders,
  e.qualifying_spots_followers as qualifyingSpotsFollowers,
  e.start_date as startDate, e.end_date as endDate, e.people_json as peopleJson, e.program_json as programJson,
  e.source_url as sourceUrl, e.first_seen_at as firstSeenAt, e.last_seen_at as lastSeenAt`;

function hydrateEvent(row: EventDbRow): EventRow {
  const { peopleJson, programJson, ...event } = row;
  return {
    ...event,
    people: peopleJson ? JSON.parse(peopleJson) : [],
    programItems: programJson ? JSON.parse(programJson) : [],
  };
}

export function getUpcomingEvents(): EventRow[] {
  const today = toLocalIsoDate(new Date());
  const rows = db
    .prepare(
      `SELECT ${EVENT_SELECT}
       FROM events e
       INNER JOIN (
         SELECT source, MAX(last_seen_at) as maxSeen FROM events GROUP BY source
       ) latest ON latest.source = e.source AND latest.maxSeen = e.last_seen_at
       WHERE COALESCE(e.end_date, e.start_date) >= ?
       ORDER BY e.start_date`
    )
    .all(today) as EventDbRow[];
  return rows.map(hydrateEvent).filter((row) => !isCuratedEventSuppressed(row)).map(applyCuratedEventOverride);
}

export function getEventBySourceAndId(source: string, id: number): EventRow | undefined {
  const row = db.prepare(`SELECT ${EVENT_SELECT} FROM events e WHERE e.source = ? AND e.id = ?`).get(source, id) as EventDbRow | undefined;
  if (!row) return undefined;
  const event = hydrateEvent(row);
  return isCuratedEventSuppressed(event) ? undefined : applyCuratedEventOverride(event);
}

/** Direct qualification events belonging to an umbrella cup such as a continental cup. */
export function getCompetitionChildren(event: EventRow): EventRow[] {
  return getUpcomingEvents()
    .filter((candidate) => candidate.source === event.source && candidate.competitionParentId === event.externalId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getRelatedEvents(event: EventRow, limit = 3): EventRow[] {
  const eventStart = new Date(`${event.startDate}T12:00:00`).getTime();
  return getUpcomingEvents()
    .filter((candidate) => candidate.id !== event.id || candidate.source !== event.source)
    .map((candidate) => {
      let score = 0;
      if (event.organizer && candidate.organizer && event.organizer === candidate.organizer) score += 5;
      if (event.city && candidate.city && event.city === candidate.city) score += 2;
      const dayDiff = Math.abs(new Date(`${candidate.startDate}T12:00:00`).getTime() - eventStart) / 86400000;
      if (dayDiff <= 2) score += 4;
      else if (dayDiff <= 14) score += 1;
      if (event.category !== candidate.category) score += 1;
      return { candidate, score, dayDiff };
    })
    .filter((entry) => entry.score >= 5)
    .sort((a, b) => b.score - a.score || a.dayDiff - b.dayDiff)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Dedup keys (see eventDedupKey) for every currently-listed Tensy event — used to skip school-site events that Tensy already has. */
export function getTensyEventDedupKeys(): Set<string> {
  const rows = db
    .prepare(`SELECT title, start_date as startDate FROM events WHERE source = 'Tensy'`)
    .all() as { title: string; startDate: string }[];
  return new Set(rows.map((r) => eventDedupKey(r.title, r.startDate)));
}

const EVENT_SOURCE_SET = new Set<string>(EVENT_SOURCES);

/** Real (not marketing-fabricated) counts shown in the footer bar. */
export function getStats() {
  const classCount = getCurrentSchedule().length;
  const schoolCount = Object.keys(getLastRunPerSchool()).filter((s) => !EVENT_SOURCE_SET.has(s)).length;
  const events = getUpcomingEvents();
  const cityCount = new Set(events.map((e) => e.city).filter(Boolean)).size;
  return { classCount, schoolCount, eventCount: events.length, cityCount };
}

export interface InstructorProfile {
  name: string;
  schools: string[];
  classCount: number;
  bio?: string;
  photoUrl?: string;
  profileUrl?: string;
  styles: string[];
  levels: string[];
}

/**
 * Every instructor teaching at least one currently-listed bachata class,
 * aggregated across all schools — derived entirely from data already
 * scraped for the schedule, no separate source needed. Co-taught classes
 * list both names ("Ola, Darek"), so instructor identity here is by split
 * name, not by raw `instructor` field value.
 */
export function getInstructors(): InstructorProfile[] {
  const byName = new Map<string, InstructorProfile>();

  for (const row of getCurrentSchedule()) {
    const names = splitInstructors(row.instructor);
    for (const name of names) {
      // Fitssey occasionally exposes a technical placeholder account instead
      // of a real teacher. Keep it on the class for source fidelity, but do
      // not create a misleading public instructor profile for it.
      if (/^Instruktor\s+\d+\b/i.test(name)) continue;
      let profile = byName.get(name);
      if (!profile) {
        profile = { name, schools: [], classCount: 0, styles: [], levels: [] };
        byName.set(name, profile);
      }
      profile.classCount++;
      if (!profile.schools.includes(row.school)) profile.schools.push(row.school);
      if (!profile.styles.includes(row.danceStyle)) profile.styles.push(row.danceStyle);
      if (row.level && !profile.levels.includes(row.level)) profile.levels.push(row.level);
      if (!profile.bio && row.instructorBios?.[name]) profile.bio = row.instructorBios[name];
      if (!profile.bio && row.instructorBio && names.length === 1) profile.bio = row.instructorBio;
      if (!profile.photoUrl && row.instructorPhotos?.[name]) profile.photoUrl = row.instructorPhotos[name];
      if (!profile.profileUrl && row.instructorProfileUrls?.[name]) profile.profileUrl = row.instructorProfileUrls[name];
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

/** All currently-listed classes taught by one instructor (by exact split name), for their profile page. */
export function getClassesByInstructor(name: string): ClassRow[] {
  return getCurrentSchedule().filter((r) => splitInstructors(r.instructor).includes(name));
}

/** All currently-listed classes at one school, for its profile page. */
export function getClassesBySchool(school: School): ClassRow[] {
  return getCurrentSchedule().filter((r) => r.school === school);
}

export interface SchoolProfile {
  name: School;
  homepage: string;
  description: string;
  locations: string[];
  classCount: number;
  instructorCount: number;
}

/** One profile per supported school, combining live counts with SCHOOL_INFO. */
export function getSchoolProfiles(): SchoolProfile[] {
  const bySchool = new Map<School, { locations: Set<string>; instructors: Set<string>; classCount: number }>();

  for (const row of getCurrentSchedule()) {
    let entry = bySchool.get(row.school);
    if (!entry) {
      entry = { locations: new Set(), instructors: new Set(), classCount: 0 };
      bySchool.set(row.school, entry);
    }
    entry.classCount++;
    // The scraped `location` field is occasionally a class status (e.g.
    // Salsa Libre/Warsaw Salsa Club both sometimes put "ZAJĘCIA ODWOŁANE"
    // there instead of a room name) rather than an actual place — those
    // don't belong in a list of the school's venues.
    if (row.location && !row.location.toLowerCase().includes("odwołane")) entry.locations.add(row.location);
    for (const name of splitInstructors(row.instructor)) entry.instructors.add(name);
  }

  for (const school of Object.keys(SCHOOL_INFO) as School[]) {
    if (!bySchool.has(school)) {
      bySchool.set(school, { locations: new Set(), instructors: new Set(), classCount: 0 });
    }
  }

  return Array.from(bySchool.entries())
    .map(([school, entry]) => ({
      name: school,
      homepage: SCHOOL_INFO[school].homepage,
      description: SCHOOL_INFO[school].description,
      locations: Array.from(entry.locations).sort((a, b) => a.localeCompare(b, "pl")),
      classCount: entry.classCount,
      instructorCount: entry.instructors.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));
}

// --- Accounts -----------------------------------------------------------

export interface UserRow {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  bio: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  city: string | null;
  district: string | null;
  maxDistanceKm: number | null;
  preferencesJson: string | null;
  publicProfile: number;
  createdAt: string;
}

export function createUser(input: { email: string; passwordHash: string; name: string }): number {
  const now = new Date().toISOString();
  const result = db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (@email, @passwordHash, @name, @now)`)
    .run({ email: input.email.toLowerCase(), passwordHash: input.passwordHash, name: input.name, now });
  return Number(result.lastInsertRowid);
}

const USER_COLUMNS = `id, email, password_hash as passwordHash, name, avatar_emoji as avatarEmoji, avatar_url as avatarUrl, bio,
       instagram_url as instagramUrl, facebook_url as facebookUrl, city, district,
       max_distance_km as maxDistanceKm, preferences_json as preferencesJson, public_profile as publicProfile,
       created_at as createdAt`;

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE email = ?`).get(email.toLowerCase()) as UserRow | undefined;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`).get(id) as UserRow | undefined;
}

export function updateUserProfile(
  id: number,
  input: { name: string; avatarEmoji: string | null; avatarUrl: string | null; bio: string | null; instagramUrl: string | null; facebookUrl: string | null }
) {
  db.prepare(
    `UPDATE users SET name = @name, avatar_emoji = @avatarEmoji, avatar_url = @avatarUrl, bio = @bio,
       instagram_url = @instagramUrl, facebook_url = @facebookUrl WHERE id = @id`
  ).run({ id, ...input });
}

export function updateUserPreferences(
  id: number,
  input: { city: string | null; district: string | null; maxDistanceKm: number | null; preferencesJson: string; publicProfile: boolean }
) {
  db.prepare(
    `UPDATE users SET city = @city, district = @district, max_distance_km = @maxDistanceKm,
       preferences_json = @preferencesJson, public_profile = @publicProfile WHERE id = @id`
  ).run({ id, ...input, publicProfile: input.publicProfile ? 1 : 0 });
}

export function getUserNotificationPreferences(userId: number): NotificationPreferences {
  const row = db.prepare(`SELECT notification_preferences_json as value FROM users WHERE id = ?`).get(userId) as { value: string | null } | undefined;
  return parseNotificationPreferences(row?.value);
}

export function updateUserNotificationPreferences(userId: number, preferences: NotificationPreferences) {
  db.prepare(`UPDATE users SET notification_preferences_json = ? WHERE id = ?`).run(JSON.stringify(preferences), userId);
}

export function updateUserPassword(id: number, passwordHash: string) {
  db.prepare(`UPDATE users SET password_hash = @passwordHash WHERE id = @id`).run({ id, passwordHash });
}

export interface UserPreferences {
  /** LevelBucket keys (see lib/level.ts); empty = no preference, multiple is a valid explicit choice. */
  levels: string[];
  /** ClassFormat values ("partner"/"solo"); empty = no preference, both is a valid explicit choice. */
  formats: string[];
  /** 1 = Monday .. 7 = Sunday; empty = no preference. */
  days: number[];
  /** "HH:MM", classes starting earlier are excluded; null = no preference. */
  timeFrom: string | null;
  /** Set once the onboarding survey is completed OR explicitly skipped — null means "not asked yet". */
  surveyDoneAt: string | null;
}

const EMPTY_PREFERENCES: UserPreferences = { levels: [], formats: [], days: [], timeFrom: null, surveyDoneAt: null };

export function getUserPreferences(userId: number): UserPreferences {
  const row = db
    .prepare(
      `SELECT pref_levels as levelsJson, pref_formats as formatsJson, pref_days as daysJson, pref_time_from as timeFrom,
              onboarding_survey_done_at as surveyDoneAt
       FROM users WHERE id = ?`
    )
    .get(userId) as
    | { levelsJson: string | null; formatsJson: string | null; daysJson: string | null; timeFrom: string | null; surveyDoneAt: string | null }
    | undefined;
  if (!row) return EMPTY_PREFERENCES;
  return {
    levels: row.levelsJson ? JSON.parse(row.levelsJson) : [],
    formats: row.formatsJson ? JSON.parse(row.formatsJson) : [],
    days: row.daysJson ? JSON.parse(row.daysJson) : [],
    timeFrom: row.timeFrom,
    surveyDoneAt: row.surveyDoneAt,
  };
}

export function saveUserPreferences(
  userId: number,
  prefs: { levels: string[]; formats: string[]; days: number[]; timeFrom: string | null }
) {
  db.prepare(
    `UPDATE users SET pref_levels = @levels, pref_formats = @formats, pref_days = @days, pref_time_from = @timeFrom,
       onboarding_survey_done_at = @now WHERE id = @id`
  ).run({
    id: userId,
    levels: JSON.stringify(prefs.levels),
    formats: JSON.stringify(prefs.formats),
    days: JSON.stringify(prefs.days),
    timeFrom: prefs.timeFrom,
    now: new Date().toISOString(),
  });
}

export function skipOnboardingSurvey(userId: number) {
  db.prepare(`UPDATE users SET onboarding_survey_done_at = @now WHERE id = @id`).run({
    id: userId,
    now: new Date().toISOString(),
  });
}

export function createSession(userId: number, sessionId: string, expiresAt: string) {
  db.prepare(`INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (@id, @userId, @now, @expiresAt)`).run({
    id: sessionId,
    userId,
    now: new Date().toISOString(),
    expiresAt,
  });
}

/** Session-cookie-value -> user, or undefined if the session doesn't exist or has expired. */
export function getSessionUser(sessionId: string): UserRow | undefined {
  const now = new Date().toISOString();
  return db
    .prepare(
      `SELECT u.id, u.email, u.password_hash as passwordHash, u.name, u.avatar_emoji as avatarEmoji, u.avatar_url as avatarUrl, u.bio,
              u.instagram_url as instagramUrl, u.facebook_url as facebookUrl, u.city, u.district,
              u.max_distance_km as maxDistanceKm, u.preferences_json as preferencesJson, u.public_profile as publicProfile,
              u.created_at as createdAt
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`
    )
    .get(sessionId, now) as UserRow | undefined;
}

export function deleteSession(sessionId: string) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

// --- Password reset -------------------------------------------------------

export function createPasswordReset(userId: number, token: string, expiresAt: string) {
  db.prepare(`INSERT INTO password_resets (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`).run(
    token,
    userId,
    new Date().toISOString(),
    expiresAt
  );
}

export interface PasswordResetRow {
  userId: number;
  expiresAt: string;
  used: number;
}

export function getPasswordReset(token: string): PasswordResetRow | undefined {
  return db.prepare(`SELECT user_id as userId, expires_at as expiresAt, used FROM password_resets WHERE token = ?`).get(token) as
    | PasswordResetRow
    | undefined;
}

export function markPasswordResetUsed(token: string) {
  db.prepare(`UPDATE password_resets SET used = 1 WHERE token = ?`).run(token);
}

// --- Account-synced favorites/plan ---------------------------------------

export type FavoriteItemType = "class" | "event" | "event_session" | "school" | "instructor";
export type FavoriteKind = "liked" | "planned" | "followed";

export interface UserFavoriteRow {
  itemType: FavoriteItemType;
  itemId: string;
  kind: FavoriteKind;
}

export function addUserFavorite(userId: number, itemType: FavoriteItemType, itemId: string, kind: FavoriteKind) {
  db.prepare(
    `INSERT OR IGNORE INTO user_favorites (user_id, item_type, item_id, kind, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(userId, itemType, itemId, kind, new Date().toISOString());
}

export function removeUserFavorite(userId: number, itemType: FavoriteItemType, itemId: string, kind: FavoriteKind) {
  db.prepare(`DELETE FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ? AND kind = ?`).run(
    userId,
    itemType,
    itemId,
    kind
  );
}

export function getUserFavorites(userId: number): UserFavoriteRow[] {
  return db
    .prepare(`SELECT item_type as itemType, item_id as itemId, kind FROM user_favorites WHERE user_id = ?`)
    .all(userId) as UserFavoriteRow[];
}

export interface CommunityMemberRow {
  id: number;
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  district: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
}

export function getPublicCommunityMembers(): CommunityMemberRow[] {
  return db.prepare(
    `SELECT id, name, avatar_emoji as avatarEmoji, avatar_url as avatarUrl, bio, city, district,
            instagram_url as instagramUrl, facebook_url as facebookUrl
     FROM users WHERE public_profile = 1 ORDER BY name COLLATE NOCASE`
  ).all() as CommunityMemberRow[];
}

// --- Account-synced attendance/activity (for /podsumowanie stats) --------

export interface UserActivityRow {
  key: string;
  classId: string;
  dateIso: string;
  title: string;
  instructor: string | null;
  school: string;
  level: string | null;
  format: ClassFormat;
  danceStyle: string | null;
  durationMinutes: number | null;
  markedAt: string;
  autoMarked?: boolean;
  rating?: number | null;
  note?: string | null;
  /** "class" | "party" | "practice" | "workshop"; null/undefined = catalog class attendance. */
  activityType?: string | null;
}

export function addUserActivity(userId: number, entry: Omit<UserActivityRow, "markedAt"> & { markedAt?: string }) {
  db.prepare(
    `INSERT INTO user_activity (
       user_id, key, class_id, date_iso, title, instructor, school, level, format, dance_style, duration_minutes, marked_at, auto_marked, activity_type
     ) VALUES (
       @userId, @key, @classId, @dateIso, @title, @instructor, @school, @level, @format, @danceStyle, @durationMinutes, @markedAt, @autoMarked, @activityType
     )
     ON CONFLICT(user_id, key) DO UPDATE SET marked_at = excluded.marked_at, auto_marked = excluded.auto_marked`
  ).run({
    userId,
    key: entry.key,
    classId: entry.classId,
    dateIso: entry.dateIso,
    title: entry.title,
    instructor: entry.instructor,
    school: entry.school,
    level: entry.level,
    format: entry.format,
    danceStyle: entry.danceStyle,
    durationMinutes: entry.durationMinutes,
    markedAt: entry.markedAt ?? new Date().toISOString(),
    autoMarked: entry.autoMarked ? 1 : 0,
    activityType: entry.activityType ?? null,
  });
}

export function removeUserActivity(userId: number, key: string) {
  db.prepare(`DELETE FROM user_activity WHERE user_id = ? AND key = ?`).run(userId, key);
}

export function setUserActivitySkipped(userId: number, key: string, skipped: boolean) {
  if (skipped) {
    db.prepare(
      `INSERT INTO user_activity_skips (user_id, key, marked_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id, key) DO UPDATE SET marked_at = excluded.marked_at`
    ).run(userId, key, new Date().toISOString());
    removeUserActivity(userId, key);
    return;
  }
  db.prepare(`DELETE FROM user_activity_skips WHERE user_id = ? AND key = ?`).run(userId, key);
}

export function getUserActivitySkippedKeys(userId: number): string[] {
  return (db.prepare(`SELECT key FROM user_activity_skips WHERE user_id = ?`).all(userId) as Array<{ key: string }>).map((row) => row.key);
}

export function updateUserActivityReflection(userId: number, key: string, rating: number | null, note: string | null) {
  db.prepare(`UPDATE user_activity SET rating = ?, note = ? WHERE user_id = ? AND key = ?`).run(rating, note, userId, key);
}

export function getUserActivity(userId: number): UserActivityRow[] {
  const rows = db
    .prepare(
      `SELECT key, class_id as classId, date_iso as dateIso, title, instructor, school, level, format,
              dance_style as danceStyle, duration_minutes as durationMinutes, marked_at as markedAt,
              auto_marked as autoMarked, rating, note, activity_type as activityType
       FROM user_activity WHERE user_id = ? ORDER BY date_iso DESC`
    )
    .all(userId) as Array<Omit<UserActivityRow, "autoMarked"> & { autoMarked: number }>;
  return rows.map((row) => ({ ...row, autoMarked: Boolean(row.autoMarked) }));
}

export interface UserEventActivityRow {
  eventKey: string;
  eventId: number;
  source: string;
  dateIso: string;
  title: string;
  category: EventRow["category"];
  city: string | null;
  organizer: string | null;
  markedAt: string;
}

export function addUserEventActivity(userId: number, event: EventRow) {
  db.prepare(
    `INSERT INTO user_event_activity (
       user_id, event_key, event_id, source, date_iso, title, category, city, organizer, marked_at
     ) VALUES (
       @userId, @eventKey, @eventId, @source, @dateIso, @title, @category, @city, @organizer, @markedAt
     )
     ON CONFLICT(user_id, event_key) DO UPDATE SET
       date_iso = excluded.date_iso,
       title = excluded.title,
       category = excluded.category,
       city = excluded.city,
       organizer = excluded.organizer,
       marked_at = excluded.marked_at`
  ).run({
    userId,
    eventKey: `${event.source}-${event.id}`,
    eventId: event.id,
    source: event.source,
    dateIso: event.startDate,
    title: event.title,
    category: event.category,
    city: event.city ?? null,
    organizer: event.organizer ?? null,
    markedAt: new Date().toISOString(),
  });
}

export function removeUserEventActivity(userId: number, source: string, eventId: number) {
  db.prepare(`DELETE FROM user_event_activity WHERE user_id = ? AND event_key = ?`).run(userId, `${source}-${eventId}`);
}

export function hasUserAttendedEvent(userId: number, source: string, eventId: number): boolean {
  return Boolean(db.prepare(`SELECT 1 FROM user_event_activity WHERE user_id = ? AND event_key = ?`).get(userId, `${source}-${eventId}`));
}

export function getUserEventActivity(userId: number): UserEventActivityRow[] {
  return db.prepare(
    `SELECT event_key as eventKey, event_id as eventId, source, date_iso as dateIso, title,
            category, city, organizer, marked_at as markedAt
     FROM user_event_activity WHERE user_id = ? ORDER BY date_iso DESC, marked_at DESC`
  ).all(userId) as UserEventActivityRow[];
}

export function getRecentPlannedEvents(userId: number, daysBack = 90): EventRow[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const today = toLocalIsoDate(new Date());
  const rows = db.prepare(
    `SELECT ${EVENT_SELECT}
     FROM events e
     INNER JOIN user_favorites f
       ON f.user_id = ? AND f.item_type = 'event' AND f.kind = 'planned'
      AND f.item_id = e.source || '-' || e.id
     WHERE e.start_date <= ? AND COALESCE(e.end_date, e.start_date) >= ?
     ORDER BY e.start_date DESC`
  ).all(userId, today, toLocalIsoDate(cutoff)) as EventDbRow[];
  return rows.map(hydrateEvent);
}

export interface UserEventProgramActivityRow {
  sessionKey: string;
  eventKey: string;
  eventId: number;
  source: string;
  dateIso: string;
  title: string;
  eventTitle: string;
  instructors: string | null;
  durationMinutes: number | null;
  markedAt: string;
}

export function addUserEventProgramActivity(userId: number, event: EventRow, item: EventProgramItem) {
  const start = new Date(item.startAt);
  const end = item.endAt ? new Date(item.endAt) : null;
  const durationMinutes = end && end > start ? Math.round((end.getTime() - start.getTime()) / 60000) : 60;
  const sessionKey = eventProgramFavoriteId(event.source, event.id, item.id);
  db.prepare(
    `INSERT INTO user_event_program_activity (
       user_id, session_key, event_key, event_id, source, date_iso, title, event_title, instructors, duration_minutes, marked_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, session_key) DO UPDATE SET marked_at = excluded.marked_at`
  ).run(
    userId,
    sessionKey,
    `${event.source}-${event.id}`,
    event.id,
    event.source,
    item.startAt.slice(0, 10),
    item.title,
    event.title,
    item.instructors.join(", ") || null,
    durationMinutes,
    new Date().toISOString()
  );
}

export function removeUserEventProgramActivity(userId: number, source: string, eventId: number, sessionId: string) {
  db.prepare(`DELETE FROM user_event_program_activity WHERE user_id = ? AND session_key = ?`).run(
    userId,
    eventProgramFavoriteId(source, eventId, sessionId)
  );
}

export function getUserEventProgramActivity(userId: number): UserEventProgramActivityRow[] {
  return db.prepare(
    `SELECT session_key as sessionKey, event_key as eventKey, event_id as eventId, source, date_iso as dateIso,
            title, event_title as eventTitle, instructors, duration_minutes as durationMinutes, marked_at as markedAt
     FROM user_event_program_activity WHERE user_id = ? ORDER BY date_iso DESC, marked_at DESC`
  ).all(userId) as UserEventProgramActivityRow[];
}

export function hasUserAttendedEventProgramItem(userId: number, source: string, eventId: number, sessionId: string): boolean {
  return Boolean(db.prepare(`SELECT 1 FROM user_event_program_activity WHERE user_id = ? AND session_key = ?`).get(
    userId,
    eventProgramFavoriteId(source, eventId, sessionId)
  ));
}

export function setEventRsvp(userId: number, source: string, eventId: number, active: boolean) {
  const eventKey = `${source}-${eventId}`;
  if (active) {
    db.prepare(`INSERT OR IGNORE INTO event_rsvps (user_id, event_key, created_at) VALUES (?, ?, ?)`).run(userId, eventKey, new Date().toISOString());
  } else {
    db.prepare(`DELETE FROM event_rsvps WHERE user_id = ? AND event_key = ?`).run(userId, eventKey);
  }
}

export function getEventRsvp(source: string, eventId: number, userId?: number): { count: number; attending: boolean; names: string[] } {
  const eventKey = `${source}-${eventId}`;
  const count = (db.prepare(`SELECT COUNT(*) as count FROM event_rsvps WHERE event_key = ?`).get(eventKey) as { count: number }).count;
  const attending = userId ? Boolean(db.prepare(`SELECT 1 FROM event_rsvps WHERE event_key = ? AND user_id = ?`).get(eventKey, userId)) : false;
  const names = (db.prepare(
    `SELECT u.name FROM event_rsvps r JOIN users u ON u.id = r.user_id
     WHERE r.event_key = ? AND u.public_profile = 1 ORDER BY r.created_at LIMIT 6`
  ).all(eventKey) as Array<{ name: string }>).map((row) => row.name);
  return { count, attending, names };
}

export function createEventSubmission(input: {
  userId: number | null;
  kind: "new" | "correction" | "claim";
  eventKey: string | null;
  contactEmail: string;
  eventTitle: string;
  eventUrl: string | null;
  message: string;
}) {
  db.prepare(
    `INSERT INTO event_submissions (user_id, kind, event_key, contact_email, event_title, event_url, message, created_at)
     VALUES (@userId, @kind, @eventKey, @contactEmail, @eventTitle, @eventUrl, @message, @createdAt)`
  ).run({ ...input, createdAt: new Date().toISOString() });
}

// --- User-submitted classes ----------------------------------------------

export interface UserClassRow {
  id: number;
  userId: number;
  title: string;
  danceStyle: string | null;
  level: string | null;
  format: ClassFormat;
  instructor: string | null;
  schoolName: string | null;
  location: string | null;
  description: string | null;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string | null;
  endTime: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export function createUserClass(
  userId: number,
  input: Omit<UserClassRow, "id" | "userId" | "createdAt">
): number {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO user_classes (
         user_id, title, dance_style, level, format, instructor, school_name, location,
         description, day_of_week, specific_date, start_time, end_time, source_url, created_at
       ) VALUES (
         @userId, @title, @danceStyle, @level, @format, @instructor, @schoolName, @location,
         @description, @dayOfWeek, @specificDate, @startTime, @endTime, @sourceUrl, @now
       )`
    )
    .run({ userId, now, ...input });
  return Number(result.lastInsertRowid);
}

export function getUserClasses(userId: number): UserClassRow[] {
  return db
    .prepare(
      `SELECT id, user_id as userId, title, dance_style as danceStyle, level, format, instructor,
              school_name as schoolName, location, description, day_of_week as dayOfWeek,
              specific_date as specificDate, start_time as startTime, end_time as endTime,
              source_url as sourceUrl, created_at as createdAt
       FROM user_classes WHERE user_id = ? ORDER BY COALESCE(day_of_week, 8), start_time`
    )
    .all(userId) as UserClassRow[];
}

/** Ownership-checked: only deletes if the row actually belongs to this user. */
export function deleteUserClass(id: number, userId: number): boolean {
  const result = db.prepare(`DELETE FROM user_classes WHERE id = ? AND user_id = ?`).run(id, userId);
  return result.changes > 0;
}
