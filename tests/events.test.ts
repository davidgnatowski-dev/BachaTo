import assert from "node:assert/strict";
import test from "node:test";
import type { EventRow } from "../lib/types";
import { groupCompetitionSeries, isCuratedEventSuppressed } from "../lib/events";

function competition(overrides: Partial<EventRow>): EventRow {
  return {
    id: 1,
    source: "Test",
    externalId: "test-event",
    category: "competition",
    title: "Konkurs",
    startDate: "2027-01-01",
    sourceUrl: "https://example.com",
    firstSeenAt: "2026-09-11T00:00:00.000Z",
    lastSeenAt: "2026-09-11T00:00:00.000Z",
    ...overrides,
  };
}

test("groups qualifiers before their final and leaves independent contests separate", () => {
  const final = competition({ id: 3, externalId: "final", title: "Finał", startDate: "2027-10-08", competitionSeries: "Puchar", competitionStage: "final" });
  const laterQualifier = competition({ id: 2, externalId: "q2", startDate: "2027-02-01", competitionSeries: "Puchar", competitionStage: "qualifier" });
  const earlierQualifier = competition({ id: 1, externalId: "q1", startDate: "2027-01-01", competitionSeries: "Puchar", competitionStage: "qualifier" });
  const standalone = competition({ id: 4, externalId: "solo", startDate: "2026-12-01" });

  const grouped = groupCompetitionSeries([final, laterQualifier, standalone, earlierQualifier]);

  assert.equal(grouped.series.length, 1);
  assert.equal(grouped.series[0].name, "Puchar");
  assert.deepEqual(grouped.series[0].qualifiers.map((event) => event.externalId), ["q1", "q2"]);
  assert.deepEqual(grouped.series[0].finals.map((event) => event.externalId), ["final"]);
  assert.deepEqual(grouped.standalone.map((event) => event.externalId), ["solo"]);
});

test("suppresses the obsolete Tensy date for Bachata Libre", () => {
  assert.equal(isCuratedEventSuppressed({ source: "Tensy", externalId: "42f09c3c-a8a1-4e10-a4a8-597c17bc65af" }), true);
  assert.equal(isCuratedEventSuppressed({ source: "Szkoły", externalId: "2027-03-06-Bachata Libre Competition 2027" }), false);
});
