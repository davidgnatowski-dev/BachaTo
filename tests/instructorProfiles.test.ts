import assert from "node:assert/strict";
import test from "node:test";
import { enrichInstructorProfiles } from "../lib/instructorProfiles";
import type { ClassRow } from "../lib/types";

function row(overrides: Partial<ClassRow>): ClassRow {
  return {
    id: 1,
    school: "Oye!",
    externalId: "class-1",
    title: "Bachata",
    danceStyle: "Bachata",
    format: "partner",
    instructor: "Filip, Gosia",
    sourceUrl: "https://example.com",
    firstSeenAt: "2026-09-01T00:00:00.000Z",
    lastSeenAt: "2026-09-11T00:00:00.000Z",
    ...overrides,
  };
}

test("expands school-scoped instructor aliases and adds a verified profile photo", () => {
  const result = enrichInstructorProfiles(row({}));

  assert.equal(result.instructor, "Filip Wojcieszak, Gosia Koszewnik");
  assert.match(result.instructorPhotos?.["Filip Wojcieszak"] ?? "", /Filip-Wojcieszak/);
  assert.equal(result.instructorPhotos?.["Gosia Koszewnik"], undefined);
  assert.equal(result.instructorProfileUrls?.["Filip Wojcieszak"], "https://salsalibre.pl/instruktor/filip-wojcieszak/");
});

test("keeps freshly scraped profile data ahead of curated fallbacks", () => {
  const result = enrichInstructorProfiles(
    row({
      school: "Abra Studio",
      instructor: "Maja Modliszewska",
      instructorPhotos: { "Maja Modliszewska": "https://school.example/current.jpg" },
      instructorProfileUrls: { "Maja Modliszewska": "https://school.example/maja" },
    })
  );

  assert.equal(result.instructorPhotos?.["Maja Modliszewska"], "https://school.example/current.jpg");
  assert.equal(result.instructorProfileUrls?.["Maja Modliszewska"], "https://school.example/maja");
});
