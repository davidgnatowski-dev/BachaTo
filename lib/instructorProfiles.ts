import { splitInstructors } from "./schedule";
import type { ClassRow, School } from "./types";

interface CuratedInstructorProfile {
  photoUrl?: string;
  profileUrl?: string;
  bio?: string;
}

/**
 * Some schedules show only a first name even though the same person is listed
 * under their full name elsewhere. Keep the aliases scoped to a school so a
 * common first name is never merged with the wrong instructor.
 */
const INSTRUCTOR_ALIASES: Partial<Record<School, Record<string, string>>> = {
  "Oye!": {
    Filip: "Filip Wojcieszak",
    Gosia: "Gosia Koszewnik",
  },
  "Warsaw Salsa Club": {
    Anyelo: "Anyelo Marty",
  },
};

/**
 * Public, stable fallbacks for people whose current school card does not have
 * a photo. Scraped school data always wins when it becomes available later.
 */
const CURATED_INSTRUCTOR_PROFILES: Record<string, CuratedInstructorProfile> = {
  "Anyelo Marty": {
    photoUrl:
      "https://krajownik-prod-lunfhr.s3.eu-central-1.amazonaws.com/public/event/thumbnails/event-2026-07-18-12-38-02-SlfDgfab.webp",
    profileUrl: "https://caribbeanfestival.pl/artysci",
    bio: "Instruktor i animator z Dominikany, specjalizujący się w bachacie dominikańskiej, merengue i salsie.",
  },
  "Bartek Grunt": {
    photoUrl: "https://api.taksidi.pl/static/offer/attraction/85853742.jpg",
    profileUrl: "https://abra-studio.pl/abra-team/",
  },
  "Filip Wojcieszak": {
    photoUrl:
      "https://salsalibre.pl/wp-content/uploads/elementor/thumbs/Profile_Filip-Wojcieszak-rnakapxqmdq0udb6egf12iyq7sandyvgf4vcw8nm1o.png",
    profileUrl: "https://salsalibre.pl/instruktor/filip-wojcieszak/",
  },
  "Grzegorz Winiarek": {
    photoUrl: "https://api.taksidi.pl/static/offer/attraction/420742253.jpg",
    profileUrl: "https://salsaclasica.pl/zespol/grzegorz-winiarek/",
    bio: "Jeden z pionierów bachaty sensual w Warszawie, wieloletni instruktor, DJ i finalista międzynarodowych zawodów BachataStars.",
  },
  "Karolina Winiarek": {
    photoUrl: "https://api.taksidi.pl/static/offer/attraction/420742253.jpg",
    profileUrl: "https://salsaclasica.pl/zespol/karolina-winiarek/",
    bio: "Instruktorka i choreografka łącząca bachatę z doświadczeniem scenicznym, baletowym i współczesnym; medalistka międzynarodowych zawodów BachataStars.",
  },
  "Maja Modliszewska": {
    photoUrl: "https://dancepro.pl/wp-content/uploads/2022/08/Maja-Modliszewska-300x300.jpg",
    profileUrl: "https://dancepro.pl/profile/maja-modliszewska/",
  },
  "Paweł Tomkiewicz": {
    photoUrl: "https://summersalsatrip.com/wp-content/uploads/2019/01/DARIA-I-PAWE%C5%81.jpg",
    profileUrl: "https://summersalsatrip.com/speaker/daria-pawel/",
  },
};

function withFallbacks(
  names: string[],
  originalNames: string[],
  existing: Record<string, string> | undefined,
  field: "photoUrl" | "profileUrl" | "bio"
): Record<string, string> | undefined {
  const result: Record<string, string> = {};

  names.forEach((name, index) => {
    const originalName = originalNames[index];
    const value = existing?.[name] ?? existing?.[originalName] ?? CURATED_INSTRUCTOR_PROFILES[name]?.[field];
    if (value) result[name] = value;
  });

  return Object.keys(result).length > 0 ? result : undefined;
}

/** Normalize known aliases and enrich a schedule row without mutating DB data. */
export function enrichInstructorProfiles(row: ClassRow): ClassRow {
  const originalNames = splitInstructors(row.instructor);
  if (originalNames.length === 0) return row;

  const aliases = INSTRUCTOR_ALIASES[row.school] ?? {};
  const names = originalNames.map((name) => aliases[name] ?? name);
  const instructorBios = withFallbacks(names, originalNames, row.instructorBios, "bio");

  return {
    ...row,
    instructor: names.join(", "),
    instructorBio:
      names.length === 1
        ? row.instructorBio ?? instructorBios?.[names[0]]
        : row.instructorBio,
    instructorBios,
    instructorPhotos: withFallbacks(names, originalNames, row.instructorPhotos, "photoUrl"),
    instructorProfileUrls: withFallbacks(names, originalNames, row.instructorProfileUrls, "profileUrl"),
  };
}
