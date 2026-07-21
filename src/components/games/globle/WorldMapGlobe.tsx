"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { MeshBasicMaterial } from "three";
import { feature } from "topojson-client";

// react-globe.gl touches window at import time — load it client-only so SSR
// (BorderBlitz imports this component directly) never evaluates it on the server.
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const LAND_COLOR = "#0a111d";   // flat land (solid, matches the arcade dark bg)
const OCEAN_COLOR = "#080810";  // base sphere / background
const MYSTERY_COLOR = "#00ff41";

interface Props {
  colorMap: Record<number, string>;
  /** Phase 2: heat dots for polygon-less microstates. Accepted but not yet drawn. */
  markers?: { lng: number; lat: number; color: string }[];
  mysteryNumeric?: number;
  /** Phase 2: pointOfView fly-to. Accepted but not yet wired. */
  zoomTarget?: number;
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

export function WorldMapGlobe({ colorMap, mysteryNumeric }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null);

  useEffect(() => { fetchCountries().then(setGeo); }, []);

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
          width={size.w}
          height={size.h}
          backgroundColor={OCEAN_COLOR}
          showAtmosphere={false}
          globeMaterial={globeMaterial}
          polygonsData={geo.features}
          polygonAltitude={0.005}
          polygonCapMaterial={polygonCapMaterial}
          polygonSideMaterial={polygonSideMaterial}
          polygonsTransitionDuration={0}
          rendererConfig={{ antialias: true }}
        />
      )}
    </div>
  );
}

export default WorldMapGlobe;
