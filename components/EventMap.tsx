"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, type MapGeoJSONFeature } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { EventRow } from "@/lib/types";
import { CATEGORY_LABELS, eventHref, formatEventDateRange, relativeEventLabel } from "@/lib/events";
import { CalendarIcon, PinIcon } from "@/components/icons";

const POLAND_BOUNDS: [[number, number], [number, number]] = [[14.0, 48.8], [24.3, 55.1]];
const EVENT_SOURCE = "bachato-events";
const CLUSTERS = "bachato-clusters";
const CLUSTER_COUNT = "bachato-cluster-count";
const POINTS = "bachato-event-points";

const CATEGORY_COLORS: Record<EventRow["category"], string> = {
  festival: "#d946ef",
  trip: "#34d399",
  social: "#fb923c",
  competition: "#38bdf8",
};

function mappedRows(rows: EventRow[]) {
  return rows.filter((row): row is EventRow & { latitude: number; longitude: number } =>
    Number.isFinite(row.latitude) && Number.isFinite(row.longitude)
  );
}

function toGeoJson(rows: Array<EventRow & { latitude: number; longitude: number }>): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: rows.map((row): Feature<Point> => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [row.longitude, row.latitude] },
      properties: { key: `${row.source}-${row.id}`, category: row.category },
    })),
  };
}

function eventKey(row: Pick<EventRow, "source" | "id">) {
  return `${row.source}-${row.id}`;
}

function idsInBounds(map: MapLibreMap, rows: Array<EventRow & { latitude: number; longitude: number }>) {
  const bounds = map.getBounds();
  return rows.filter((row) => bounds.contains([row.longitude, row.latitude])).map(eventKey);
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const right = new Set(b);
  return a.every((id) => right.has(id));
}

