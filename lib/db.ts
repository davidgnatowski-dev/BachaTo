import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import type { ClassRow, EventRow, ScrapedClass, ScrapedEvent, School } from "./types";
import { splitInstructors } from "./schedule";
import { SCHOOL_INFO } from "./schools";
import { toLocalIsoDate } from "./format";
import { eventDedupKey, EVENT_SOURCES } from "./events";

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
`);

// Migrations for columns added after the initial schema.
function ensureColumn(table: string, column: string, ddl: string) {
  const has = db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ?`).get(table, column);
  if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}
ensureColumn("classes", "format", `format TEXT NOT NULL DEFAULT 'unknown'`);
ensureColumn("classes", "description", `description TEXT`);
ensureColumn("classes", "instructor_bio", `instructor_bio TEXT`);
ensureColumn("classes", "instructor_photos", `instructor_photos TEXT`);
ensureColumn("events", "description", `description TEXT`);
ensureColumn("events", "venue", `venue TEXT`);
ensureColumn("events", "address", `address TEXT`);

const upsertStmt = db.prepare(`
  INSERT INTO classes (
    school, external_id, title, dance_style, level, format, instructor, instructor_bio, instructor_photos, location,
    description, day_of_week, specific_date, start_time, end_time, source_url,
    first_seen_at, last_seen_at
  ) VALUES (
    @school, @externalId, @title, @danceStyle, @level, @format, @instructor, @instructorBio, @instructorPhotos, @location,
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
    instructor_photos = excluded.instructor_photos,
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
        instructorPhotos: item.instructorPhotos ? JSON.stringify(item.instructorPhotos) : null,
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
         c.instructor_photos as instructorPhotosJson, c.location,
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
    .all(today) as (ClassRow & { instructorPhotosJson: string | null })[];
  return rows.map(({ instructorPhotosJson, ...row }) => ({
    ...row,
    instructorPhotos: instructorPhotosJson ? JSON.parse(instructorPhotosJson) : undefined,
  }));
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
    source, category, external_id, title, city, venue, address, organizer, cover_image,
    description, start_date, end_date, source_url, first_seen_at, last_seen_at
  ) VALUES (
    @source, @category, @externalId, @title, @city, @venue, @address, @organizer, @coverImage,
    @description, @startDate, @endDate, @sourceUrl, @now, @now
  )
  ON CONFLICT(source, external_id) DO UPDATE SET
    category = excluded.category,
    title = excluded.title,
    city = excluded.city,
    venue = excluded.venue,
    address = excluded.address,
    organizer = excluded.organizer,
    cover_image = excluded.cover_image,
    description = excluded.description,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
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
        venue: item.venue ?? null,
        address: item.address ?? null,
        organizer: item.organizer ?? null,
        coverImage: item.coverImage ?? null,
        description: item.description ?? null,
        startDate: item.startDate,
        endDate: item.endDate ?? null,
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
export function getUpcomingEvents(): EventRow[] {
  const today = toLocalIsoDate(new Date());
  const rows = db
    .prepare(
      `SELECT
         e.id, e.source, e.category, e.external_id as externalId, e.title, e.city, e.venue, e.address,
         e.organizer, e.cover_image as coverImage, e.description,
         e.start_date as startDate, e.end_date as endDate,
         e.source_url as sourceUrl, e.first_seen_at as firstSeenAt, e.last_seen_at as lastSeenAt
       FROM events e
       INNER JOIN (
         SELECT source, MAX(last_seen_at) as maxSeen FROM events GROUP BY source
       ) latest ON latest.source = e.source AND latest.maxSeen = e.last_seen_at
       WHERE COALESCE(e.end_date, e.start_date) >= ?
       ORDER BY e.start_date`
    )
    .all(today) as EventRow[];
  return rows;
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
      let profile = byName.get(name);
      if (!profile) {
        profile = { name, schools: [], classCount: 0 };
        byName.set(name, profile);
      }
      profile.classCount++;
      if (!profile.schools.includes(row.school)) profile.schools.push(row.school);
      if (!profile.bio && row.instructorBio && names.length === 1) profile.bio = row.instructorBio;
      if (!profile.photoUrl && row.instructorPhotos?.[name]) profile.photoUrl = row.instructorPhotos[name];
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

/** One profile per school that currently has classes in the schedule, combining live counts with SCHOOL_INFO. */
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
