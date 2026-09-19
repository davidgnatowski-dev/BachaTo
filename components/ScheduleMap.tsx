"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ClassRow, School } from "@/lib/types";
import { SCHOOL_COORDS } from "@/lib/schools";
import { pluralizeSchools } from "@/lib/events";
import { schoolAddress, schoolTextClass, formatDuration, pluralizeClasses } from "@/lib/schedule";
import { classifyLevel, levelStyle, levelShortCode } from "@/lib/level";
import { ClassDetailModal } from "@/components/ClassDetailModal";

const WARSAW_BOUNDS: [[number, number], [number, number]] = [
  [20.85, 52.14],
  [21.16, 52.32],
];
const SCHOOLS = Object.keys(SCHOOL_COORDS) as School[];

/**
 * One pin per school (classes don't carry their own coordinates, only the
 * school's studio address does). Clicking a pin selects that school; its
 * currently-filtered classes list in the sidebar, and clicking one of those
 * opens the same ClassDetailModal used everywhere else in the schedule.
 */
export function ScheduleMap({ rows, allRows }: { rows: ClassRow[]; allRows: ClassRow[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersRef = useRef<Map<School, { marker: maplibregl.Marker; el: HTMLButtonElement }>>(new Map());
  const [ready, setReady] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [modalRow, setModalRow] = useState<ClassRow | null>(null);

  const bySchool = useMemo(() => {
    const map = new Map<School, ClassRow[]>();
    for (const row of rows) {
      const list = map.get(row.school) ?? [];
      list.push(row);
      map.set(row.school, list);
    }
    for (const list of map.values()) list.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
    return map;
  }, [rows]);

  const schoolsWithClasses = useMemo(() => SCHOOLS.filter((s) => (bySchool.get(s)?.length ?? 0) > 0), [bySchool]);
  // Derived, not stored: falls back to the first school whenever the explicit selection is missing or filtered out.
  const effectiveSelectedSchool = selectedSchool && schoolsWithClasses.includes(selectedSchool) ? selectedSchool : (schoolsWithClasses[0] ?? null);

  // Map lifecycle: identical StrictMode-safe create/destroy guard as EventMap — see there for why.
  useEffect(() => {
    if (removeTimerRef.current !== null) {
      clearTimeout(removeTimerRef.current);
      removeTimerRef.current = null;
      return () => {
        removeTimerRef.current = setTimeout(() => {
          mapRef.current?.remove();
          mapRef.current = null;
          removeTimerRef.current = null;
        }, 0);
      };
    }

    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [21.0, 52.225],
      zoom: 11.2,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm-base", type: "raster", source: "osm-tiles", paint: { "raster-saturation": -0.72, "raster-brightness-min": 0.12, "raster-brightness-max": 0.72, "raster-contrast": 0.25 } }],
      },
    });

    map.on("error", (e) => console.error("Map error:", e.error?.message ?? e));
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.on("load", () => {
      map.fitBounds(WARSAW_BOUNDS, { padding: 32, duration: 0 });
      setReady(true);
    });

    mapRef.current = map;
    return () => {
      removeTimerRef.current = setTimeout(() => {
        map.remove();
        mapRef.current = null;
        removeTimerRef.current = null;
      }, 0);
    };
  }, []);

  // Pins: created once per school and kept in the DOM — only added/removed when the set of
  // schools with matching classes actually changes. Selecting a school (below) just restyles
  // the existing button in place instead of tearing it down, so a click can never land on a
  // marker that gets replaced out from under the cursor mid-click.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const current = markersRef.current;
    const wanted = new Set(schoolsWithClasses);

    for (const [school, entry] of current) {
      if (!wanted.has(school)) {
        entry.marker.remove();
        current.delete(school);
      }
    }

    for (const school of schoolsWithClasses) {
      const count = bySchool.get(school)?.length ?? 0;
      const label = `${school} — ${count} ${pluralizeClasses(count)}, pokaż szczegóły`;
      const existing = current.get(school);
      if (existing) {
        existing.el.textContent = String(count);
        existing.el.setAttribute("aria-label", label);
        continue;
      }
      const coord = SCHOOL_COORDS[school];
      const el = document.createElement("button");
      el.type = "button";
      el.textContent = String(count);
      el.setAttribute("aria-label", label);
      // Base look, set once — MapLibre appends its own "maplibregl-marker" classes on
      // .addTo() below, so the active/inactive toggle afterwards must never overwrite
      // el.className wholesale (that would wipe MapLibre's own classes too).
      el.className = "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border-2 px-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-110";
      el.onclick = (e) => {
        e.stopPropagation();
        focusSchool(school);
      };
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([coord.lon, coord.lat]).addTo(map);
      current.set(school, { marker, el });
    }
    // No cleanup here on purpose: this effect re-runs on every filter change and must not tear
    // down markers that are still wanted — the stale-removal loop above already handles that.
  }, [ready, schoolsWithClasses, bySchool]);

  // Only on true unmount: remove every marker still on the map.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const [, entry] of markers) entry.marker.remove();
      markers.clear();
    };
  }, []);

  // Restyle the selected/unselected pins in place whenever the selection changes — toggling
  // individual classes (not replacing className) so MapLibre's own marker classes survive.
  useEffect(() => {
    for (const [school, entry] of markersRef.current) {
      const active = effectiveSelectedSchool === school;
      entry.el.classList.toggle("border-white", active);
      entry.el.classList.toggle("bg-accent", active);
      entry.el.classList.toggle("ring-4", active);
      entry.el.classList.toggle("ring-accent/40", active);
      entry.el.classList.toggle("border-white/90", !active);
      entry.el.classList.toggle("bg-violet", !active);
    }
  }, [effectiveSelectedSchool, schoolsWithClasses]);

  function focusSchool(school: School) {
    setSelectedSchool(school);
    const coord = SCHOOL_COORDS[school];
    const map = mapRef.current;
    if (map) map.flyTo({ center: [coord.lon, coord.lat], zoom: Math.max(map.getZoom(), 14), duration: 550 });
  }

  const selectedRows = effectiveSelectedSchool ? bySchool.get(effectiveSelectedSchool) ?? [] : [];

  if (schoolsWithClasses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
        Brak zajęć spełniających wybrane kryteria do pokazania na mapie.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,.35)]">
      <div className="grid min-h-[600px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[440px] lg:min-h-[600px]">
          <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" aria-label="Interaktywna mapa szkół tańca" />
          {!ready && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-sm text-muted">Ładuję mapę…</div>}
          <div className="pointer-events-none absolute left-3 top-3 z-10">
            <span className="rounded-full border border-white/15 bg-zinc-950/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
              {schoolsWithClasses.length} {pluralizeSchools(schoolsWithClasses.length)} na mapie
            </span>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col border-t border-line bg-[#0d1019] lg:max-h-[600px] lg:border-l lg:border-t-0">
          <div className="border-b border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Szkoły</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {schoolsWithClasses.map((school) => (
                <button
                  key={school}
                  type="button"
                  onClick={() => focusSchool(school)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    effectiveSelectedSchool === school ? "bg-accent text-white" : "border border-line text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {school} · {bySchool.get(school)?.length}
                </button>
              ))}
            </div>
          </div>

          {effectiveSelectedSchool && (
            <div className="border-b border-violet/20 bg-violet/[0.07] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet">Wybrana szkoła</p>
              <h2 className={`mt-1 font-heading text-base font-semibold ${schoolTextClass(effectiveSelectedSchool)}`}>{effectiveSelectedSchool}</h2>
              <p className="mt-1 text-xs text-muted">{schoolAddress(effectiveSelectedSchool)}</p>
              <p className="mt-1 text-xs text-zinc-300">
                {selectedRows.length} {pluralizeClasses(selectedRows.length)} pasujących do filtrów
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {selectedRows.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Brak zajęć tej szkoły pasujących do filtrów.</p>
            ) : (
              selectedRows.map((row) => {
                const bucket = classifyLevel(row.level);
                const duration = formatDuration(row.startTime, row.endTime);
                return (
                  <button
                    key={`${row.school}-${row.id}`}
                    type="button"
                    onClick={() => setModalRow(row)}
                    className="flex w-full items-start gap-3 border-b border-line/70 p-4 text-left transition-colors last:border-b-0 hover:bg-zinc-900"
                  >
                    <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-accent">{row.startTime ?? "?"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-5 text-zinc-100">{row.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {row.level && <span className={`font-semibold ${levelStyle(bucket).text}`}>{levelShortCode(row.level, bucket)}</span>}
                        {row.level && duration ? " · " : ""}
                        {duration}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {modalRow && <ClassDetailModal row={modalRow} allRows={allRows} onClose={() => setModalRow(null)} />}
    </div>
  );
}
