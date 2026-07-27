"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MeshBasicMaterial } from "three";
import type { GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { COUNTRY_BY_NUMERIC } from "@/data/countries";

// react-globe.gl touches window at import time — load it client-only so SSR
// (BorderBlitz imports this component directly) never evaluates it on the server.
// GlobeInner re-exposes the instance ref as a `globeRef` prop, because a
// next/dynamic boundary does not reliably forward `ref`.
const Globe = dynamic(() => import("./GlobeInner"), { ssr: false });

/** Camera distance used when flying to a country. */
const FLY_ALTITUDE = 1.5;
const FLY_MS = 1200;

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
// High-contrast palette: the page background is near-black (#080810), so a deep
// blue ocean with clearly lighter land reads strongly in dark or light mode.
const LAND_COLOR = "#8fb6dd";
const OCEAN_COLOR = "#0e2440";   // the sphere itself
// Canvas background — matches the page shell so the globe doesn't sit in a
// visible dark-blue slab.
const CANVAS_BG = "#090d16";
const BORDER_COLOR = "#0b1a2e";   // country outlines — dark against the light land
const EQUATOR_COLOR = "#ffe600";
const MYSTERY_COLOR = "#00ff41";

// Equator as one densely-sampled path so it curves smoothly around the sphere.
const EQUATOR: [number, number][][] = [
  Array.from({ length: 181 }, (_, i) => [0, -180 + i * 2] as [number, number]),
];

interface Props {
  colorMap: Record<number, string>;
  /** Phase 2: heat dots for polygon-less microstates. Accepted but not yet drawn. */
  markers?: { lng: number; lat: number; color: string }[];
  mysteryNumeric?: number;
  /** ISO numeric of the latest guess — camera flies to it (auto-zoom). */
  zoomTarget?: number;
  /** Fresh object per guess-list click — camera flies back to that country. */
  flyTo?: { lng: number; lat: number };
}

// MeshBasicMaterial is unshaded — 100% flat, immune to scene lighting, so there
// are no shadows/seams on the sphere tessellation. Cache one material per color.
const matCache = new Map<string, MeshBasicMaterial>();
function materialFor(color: string): MeshBasicMaterial {
  let m = matCache.get(color);
  if (!m) { m = new MeshBasicMaterial({ color }); matCache.set(color, m); }
  return m;
}

/** Lat/lng bounding box of a GeoJSON feature (handles Polygon + MultiPolygon). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bboxOf(f: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  const g = f?.geometry;
  if (!g) return null;
  const rings: number[][][] = g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : [];
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180, seen = false;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      seen = true;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }
  return seen ? { minLat, maxLat, minLng, maxLng } : null;
}

/**
 * Camera altitude that frames a country properly: tiny states (Vatican,
 * Singapore) zoom right in, huge ones (Russia, Canada) stay far enough out to
 * fit. Falls back to a mid distance when the country has no polygon.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function altitudeFor(feature: any): number {
  const b = bboxOf(feature);
  if (!b) return FLY_ALTITUDE;
  const midLat = (b.minLat + b.maxLat) / 2;
  // Longitude degrees shrink toward the poles, so weight them by cos(lat).
  const spanLng = (b.maxLng - b.minLng) * Math.cos((midLat * Math.PI) / 180);
  const spanDeg = Math.max(b.maxLat - b.minLat, Math.abs(spanLng));
  // ~0.03 altitude per degree of extent, clamped to a usable range.
  return Math.min(2.2, Math.max(0.18, spanDeg * 0.03));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geoCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCountries(): Promise<any> {
  if (geoCache) return geoCache;
  const world = await fetch(GEO_URL).then((r) => r.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(world, world.objects.countries) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fc.features.forEach((f: any) => { f.properties = { ...f.properties, id: parseInt(f.id, 10) }; });
  geoCache = fc;
  return fc;
}

export function WorldMapGlobe({ colorMap, mysteryNumeric, zoomTarget, flyTo }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null);

  useEffect(() => { fetchCountries().then(setGeo); }, []);

  // Render at the device pixel ratio — react-globe.gl leaves it at 1, which is
  // what makes the borders/coastlines look pixelated. Capped at 2 for perf.
  useEffect(() => {
    if (!(size.w > 0 && geo)) return;
    const id = requestAnimationFrame(() => {
      const r = globeRef.current?.renderer();
      if (r) r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    });
    return () => cancelAnimationFrame(id);
  }, [size.w, size.h, geo]);

  // Action A — auto-zoom: a new guess sets zoomTarget (ISO numeric); fly there,
  // with the distance scaled to that country's real size.
  useEffect(() => {
    if (zoomTarget === undefined) return;
    const c = COUNTRY_BY_NUMERIC[zoomTarget];
    if (!c) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = geo?.features?.find((x: any) => x.properties?.id === zoomTarget);
    globeRef.current?.pointOfView({ lat: c.lat, lng: c.lng, altitude: altitudeFor(f) }, FLY_MS);
  }, [zoomTarget, geo]);

  // Action B — click-to-fly: a fresh flyTo object (new identity per guess-list
  // click) re-triggers this, so clicking the same row twice still flies.
  useEffect(() => {
    if (!flyTo) return;
    globeRef.current?.pointOfView({ lat: flyTo.lat, lng: flyTo.lng, altitude: FLY_ALTITUDE }, FLY_MS);
  }, [flyTo]);

  // Measure the container in a layout effect (before paint) so the FIRST
  // measurement — the one that gates the Globe's initial mount below — always
  // happens synchronously, never from inside a ResizeObserver callback.
  //
  // Do NOT mount the Globe from a ResizeObserver callback: react-globe.gl ends up
  // with a live renderer that never produces frames (isolated in a Case D/E/F
  // bisect). This component used to survive by accident — its GeoJSON fetch
  // resolved after the observer, so the mount was triggered by the fetch. Once
  // that JSON is HTTP-cached the order flips and the globe goes blank.
  //
  // A plain "resize" listener isn't enough, though: this container's height is
  // set by its flex-1 slot next to the guess-history sidebar, and that sidebar
  // grows/shrinks as guesses are added — a pure React re-render, not a window
  // resize. Without re-measuring then, the canvas keeps its stale (taller,
  // pre-guesses) size and visually bleeds into the history list below it,
  // eating the touch/scroll events meant for it. A ResizeObserver on the
  // already-mounted container is safe here because it only ever updates
  // `size` (width/height props on an existing Globe instance) — it never
  // decides whether to mount Globe in the first place, which stays gated by
  // the synchronous measure() below.
  useLayoutEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  // Base sphere: flat dark ocean, no texture, no atmosphere.
  const globeMaterial = useState(() => new MeshBasicMaterial({ color: OCEAN_COLOR }))[0];
  const sideMaterial = useState(() => new MeshBasicMaterial({ color: LAND_COLOR }))[0];

  // Cap colour = guess heat colour (green on reveal), else flat land.
  const polygonCapMaterial = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      const id = d?.properties?.id as number | undefined;
      const color =
        mysteryNumeric !== undefined && id === mysteryNumeric
          ? MYSTERY_COLOR
          : (id !== undefined && colorMap[id]) || LAND_COLOR;
      return materialFor(color);
    },
    [colorMap, mysteryNumeric],
  );

  const polygonSideMaterial = useCallback(() => sideMaterial, [sideMaterial]);

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: 260, background: CANVAS_BG }}>
      {size.w > 0 && geo && (
        <Globe
          globeRef={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor={CANVAS_BG}
          showAtmosphere={false}
          globeMaterial={globeMaterial}
          polygonsData={geo.features}
          polygonAltitude={0.005}
          polygonCapMaterial={polygonCapMaterial}
          polygonSideMaterial={polygonSideMaterial}
          polygonStrokeColor={() => BORDER_COLOR}
          polygonsTransitionDuration={0}
          pathsData={EQUATOR}
          pathColor={() => EQUATOR_COLOR}
          pathStroke={1.2}
          pathPointLat={(p: unknown) => (p as [number, number])[0]}
          pathPointLng={(p: unknown) => (p as [number, number])[1]}
          pathTransitionDuration={0}
          // alpha lets the canvas blend with the page; antialias + the DPR set
          // below keep the coastlines and borders crisp on retina screens.
          // alpha lets the canvas blend with the page; antialias + the DPR below
          // keep coastlines and borders crisp instead of pixelated.
          rendererConfig={{ antialias: true, alpha: true }}
        />
      )}
    </div>
  );
}

export default WorldMapGlobe;
