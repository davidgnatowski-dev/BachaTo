import assert from "node:assert/strict";
import test from "node:test";
import type { ClassRow } from "../lib/types";
import { isCancelledClass, scheduleDatesForFilter, scheduleOccurrencesForDates, specificDateFromTitle } from "../lib/schedule";

function row(overrides: Partial<ClassRow>): ClassRow {
  return {
    id: 1,
    school: "Salsa Libre",
    externalId: "class-1",
    title: "Bachata Sensual",
    danceStyle: "Bachata",
    format: "partner",
    dayOfWeek: 5,
    startTime: "18:00",
    sourceUrl: "https://example.com",
    firstSeenAt: "2026-09-01T00:00:00.000Z",
    lastSeenAt: "2026-09-11T00:00:00.000Z",
    ...overrides,
  };
}

test("7-day filter starts today and contains exactly seven dates", () => {
  assert.deepEqual(scheduleDatesForFilter("week", new Date("2026-09-11T12:00:00")), [
    "2026-09-11",
    "2026-09-12",
    "2026-09-13",
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
  ]);
});

test("dated Salsa Libre rows appear only on their actual date", () => {
  const recurring = row({ id: 1, externalId: "recurring", dayOfWeek: 5 });
  const datedNextWeek = row({ id: 2, externalId: "dated", dayOfWeek: undefined, specificDate: "2026-09-18" });

  const firstWeek = scheduleOccurrencesForDates(
    [recurring, datedNextWeek],
    scheduleDatesForFilter("week", new Date("2026-09-11T12:00:00"))
  );
  assert.deepEqual(firstWeek.map(({ row: item, dateIso }) => [item.externalId, dateIso]), [["recurring", "2026-09-11"]]);

  const selectedFriday = scheduleOccurrencesForDates(
    [recurring, datedNextWeek],
    scheduleDatesForFilter("5", new Date("2026-09-12T12:00:00"))
  );
  assert.deepEqual(selectedFriday.map(({ row: item, dateIso }) => [item.externalId, dateIso]), [
    ["recurring", "2026-09-18"],
    ["dated", "2026-09-18"],
  ]);
});

test("cancellation markers are recognized regardless of Polish accents", () => {
  assert.equal(isCancelledClass(row({ location: "ZAJĘCIA ODWOŁANE" })), true);
  assert.equal(isCancelledClass(row({ description: "Dzisiejsze zajecia odwolane" })), true);
  assert.equal(isCancelledClass(row({ location: "Sala 1" })), false);
});

test("one-off dates embedded in school titles are recovered", () => {
  const reference = new Date("2026-09-11T12:00:00");
  assert.equal(specificDateFromTitle("Bachata Ladies Styling 10.10", reference), "2026-10-10");
  assert.equal(specificDateFromTitle("Bachata Sensual 17-18.10", reference), "2026-10-17");
  assert.equal(specificDateFromTitle("Regularna Bachata P2", reference), undefined);
});
