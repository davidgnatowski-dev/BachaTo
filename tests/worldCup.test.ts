import assert from "node:assert/strict";
import test from "node:test";
import { parseBachataSocialWorldCupHtml } from "../lib/scrapers/bachataSocialWorldCup";

test("parses a World Cup qualifier with registration and advancement details", () => {
  const html = `
    <div class="animate-card-entrance">
      <div>Registration Open</div>
      <div class="flex-1">
        <a href="/qualifiers/poland-qualifier-warsaw-2026"><h3>Poland Qualifier - Warsaw</h3></a>
        <p>elSol Fall Festival</p>
        <div class="inline-flex"><span>European</span></div>
      </div>
      <div><svg class="lucide-map-pin"></svg><span>Warsaw, Poland</span></div>
      <div><svg class="lucide-calendar"></svg><span>November 13, 2026</span></div>
      <div><svg class="lucide-target"></svg><span>Open Registration</span></div>
      <div><svg class="lucide-banknote"></svg><span>Registration price: €25.00</span></div>
      <div><svg class="lucide-users"></svg><span>0 / 120 total spots occupied</span></div>
      <div><span>Leaders:</span><span>0 / 60 spots occupied</span></div>
      <div><span>Followers:</span><span>0 / 60 spots occupied</span></div>
      <div><svg class="lucide-trophy"></svg><span>Qualifies for</span><span>World Cup Finals 2027</span><span class="font-bold">1</span><span>L</span><span class="font-bold">1</span><span>F</span></div>
    </div>`;

  const [event] = parseBachataSocialWorldCupHtml(html);
  assert.equal(event.externalId, "poland-qualifier-warsaw-2026");
  assert.equal(event.category, "competition");
  assert.equal(event.city, "Warszawa");
  assert.equal(event.organizer, "elSol Fall Festival");
  assert.equal(event.startDate, "2026-11-13");
  assert.equal(event.title, "Eliminacje — Polska — Warszawa");
  assert.equal(event.competitionSeries, "Bachata Social World Cup 2026/2027");
  assert.equal(event.competitionStage, "qualifier");
  assert.equal(event.qualifiesFor, "Finał Bachata Social World Cup 2027 w Genewie");
  assert.equal(event.registrationStatus, "open");
  assert.equal(event.registrationPrice, "€25.00");
  assert.equal(event.qualifyingSpotsLeaders, 1);
  assert.equal(event.qualifyingSpotsFollowers, 1);
  assert.match(event.description ?? "", /Koszt zgłoszenia: €25\.00/);
  assert.match(event.description ?? "", /Zajęte miejsca: 0\/120/);
  assert.match(event.description ?? "", /Lokalizacja: Warszawa, Polska/);
  assert.match(event.description ?? "", /Awans do: Finał Bachata Social World Cup 2027 w Genewie — 1 Leader, 1 Follower/);
  assert.doesNotMatch(event.description ?? "", /Open Registration/);
});

test("parses a multi-date cup series without inventing a registration mode", () => {
  const html = `
    <div class="animate-card-entrance">
      <div>Registration Closed</div>
      <div class="flex-1">
        <a href="/qualifiers/north-american-cup-2027"><h3>North American Cup</h3></a>
        <p>Bachata Social World Cup</p>
        <div class="inline-flex"><span>North American Cup</span></div>
      </div>
      <div><svg class="lucide-calendar"></svg><span>May 22, 2026 – Jun 6, 2027</span></div>
      <div><svg class="lucide-target"></svg><span>12 qualifying events</span></div>
    </div>`;

  const [event] = parseBachataSocialWorldCupHtml(html);
  assert.equal(event.startDate, "2026-05-22");
  assert.equal(event.endDate, "2027-06-06");
  assert.equal(event.registrationStatus, "through_qualifiers");
  assert.match(event.description ?? "", /Cykl obejmuje 12 wydarzeń kwalifikacyjnych/);
  assert.doesNotMatch(event.description ?? "", /Tryb kwalifikacji/);
});
