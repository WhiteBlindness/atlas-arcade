"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { MeshBasicMaterial } from "three";
import { feature } from "topojson-client";

// Same engine as the GeoRadar globe. The MapLibre globe renders nothing here
// (blank canvas, no land), which is exactly why GeoRadar was migrated; using
// react-globe.gl keeps the pin-drop map actually visible.
const Globe = dynamic(() => import("./globle/GlobeInner"), { ssr: false });
import { CITIES } from "@/data/cities";
import { CITY_COORDS } from "@/data/cityCoords";
import { haversine } from "@/lib/geo";
import { useGameStore } from "@/store/gameStore";
import { saveHighScore } from "@/lib/supabase/scores";
import { gameRng, seededPick } from "@/lib/daily";
import { sfx } from "@/lib/sfx";
import { useT } from "@/lib/i18n";
import { DailyPercentile } from "@/components/ui/DailyPercentile";
import { EndScreenActions } from "@/components/ui/EndScreenActions";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { HowToPlayButton } from "@/components/ui/HowToPlay";
import "maplibre-gl/dist/maplibre-gl.css";

const REVEAL_MS = 25000;         // silhouette → clear over 25s (slow, dramatic reveal)
const MAX_POINTS = 600;
const DIST_ZERO_KM = 3000;       // score reaches 0 at this distance
const CORRECT_KM = 300;          // within this = "correct" feedback

