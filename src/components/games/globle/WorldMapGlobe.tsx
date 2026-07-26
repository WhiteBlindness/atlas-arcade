"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
const OCEAN_COLOR = "#0e2440";
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

  // Action A — auto-zoom: a new guess sets zoomTarget (ISO numeric); fly there.
  useEffect(() => {
    if (zoomTarget === undefined) return;
    const c = COUNTRY_BY_NUMERIC[zoomTarget];
    if (c) globeRef.current?.pointOfView({ lat: c.lat, lng: c.lng, altitude: FLY_ALTITUDE }, FLY_MS);
  }, [zoomTarget]);

  // Action B — click-to-fly: a fresh flyTo object (new identity per guess-list
  // click) re-triggers this, so clicking the same row twice still flies.
  useEffect(() => {
    if (!flyTo) return;
    globeRef.current?.pointOfView({ lat: flyTo.lat, lng: flyTo.lng, altitude: FLY_ALTITUDE }, FLY_MS);
  }, [flyTo]);

  // react-globe.gl needs explicit pixel dimensions — track the container size so
  // the canvas fills it (a 0×0 canvas would look like another blank globe).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
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
    <div ref={containerRef} className="relative w-full h-full" style={{ minHeight: 260, background: OCEAN_COLOR }}>
      {size.w > 0 && geo && (
        <Globe
          globeRef={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor={OCEAN_COLOR}
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
          rendererConfig={{ antialias: true }}
        />
      )}
    </div>
  );
}

export default WorldMapGlobe;
