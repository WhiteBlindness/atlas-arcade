"use client";

import { useEffect, useState, useRef } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 800;
const H = 450;
const ZOOM_FACTOR = 4;
const ZOOM_HOLD_MS = 1800;
const ANIM_MS = 550;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let worldCache: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWorld(): Promise<any> {
  if (worldCache) return worldCache;
  const res = await fetch(GEO_URL);
  worldCache = await res.json();
  return worldCache;
}

interface GeoPathEntry { id: number; d: string; cx: number; cy: number; }

interface Props {
  colorMap: Record<number, string>;
  mysteryNumeric?: number;
  zoomTarget?: number;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

interface CancelToken { cancelled: boolean; }

function animateViewBox(
  from: [number, number, number, number],
  to: [number, number, number, number],
  ms: number,
  set: (vb: string) => void,
  token: CancelToken,
  onDone?: () => void,
) {
  const start = performance.now();
  function step(now: number) {
    if (token.cancelled) return;
    const t = easeInOut(Math.min(1, (now - start) / ms));
    const vb = from.map((f, i) => f + (to[i] - f) * t);
    set(`${vb[0]} ${vb[1]} ${vb[2]} ${vb[3]}`);
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  }
  requestAnimationFrame(step);
}

export function WorldMap({ colorMap, mysteryNumeric, zoomTarget }: Props) {
  const [paths, setPaths] = useState<GeoPathEntry[]>([]);
  const [viewBox, setViewBox] = useState(`0 0 ${W} ${H}`);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const tokenRef = useRef<CancelToken>({ cancelled: false });

  useEffect(() => {
    fetchWorld().then((world) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countries = feature(world, world.objects.countries) as any;
      const projection = geoNaturalEarth1().fitSize([W, H], countries);
      const pathGen = geoPath(projection);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const built: GeoPathEntry[] = countries.features
        .map((f: any) => {
          const id = parseInt(f.id, 10);
          const d = pathGen(f) ?? "";
          const [cx, cy] = pathGen.centroid(f);
          return { id, d, cx: isNaN(cx) ? W / 2 : cx, cy: isNaN(cy) ? H / 2 : cy };
        })
        .filter((p: GeoPathEntry) => p.d && !isNaN(p.id));

      setPaths(built);
    });
  }, []);

  useEffect(() => {
    if (!zoomTarget || paths.length === 0) return;
    const target = paths.find((p) => p.id === zoomTarget);
    if (!target) return;

    clearTimeout(holdTimerRef.current);
    tokenRef.current.cancelled = true;
    const token: CancelToken = { cancelled: false };
    tokenRef.current = token;

    const { cx, cy } = target;
    const zw = W / ZOOM_FACTOR;
    const zh = H / ZOOM_FACTOR;
    const x = Math.max(0, Math.min(W - zw, cx - zw / 2));
    const y = Math.max(0, Math.min(H - zh, cy - zh / 2));
    const full: [number, number, number, number] = [0, 0, W, H];
    const zoomed: [number, number, number, number] = [x, y, zw, zh];

    animateViewBox(full, zoomed, ANIM_MS, setViewBox, token, () => {
      holdTimerRef.current = setTimeout(() => {
        animateViewBox(zoomed, full, ANIM_MS, setViewBox, token);
      }, ZOOM_HOLD_MS);
    });

    return () => {
      clearTimeout(holdTimerRef.current);
      token.cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomTarget]);

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full"
      style={{ minHeight: 260, background: "#080810" }}
      aria-label="World map"
    >
      {paths.map(({ id, d }) => {
        const isMystery = mysteryNumeric !== undefined && id === mysteryNumeric;
        const fill = isMystery ? "#00ff41" : (colorMap[id] ?? "#0d1b2a");
        return (
          <path
            key={id}
            d={d}
            fill={fill}
            stroke="#0f2a44"
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
}