export function EventMap({ rows }: { rows: EventRow[] }) {
  const mapRows = useMemo(() => mappedRows(rows), [rows]);
  const hasMapRows = mapRows.length > 0;
  const rowsByKey = useMemo(() => new Map(mapRows.map((row) => [eventKey(row), row])), [mapRows]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsRef = useRef(mapRows);
  const visibleKeysRef = useRef(mapRows.map(eventKey));
  const [ready, setReady] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(mapRows[0] ? eventKey(mapRows[0]) : null);
  const [visibleKeys, setVisibleKeysState] = useState(() => mapRows.map(eventKey));
  const [pendingKeys, setPendingKeys] = useState<string[] | null>(null);

  function setVisibleKeys(keys: string[]) {
    visibleKeysRef.current = keys;
    setVisibleKeysState(keys);
  }

  const selected = selectedKey ? rowsByKey.get(selectedKey) ?? null : null;
  const visibleRows = visibleKeys.map((key) => rowsByKey.get(key)).filter((row): row is EventRow & { latitude: number; longitude: number } => Boolean(row));

  useEffect(() => {
    rowsRef.current = mapRows;
  }, [mapRows]);

  useEffect(() => {
    // React 19 dev/StrictMode runs this effect mount -> cleanup -> mount
    // synchronously once. MapLibre doesn't survive being torn down and
    // immediately recreated on the same container (the second instance's
    // style silently never finishes loading), so defer the actual removal
    // by a tick and cancel it here if we're really just the StrictMode
    // remount reusing the still-live map from the phantom mount.
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

    if (!mapContainerRef.current || mapRef.current || !hasMapRows) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [19.15, 52.1],
      zoom: 5.35,
      minZoom: 4,
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
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false, showUserLocation: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource(EVENT_SOURCE, { type: "geojson", data: toGeoJson(rowsRef.current), cluster: true, clusterRadius: 52, clusterMaxZoom: 13 });
      map.addLayer({ id: CLUSTERS, type: "circle", source: EVENT_SOURCE, filter: ["has", "point_count"], paint: { "circle-color": ["step", ["get", "point_count"], "#7c3aed", 12, "#6d28d9", 30, "#4c1d95"], "circle-radius": ["step", ["get", "point_count"], 19, 12, 24, 30, 30], "circle-stroke-width": 3, "circle-stroke-color": "rgba(255,255,255,.9)", "circle-opacity": 0.94 } });
      map.addLayer({ id: CLUSTER_COUNT, type: "symbol", source: EVENT_SOURCE, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Open Sans Bold"] }, paint: { "text-color": "#ffffff" } });
      map.addLayer({ id: POINTS, type: "circle", source: EVENT_SOURCE, filter: ["!", ["has", "point_count"]], paint: { "circle-color": ["match", ["get", "category"], "festival", CATEGORY_COLORS.festival, "trip", CATEGORY_COLORS.trip, "social", CATEGORY_COLORS.social, "competition", CATEGORY_COLORS.competition, "#8b5cf6"], "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 7, 11, 10, 16, 13], "circle-stroke-width": 3, "circle-stroke-color": "#ffffff" } });
      map.fitBounds(POLAND_BOUNDS, { padding: 34, duration: 0 });
      setReady(true);
    });

    map.on("click", CLUSTERS, async (event) => {
      const feature = map.queryRenderedFeatures(event.point, { layers: [CLUSTERS] })[0] as MapGeoJSONFeature | undefined;
      const clusterId = Number(feature?.properties?.cluster_id);
      if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== "Point") return;
      const source = map.getSource(EVENT_SOURCE) as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom, duration: 500 });
    });

    map.on("click", POINTS, (event) => {
      const feature = event.features?.[0];
      const key = String(feature?.properties?.key ?? "");
      if (!key) return;
      setSelectedKey(key);
      if (feature?.geometry.type === "Point") map.easeTo({ center: feature.geometry.coordinates as [number, number], duration: 350 });
    });

    for (const layer of [CLUSTERS, POINTS]) {
      map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
    }

    map.on("moveend", () => {
      const next = idsInBounds(map, rowsRef.current);
      setPendingKeys(sameIds(next, visibleKeysRef.current) ? null : next);
    });

    mapRef.current = map;
    return () => {
      removeTimerRef.current = setTimeout(() => {
        map.remove();
        mapRef.current = null;
        removeTimerRef.current = null;
      }, 0);
    };
    // The map stays mounted while filters change. Row changes are synchronized below.
  }, [hasMapRows]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    (map.getSource(EVENT_SOURCE) as GeoJSONSource | undefined)?.setData(toGeoJson(mapRows));
    const allKeys = mapRows.map(eventKey);
    setVisibleKeys(allKeys);
    setPendingKeys(null);
    setSelectedKey((current) => current && !rowsByKey.has(current) ? (mapRows[0] ? eventKey(mapRows[0]) : null) : current);
  }, [mapRows, ready, rowsByKey]);

  function focusEvent(row: EventRow & { latitude: number; longitude: number }) {
    setSelectedKey(eventKey(row));
    const map = mapRef.current;
    map?.flyTo({ center: [row.longitude, row.latitude], zoom: Math.max(map.getZoom(), 10.5), duration: 650 });
  }

  if (mapRows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">Te wydarzenia nie mają jeszcze sprawdzonej lokalizacji na mapie. Nadal znajdziesz je w widoku listy.</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,.35)]">
      <div className="grid min-h-[660px] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative min-h-[520px] lg:min-h-[660px]">
          <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" aria-label="Interaktywna mapa wydarzeń" />
          {!ready && <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 text-sm text-muted">Ładuję mapę…</div>}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-zinc-950/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">{mapRows.length} wydarzeń na mapie</span>
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => <span key={category} className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-zinc-950/85 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-200 backdrop-blur sm:inline-flex"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{CATEGORY_LABELS[category as EventRow["category"]]}</span>)}
          </div>
          {pendingKeys && !sameIds(pendingKeys, visibleKeys) && <button type="button" onClick={() => { setVisibleKeys(pendingKeys); setPendingKeys(null); }} className="absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xl hover:bg-accent-dark sm:top-4">Szukaj w tym miejscu · {pendingKeys.length}</button>}
        </div>

        <aside className="flex min-h-0 flex-col border-t border-line bg-[#0d1019] lg:max-h-[660px] lg:border-l lg:border-t-0">
          <div className="border-b border-line p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Widoczny obszar</p>
            <div className="mt-1 flex items-end justify-between gap-3"><h2 className="font-heading text-lg font-semibold text-zinc-50">{visibleRows.length} {visibleRows.length === 1 ? "wydarzenie" : "wydarzeń"}</h2>{visibleRows.length !== mapRows.length && <button type="button" onClick={() => { mapRef.current?.fitBounds(POLAND_BOUNDS, { padding: 34, duration: 500 }); setVisibleKeys(mapRows.map(eventKey)); setPendingKeys(null); }} className="text-xs font-semibold text-accent">Pokaż całą Polskę</button>}</div>
          </div>

          {selected && <div className="border-b border-violet/20 bg-violet/[0.07] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet">Wybrane</p><h3 className="mt-1 line-clamp-2 font-heading text-base font-semibold text-zinc-50">{selected.title}</h3></div><span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: CATEGORY_COLORS[selected.category] }}>{CATEGORY_LABELS[selected.category]}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-300"><CalendarIcon className="h-3.5 w-3.5" />{formatEventDateRange(selected)}</p>{selected.city && <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><PinIcon className="h-3.5 w-3.5" />{[selected.venue, selected.city].filter(Boolean).join(", ")}</p>}<Link href={eventHref(selected)} className="mt-3 inline-flex text-xs font-semibold text-accent hover:text-accent-peach">Otwórz wydarzenie →</Link></div>}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleRows.length === 0 ? <p className="p-6 text-center text-sm text-muted">Brak wydarzeń w tym obszarze. Przesuń lub oddal mapę.</p> : visibleRows.map((row) => {
              const active = selectedKey === eventKey(row);
              const relative = relativeEventLabel(row.startDate);
              return <button key={eventKey(row)} type="button" onClick={() => focusEvent(row)} className={`flex w-full items-start gap-3 border-b border-line/70 p-4 text-left transition-colors last:border-b-0 ${active ? "bg-zinc-800/70" : "hover:bg-zinc-900"}`}><span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: CATEGORY_COLORS[row.category] }} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{CATEGORY_LABELS[row.category]}</span>{relative && <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">{relative}</span>}</span><span className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 text-zinc-100">{row.title}</span><span className="mt-1 block text-xs text-muted">{formatEventDateRange(row)}{row.city ? ` · ${row.city}` : ""}</span></span></button>;
            })}
          </div>
        </aside>
      </div>
      {rows.length > mapRows.length && <p className="border-t border-line bg-zinc-950 px-4 py-3 text-xs text-muted">{rows.length - mapRows.length} wydarzeń bez sprawdzonych współrzędnych pozostaje dostępnych w widoku listy.</p>}
    </div>
  );
}
