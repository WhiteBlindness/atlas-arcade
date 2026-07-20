"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
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
import "maplibre-gl/dist/maplibre-gl.css";

const REVEAL_MS = 25000;         // silhouette → clear over 25s (slow, dramatic reveal)
const MAX_POINTS = 600;
const DIST_ZERO_KM = 3000;       // score reaches 0 at this distance
const CORRECT_KM = 300;          // within this = "correct" feedback

// Minimal dark globe style (no tiles/labels) — matches GeoRadar.
const DARK_STYLE = {
  version: 8,
  name: "Arcade Dark",
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#080810" } }],
} as const;

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

  const startRef = useRef(0);
  const doneRef = useRef(false);
  const savedRef = useRef(false);
  const mapRef = useRef<MapRef | null>(null);
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

  // Start the reveal on mount; auto-finalize (0 pts) if the timer runs out.
  useEffect(() => {
    startRef.current = Date.now();
    const raf = requestAnimationFrame(() => setReveal(true));
    const timeout = setTimeout(() => finalize(null), REVEAL_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(timeout); };
  }, [finalize]);

  const onMapClick = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    if (doneRef.current) return;
    const guess = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    setPin(guess);
    sfx.snap();
    finalize(guess);
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
        <span className="w-14" />
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

      {/* Pin-drop globe — min-h forces a real height so MapLibre never collapses to 0 on mobile */}
      <div className="flex-1 min-h-[50vh] w-full relative">
        <Map
          ref={mapRef}
          onClick={onMapClick}
          initialViewState={{ longitude: 10, latitude: 25, zoom: 1.4 }}
          minZoom={0.6}
          maxZoom={7}
          mapStyle={DARK_STYLE as never}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ projection: "globe" } as any)}
          attributionControl={false}
          dragRotate={false}
          cursor={result ? "default" : "crosshair"}
          style={{ width: "100%", height: "100%" }}
        >
          {pin && (
            <Marker longitude={pin.lng} latitude={pin.lat}>
              <span className="text-xl" style={{ filter: "drop-shadow(0 0 4px #f8f8f8)" }}>📍</span>
            </Marker>
          )}
          {result && (
            <Marker longitude={answerLng} latitude={answerLat}>
              <span className="text-xl" style={{ filter: "drop-shadow(0 0 4px #00ff41)" }}>🎯</span>
            </Marker>
          )}
        </Map>

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
