"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const W = 800;
const H = 450;
const ZOOM_FACTOR = 4;
const ZOOM_HOLD_MS = 1800;
const ANIM_MS = 550;

// user pan/zoom limits
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const MOBILE_INITIAL_SCALE = 1.6;
const MOBILE_BREAKPOINT = 640;

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

interface UserView { s: number; tx: number; ty: number; }
const IDENTITY: UserView = { s: 1, tx: 0, ty: 0 };

function clampView(v: UserView, rect: { width: number; height: number } | null): UserView {
  const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s));
  if (s === 1 || !rect) return { s, tx: 0, ty: 0 };
  const maxX = ((s - 1) * rect.width) / 2;
  const maxY = ((s - 1) * rect.height) / 2;
  return {
    s,
    tx: Math.min(maxX, Math.max(-maxX, v.tx)),
    ty: Math.min(maxY, Math.max(-maxY, v.ty)),
  };
}

export function WorldMap({ colorMap, mysteryNumeric, zoomTarget }: Props) {
  const [paths, setPaths] = useState<GeoPathEntry[]>([]);
  const [viewBox, setViewBox] = useState(`0 0 ${W} ${H}`);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tokenRef = useRef<CancelToken>({ cancelled: false });

  // —— user pan/zoom (mobile pinch, drag, wheel) ——
  const [view, setView] = useState<UserView>(IDENTITY);
  const viewRef = useRef(view);
  viewRef.current = view;
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const gestureRef = useRef<{
    mode: "pan" | "pinch";
    startDist: number;
    startView: UserView;
    startMid: { x: number; y: number };
    startPos: { x: number; y: number };
  } | null>(null);

  // better initial scale on small screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) {
      setView({ s: MOBILE_INITIAL_SCALE, tx: 0, ty: 0 });
    }
  }, []);

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

  // —— guess zoom animation (viewBox level, independent of user transform) ——
  useEffect(() => {
    if (!zoomTarget || paths.length === 0) return;
    const target = paths.find((p) => p.id === zoomTarget);
    if (!target) return;

    // reset user transform so the animation is not distorted
    setView(IDENTITY);

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

  // —— pointer gestures ——
  const rect = () => wrapRef.current?.getBoundingClientRect() ?? null;

  const applyZoom = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const r = rect();
    setView((v) => {
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s * factor));
      if (!r) return clampView({ ...v, s }, r);
      // zoom around the given screen point (default: center)
      const mx = clientX !== undefined ? clientX - r.left - r.width / 2 : 0;
      const my = clientY !== undefined ? clientY - r.top - r.height / 2 : 0;
      const k = s / v.s;
      return clampView({ s, tx: mx - k * (mx - v.tx), ty: my - k * (my - v.ty) }, r);
    });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointersRef.current.values()];

    if (pts.length === 2) {
      gestureRef.current = {
        mode: "pinch",
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startView: viewRef.current,
        startMid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
        startPos: { x: 0, y: 0 },
      };
    } else if (pts.length === 1) {
      gestureRef.current = {
        mode: "pan",
        startDist: 0,
        startView: viewRef.current,
        startMid: { x: 0, y: 0 },
        startPos: { x: e.clientX, y: e.clientY },
      };
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    if (!g) return;
    const r = rect();
    const pts = [...pointersRef.current.values()];

    if (g.mode === "pinch" && pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.startView.s * (dist / g.startDist)));
      if (!r) return;
      const mx = g.startMid.x - r.left - r.width / 2;
      const my = g.startMid.y - r.top - r.height / 2;
      const k = s / g.startView.s;
      // scale around the initial pinch midpoint, then follow midpoint drift
      setView(clampView({
        s,
        tx: mx - k * (mx - g.startView.tx) + (mid.x - g.startMid.x),
        ty: my - k * (my - g.startView.ty) + (mid.y - g.startMid.y),
      }, r));
    } else if (g.mode === "pan" && pts.length === 1) {
      setView(clampView({
        s: g.startView.s,
        tx: g.startView.tx + (e.clientX - g.startPos.x),
        ty: g.startView.ty + (e.clientY - g.startPos.y),
      }, r));
    }
  }, []);

  const onPointerEnd = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    const pts = [...pointersRef.current.values()];
    if (pts.length === 1) {
      // pinch → single-finger pan handoff
      gestureRef.current = {
        mode: "pan",
        startDist: 0,
        startView: viewRef.current,
        startMid: { x: 0, y: 0 },
        startPos: { x: pts[0].x, y: pts[0].y },
      };
    } else if (pts.length === 0) {
      gestureRef.current = null;
    }
  }, []);

  // wheel zoom — manual listener because React wheel handlers can't preventDefault
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (viewRef.current.s > 1) setView(IDENTITY);
    else applyZoom(2.5, e.clientX, e.clientY);
  }, [applyZoom]);

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full overflow-hidden touch-none select-none"
      style={{ minHeight: 260 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="w-full h-full"
        style={{
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.s})`,
          transformOrigin: "center",
          willChange: "transform",
        }}
      >
        <svg
          viewBox={viewBox}
          className="w-full h-full"
          style={{ background: "#080810" }}
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
      </div>

      {/* zoom controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          onClick={() => applyZoom(1.4)}
          aria-label="Zoom in"
          className="w-8 h-8 font-pixel text-[11px] border border-arcade-border bg-black/70 text-gray-400 hover:text-arcade-neon-cyan hover:border-arcade-neon-cyan transition-colors"
        >
          +
        </button>
        <button
          onClick={() => applyZoom(1 / 1.4)}
          aria-label="Zoom out"
          className="w-8 h-8 font-pixel text-[11px] border border-arcade-border bg-black/70 text-gray-400 hover:text-arcade-neon-cyan hover:border-arcade-neon-cyan transition-colors"
        >
          −
        </button>
        {view.s > 1 && (
          <button
            onClick={() => setView(IDENTITY)}
            aria-label="Reset zoom"
            className="w-8 h-8 font-pixel text-[9px] border border-arcade-border bg-black/70 text-gray-400 hover:text-arcade-neon-yellow hover:border-arcade-neon-yellow transition-colors"
          >
            ⤢
          </button>
        )}
      </div>
    </div>
  );
}