// High-contrast palette: the page background is near-black (#080810), so a deep
// blue ocean and a bright slate land read clearly against it in either theme.
const OCEAN_COLOR = "#0e2440";   // the sphere itself
// Canvas background — matches the page shell so the globe doesn't sit in a
// visible dark-blue slab filling the lower half of the screen.
const CANVAS_BG = "#090d16";
const LAND_COLOR = "#8fb6dd";
const BORDER_COLOR = "#0b1a2e";  // country outlines, dark on the light land
const EQUATOR_COLOR = "#ffe600";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geoCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCountries(): Promise<any> {
  if (geoCache) return geoCache;
  const world = await fetch(GEO_URL).then((r) => r.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geoCache = feature(world, world.objects.countries) as any;
  return geoCache;
}

// Only cities we have coordinates for can be scored.
const POOL = CITIES.filter((c) => CITY_COORDS[c.id]);

interface Guess {
  lng: number;
  lat: number;
}
interface Result {
  distKm: number;
  points: number;
  correct: boolean;
}

export default function SkylineSilhouette({ onExit }: { onExit: () => void }) {
  const { addScore } = useGameStore();
  const [city] = useState(() => seededPick(POOL, gameRng("skyline-silhouette", useGameStore.getState().mode)));
  const [answerLat, answerLng] = CITY_COORDS[city.id];

  const [reveal, setReveal] = useState(false);   // drives the CSS brightness reveal
  const [pin, setPin] = useState<Guess | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null);
  // Globe dimensions are computed ONCE, synchronously, at the first client render
  // — never from a ResizeObserver callback.
  //
  // Why: mounting react-globe.gl from a render scheduled by a ResizeObserver
  // callback leaves the renderer alive but producing no frames (verified in
  // /test-globe: identical config renders when the mount is triggered by the
  // GeoJSON fetch, and stays blank when triggered by the observer — with either
  // literal or state-derived sizes, and rAF-deferring does not help).
  // Mounting on `geo` (a promise callback) is the proven-good path.
  const [mapSize] = useState(() =>
    typeof window === "undefined"
      ? { w: 0, h: 0 }
      : { w: window.innerWidth, h: Math.max(240, Math.round(window.innerHeight * 0.55)) },
  );
  const mapWrapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(undefined);

  useEffect(() => { fetchCountries().then(setGeo).catch(() => {}); }, []);

  // Render at the device pixel ratio — react-globe.gl leaves it at 1, which is
  // what makes the borders/coastlines look pixelated. Capped at 2 for perf.
  useEffect(() => {
    if (!geo) return;
    const id = requestAnimationFrame(() => {
      const r = globeRef.current?.renderer?.();
      if (r) r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    });
    return () => cancelAnimationFrame(id);
  }, [geo]);

  // Unshaded materials — flat 2D look, no lighting artifacts on the sphere.
  const globeMaterial = useState(() => new MeshBasicMaterial({ color: OCEAN_COLOR }))[0];
  const landMat = useState(() => new MeshBasicMaterial({ color: LAND_COLOR }))[0];
  // react-globe.gl expects accessors here; passing a bare Material can silently
  // skip the polygons (which is what left this globe invisible).
  const landMaterial = useCallback(() => landMat, [landMat]);

  const startRef = useRef(0);
  const doneRef = useRef(false);
  const savedRef = useRef(false);
  // Mirrors `pin` so the reveal timeout submits whatever is on the map when it
  // fires, instead of the stale value captured when the effect first ran.
  const pinRef = useRef<Guess | null>(null);
  const t = useT();

  const finalize = useCallback((guess: Guess | null) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setReveal(true); // fully reveal the skyline

    const elapsed = Math.min(REVEAL_MS, Date.now() - startRef.current) / REVEAL_MS; // 0 (dark) → 1 (clear)
    let res: Result;
    if (!guess) {
      res = { distKm: Infinity, points: 0, correct: false };
    } else {
      const distKm = haversine(answerLat, answerLng, guess.lat, guess.lng);
      const distScore = Math.max(0, 1 - distKm / DIST_ZERO_KM);
      const timeMult = 1 - elapsed * 0.8; // 1.0 while dark → 0.2 once clear
      const points = Math.round(MAX_POINTS * distScore * timeMult);
      res = { distKm, points, correct: distKm <= CORRECT_KM };
    }

    if (res.correct) sfx.correct(); else sfx.wrong();
    setResult(res);
    if (res.points > 0) addScore(res.points);
    if (!savedRef.current) {
      savedRef.current = true;
      saveHighScore("skyline-silhouette", res.points);
    }
  }, [answerLat, answerLng, addScore]);

  // Start the reveal on mount; when the timer runs out the round is scored with
  // whatever pin is currently placed (no pin = 0 points).
  useEffect(() => {
    startRef.current = Date.now();
    const raf = requestAnimationFrame(() => setReveal(true));
    const timeout = setTimeout(() => finalize(pinRef.current), REVEAL_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
  }, [finalize]);

  // A click only MOVES the pin — it never locks the answer, so a misclick is
  // always recoverable. Submitting happens through the confirm button below.
  const onGlobeClick = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
    if (doneRef.current) return;
    const guess = { lng, lat };
    pinRef.current = guess;
    setPin(guess);
    sfx.snap();
  }, []);

  // Equator: one densely-sampled path at lat 0 so it curves with the sphere.
  const equator = useMemo(
    () => [Array.from({ length: 181 }, (_, i) => [0, -180 + i * 2] as [number, number])],
    [],
  );

  // White dot for the player's pin; the green target dot appears on reveal.
  const points = useMemo(() => {
    const arr: { lat: number; lng: number; color: string }[] = [];
    if (pin) arr.push({ lat: pin.lat, lng: pin.lng, color: "#f8f8f8" });
    if (result) arr.push({ lat: answerLat, lng: answerLng, color: "#00ff41" });
    return arr;
  }, [pin, result, answerLat, answerLng]);

  const confirmGuess = useCallback(() => {
    if (doneRef.current || !pinRef.current) return;
    sfx.click();
    finalize(pinRef.current);
  }, [finalize]);

  // Dark, recognizable silhouette (not solid black); transitions to full over 15s.
  const imgStyle = useMemo<React.CSSProperties>(() => ({
    filter: reveal ? "brightness(1) contrast(1)" : "brightness(0.15) contrast(2)",
    transition: `filter ${REVEAL_MS}ms linear`,
    // once the round ends we snap to fully clear instantly
    ...(result ? { transition: "filter 300ms ease-out" } : {}),
  }), [reveal, result]);

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-arcade-bg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcade-border shrink-0">
        <GameBackButton onExit={onExit} />
        <h1 className="font-pixel text-xs text-arcade-neon-white neon-text-white tracking-widest">SKYLINE SILHOUETTE</h1>
        <HowToPlayButton slug="skyline-silhouette" accent="text-arcade-neon-white" />
      </div>

      {/* Silhouette */}
      <div className="relative h-[34vh] min-h-[180px] border-b border-arcade-border shrink-0 bg-black overflow-hidden">
        {imgFailed ? (
          <div className="w-full h-full flex items-center justify-center font-pixel text-[9px] text-gray-600">—</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={city.imageUrl}
            alt="Skyline"
            className="w-full h-full object-cover"
            style={imgStyle}
            draggable={false}
            onError={() => setImgFailed(true)}
          />
        )}
        {!result && (
          <p className="absolute top-2 left-0 right-0 text-center font-pixel text-[8px] text-arcade-neon-white neon-text-white tracking-[0.3em] pointer-events-none">
            {t("skDropPin")}
          </p>
        )}
      </div>

      {/* Pin-drop globe. min-h-0 (not min-h-[50vh]) — a tall min-height pushes this
          flex column past h-dvh, and under overflow-hidden the canvas ends up
          measured but never painted. Height comes from flex + the ResizeObserver. */}
      <div ref={mapWrapRef} className="flex-1 min-h-0 w-full relative" style={{ background: CANVAS_BG }}>
        {mapSize.w > 0 && mapSize.h > 0 && geo && (
          <Globe
            globeRef={globeRef}
            width={mapSize.w}
            height={mapSize.h}
            backgroundColor={CANVAS_BG}
            showAtmosphere={false}
            globeMaterial={globeMaterial}
            polygonsData={geo.features}
            polygonAltitude={0.005}
            polygonCapMaterial={landMaterial}
            polygonSideMaterial={landMaterial}
            polygonStrokeColor={() => BORDER_COLOR}
            polygonsTransitionDuration={0}
            // Once the guess is locked in, the globe stops accepting input.
            onGlobeClick={result ? undefined : onGlobeClick}
            enablePointerInteraction={!result}
            pathsData={equator}
            pathColor={() => EQUATOR_COLOR}
            pathStroke={1.2}
            pathPointLat={(p: unknown) => (p as [number, number])[0]}
            pathPointLng={(p: unknown) => (p as [number, number])[1]}
            pathTransitionDuration={0}
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.03}
            pointRadius={0.7}
            pointsTransitionDuration={0}
            rendererConfig={{ antialias: true, alpha: true }}
          />
        )}

        {/* Confirm bar — only appears once a pin is on the map (anti-misclick). */}
        {pin && !result && (
          <div
            className="absolute z-30 bottom-0 left-0 right-0 px-4 pt-3 pb-4 bg-black/85 border-t border-arcade-neon-white/40 space-y-2"
            style={{ animation: "fadeUp 0.2s ease-out" }}
          >
            <p className="font-mono text-xs text-slate-400 text-center leading-snug">
              {t("skPinHelper")}
            </p>
            <button
              type="button"
              onClick={confirmGuess}
              className="w-full min-h-[48px] py-3 font-pixel text-[10px] tracking-widest border border-arcade-neon-green text-arcade-neon-green neon-text-green shadow-neon-green hover:bg-arcade-neon-green hover:text-black active:scale-95 transition-all"
            >
              [ {t("skConfirmGuess")} ]
            </button>
          </div>
        )}

        {/* Result overlay */}
        {result && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-4">
            <div
              className={`border ${result.correct ? "border-arcade-neon-green" : "border-arcade-neon-red"} bg-black/92 p-6 text-center space-y-3 min-w-[240px]`}
              style={{ boxShadow: `0 0 40px ${result.correct ? "#00ff4155" : "#ff000055"}` }}
            >
              <p className={`font-pixel text-[11px] tracking-widest ${result.correct ? "text-arcade-neon-green neon-text-green" : "text-arcade-neon-red neon-text-red"}`}>
                {result.correct ? t("correct") : t("igTooFar")}
              </p>
              <p className="font-mono text-lg text-white">{city.name} {city.emoji}</p>
              <p className="font-mono text-[13px] text-gray-400">
                {Number.isFinite(result.distKm)
                  ? t("skDistance").replace("{X}", Math.round(result.distKm).toLocaleString())
                  : t("skNoGuess")}
              </p>
              <div className="h-px bg-arcade-border" />
              <p className="font-pixel text-[10px] text-arcade-neon-white neon-text-white">{t("igPtsSplash").replace("{X}", String(result.points))}</p>
              <DailyPercentile performance={Math.min(1, result.points / MAX_POINTS)} />
              <EndScreenActions
                slug="skyline-silhouette"
                gameTitle="SKYLINE SILHOUETTE"
                score={result.points}
                performance={Math.min(1, result.points / MAX_POINTS)}
                squares={result.correct ? "🟩" : "🟥"}
                onExit={onExit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
