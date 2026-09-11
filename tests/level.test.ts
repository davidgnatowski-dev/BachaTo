import assert from "node:assert/strict";
import test from "node:test";
import { classifyLevel } from "../lib/level";

test("recognizes every common spelling of the intermediate level", () => {
  assert.equal(classifyLevel("Średniozaawansowany"), "intermediate");
  assert.equal(classifyLevel("Średnio zaawansowany"), "intermediate");
  assert.equal(classifyLevel("Srednio-zaawansowany"), "intermediate");
  assert.equal(classifyLevel("Intermediate"), "intermediate");
  assert.equal(classifyLevel("Średniozaawansowany (P4/S1)"), "intermediate");
  assert.equal(classifyLevel("S1"), "intermediate");
});

test("does not let broader labels hide pre-master and English beginner levels", () => {
  assert.equal(classifyLevel("Pre-Master"), "advanced");
  assert.equal(classifyLevel("Beginner"), "starter");
  assert.equal(classifyLevel("Improver"), "elementary");
});
