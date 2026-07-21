"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Map, { Source, Layer, type MapRef, type ViewStateChangeEvent } from "react-map-gl/maplibre";
import type { FillLayerSpecification } from "maplibre-gl";
import { feature } from "topojson-client";
import { COUNTRY_BY_NUMERIC } from "@/data/countries";
import "maplibre-gl/dist/maplibre-gl.css";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Minimal arcade-dark style — no tiles, no labels, just our GeoJSON country shapes.
// Layers use solid (fully opaque) hex colors so there is no alpha overdraw on the
// globe tile-skirt seams. `light` is a VALID MapLibre root property (unlike the
// *-emissive-strength paint props, which are Mapbox-GL-v3-only and make MapLibre's
// strict validator abort the whole map). A very low ambient intensity activates
// the renderer with near-flat shading, so the tile seams stay unlit.
const DARK_STYLE = {
  version: 8,
  name: "Arcade Dark",
  light: { anchor: "viewport", color: "#ffffff", intensity: 0.1 },
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

  // On load, audit the live layer stack and aggressively strip anything that
  // isn't ours — any graticule/grid/lat-lng lines a base style might inject.
  // (Our style is blank, so this is defensive + diagnostic; the real ring
  // artifact is the globe fill subdivision, killed by fill-antialias:false.)
  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      const KEEP = new Set([
        "background", "country-fills", "country-borders",
        "equator-line", "guess-dots-glow", "guess-dots-core",
      ]);
      const junk = /graticule|grid|latitude|longitude|parallel|meridian/i;
      for (const l of map.getStyle()?.layers ?? []) {
        const srcLayer = ("source-layer" in l ? String(l["source-layer"] ?? "") : "");
        const isJunk = junk.test(l.id) || junk.test(srcLayer);
        const strayLine = l.type === "line" && !KEEP.has(l.id);
        if (!KEEP.has(l.id) && (isJunk || strayLine)) {
          try { map.removeLayer(l.id); } catch { /* already gone */ }
        }
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[GeoRadar] map layers:", (map.getStyle()?.layers ?? []).map((l) => `${l.id}(${l.type})`).join(", "));
      }
    }
    setReady(true);
  }, []);

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

  // Solid equivalent of the old rgba(13,27,42,0.55)*0.9 composited over #080810 —
  // hardcoded so there is zero fill transparency to overdraw on the mesh seams.
  const DEFAULT_LAND = "#0a111d";
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
        // Fully opaque (solid colors, no alpha) + antialias off: no alpha overdraw
        // and no antialiased mesh edges on the globe tessellation seams.
        "fill-antialias": false,
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
            // Solid equivalent of #38507a @ 0.55 over #080810 — no alpha.
            paint={{ "line-color": "#22304a", "line-width": 1, "line-dasharray": [3, 3] }}
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
              // circle-blur gives the soft halo falloff; opacity stays 1 (no overdraw).
              "circle-blur": 1,
              "circle-opacity": 1.0,
            }}
          />
          <Layer
            id="guess-dots-core"
            type="circle"
            source="guess-dots"
            paint={{
              "circle-radius": 4.5,
              "circle-color": ["get", "color"],
              "circle-opacity": 1.0,
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
