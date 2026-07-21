"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import type { FillLayerSpecification } from "maplibre-gl";
import { feature } from "topojson-client";
import { COUNTRY_BY_NUMERIC } from "@/data/countries";
import "maplibre-gl/dist/maplibre-gl.css";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Minimal arcade-dark style — no tiles, no labels, just our GeoJSON country shapes.
const DARK_STYLE = {
  version: 8,
  name: "Arcade Dark",
  sources: {},
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#080810" } },
  ],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
} as const;

interface Props {
  colorMap: Record<number, string>;
  /** Heat-colored dots for every guessed country (+ the target on reveal). */
  markers?: { lng: number; lat: number; color: string }[];
  mysteryNumeric?: number;
  zoomTarget?: number;
  /** Bumping this (new object per click) flies the camera to a guess. */
  flyTo?: { lng: number; lat: number };
}

// The Equator, as a densely-sampled LineString so it curves smoothly on the globe.
const EQUATOR_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0]),
      },
    },
  ],
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geoCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCountries(): Promise<any> {
  if (geoCache) return geoCache;
  const world = await fetch(GEO_URL).then((r) => r.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(world, world.objects.countries) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fc.features.forEach((f: any) => {
    f.properties = { ...f.properties, id: parseInt(f.id, 10) };
  });
  geoCache = fc;
  return fc;
}

interface CameraState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

const INITIAL_CAMERA: CameraState = {
  longitude: 10,
  latitude: 20,
  zoom: 1.5,
  bearing: 0,
  pitch: 0,
};

export function WorldMapGlobe({ colorMap, markers = [], mysteryNumeric, zoomTarget, flyTo }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null);
  const [ready, setReady] = useState(false);
  // Controlled camera state: onMove keeps this in sync with maplibre's animated position.
  // This prevents React re-renders from resetting the camera during flyTo animations.
  const [camera, setCamera] = useState<CameraState>(INITIAL_CAMERA);

  useEffect(() => { fetchCountries().then(setGeo); }, []);

  const onLoad = useCallback(() => { setReady(true); }, []);

  // onMove keeps React camera state in sync with maplibre's internal position at every
  // animation frame — re-renders pass back the same position, so flyTo is never overridden.
  const onMove = useCallback((evt: ViewStateChangeEvent) => {
    setCamera({
      longitude: evt.viewState.longitude,
      latitude: evt.viewState.latitude,
      zoom: evt.viewState.zoom,
      bearing: evt.viewState.bearing ?? 0,
      pitch: evt.viewState.pitch ?? 0,
    });
  }, []);

  useEffect(() => {
    if (!ready || zoomTarget === undefined) return;
    const c = COUNTRY_BY_NUMERIC[zoomTarget];
    const map = mapRef.current?.getMap();
    if (!c || !map) return;

    // Zoom to ~4.5 — deep enough that MapLibre transitions the globe into flat Mercator.
    // Stay parked at the guessed country; no auto zoom-out.
    map.flyTo({ center: [c.lng, c.lat], zoom: 4.5, duration: 2500, essential: true });
  }, [zoomTarget, ready]);

  // Click-to-fly: a fresh `flyTo` object (new identity per click) pans to a guess.
  useEffect(() => {
    if (!ready || !flyTo) return;
    const map = mapRef.current?.getMap();
    map?.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 4, essential: true, speed: 1.5 });
  }, [flyTo, ready]);

  // Point features for the guessed-country dots (fallback visibility for microstates).
  const markerGeo = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: markers.map((m) => ({
        type: "Feature" as const,
        properties: { color: m.color },
        geometry: { type: "Point" as const, coordinates: [m.lng, m.lat] },
      })),
    }),
    [markers],
  );

  const DEFAULT_LAND = "rgba(13,27,42,0.55)";
  const fillPaint = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cases: any[] = [];
    for (const [num, hex] of Object.entries(colorMap)) {
      if (mysteryNumeric !== undefined && Number(num) === mysteryNumeric) continue;
      cases.push(Number(num), hex);
    }
    if (mysteryNumeric !== undefined) cases.push(mysteryNumeric, "#00ff41");
    // A "match" with zero cases (["match", input, default]) is INVALID and makes
    // MapLibre throw → black canvas. With no guesses yet, use a plain colour.
    if (cases.length === 0) return DEFAULT_LAND;
    return ["match", ["get", "id"], ...cases, DEFAULT_LAND];
  }, [colorMap, mysteryNumeric]);

  const fillLayer: FillLayerSpecification = useMemo(
    () => ({
      id: "country-fills",
      type: "fill",
      source: "countries",
      paint: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "fill-color": fillPaint as any,
        "fill-opacity": 0.9,
      },
    }),
    [fillPaint],
  );

  return (
    <div className="relative w-full h-full" style={{ minHeight: 260, background: "#080810" }}>
      <Map
        ref={mapRef}
        {...camera}
        onMove={onMove}
        onLoad={onLoad}
        minZoom={0.6}
        maxZoom={7}
        mapStyle={DARK_STYLE as never}
        // "globe" must be passed at construction time so maplibre renders the sphere immediately.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ projection: "globe" } as any)}
        attributionControl={false}
        // Full free exploration at all times: drag to pan/spin the globe, wheel to
        // zoom, pinch to zoom + rotate. The map is controlled ({...camera} + onMove),
        // so flyTo on each guess animates without fighting manual interaction.
        dragRotate={false}
        scrollZoom={true}
        dragPan={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
        style={{ width: "100%", height: "100%" }}
      >
        {geo && (
          <Source id="countries" type="geojson" data={geo}>
            <Layer {...fillLayer} />
            <Layer
              id="country-borders"
              type="line"
              source="countries"
              paint={{ "line-color": "#1a3a5c", "line-width": 0.5 }}
            />
          </Source>
        )}

        {/* Equator — the only non-border reference line: muted, dashed. */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Source id="equator" type="geojson" data={EQUATOR_GEOJSON as any}>
          <Layer
            id="equator-line"
            type="line"
            source="equator"
            paint={{ "line-color": "#38507a", "line-opacity": 0.55, "line-width": 1, "line-dasharray": [3, 3] }}
          />
        </Source>

        {/* Guessed-country dots: always visible, even for polygon-less microstates.
            A blurred halo under a solid core, both tinted by the guess heat color. */}
        <Source id="guess-dots" type="geojson" data={markerGeo}>
          <Layer
            id="guess-dots-glow"
            type="circle"
            source="guess-dots"
            paint={{
              "circle-radius": 10,
              "circle-color": ["get", "color"],
              "circle-blur": 1,
              "circle-opacity": 0.45,
            }}
          />
          <Layer
            id="guess-dots-core"
            type="circle"
            source="guess-dots"
            paint={{
              "circle-radius": 4.5,
              "circle-color": ["get", "color"],
              "circle-opacity": 0.95,
              "circle-stroke-width": 1.5,
              "circle-stroke-color": "#080810",
            }}
          />
        </Source>
      </Map>
    </div>
  );
}

export default WorldMapGlobe;
