"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Source, Layer, type MapRef } from "react-map-gl/maplibre";
import type { FillLayerSpecification } from "maplibre-gl";
import { feature } from "topojson-client";
import { COUNTRY_BY_NUMERIC } from "@/data/countries";
import "maplibre-gl/dist/maplibre-gl.css";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const STYLE_URL = "https://demotiles.maplibre.org/style.json";

interface Props {
  colorMap: Record<number, string>;
  mysteryNumeric?: number;
  zoomTarget?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let geoCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCountries(): Promise<any> {
  if (geoCache) return geoCache;
  const world = await fetch(GEO_URL).then((r) => r.json());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(world, world.objects.countries) as any;
  // expose numeric id as a queryable property
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fc.features.forEach((f: any) => { f.properties = { ...f.properties, id: parseInt(f.id, 10) }; });
  geoCache = fc;
  return fc;
}

export function WorldMapGlobe({ colorMap, mysteryNumeric, zoomTarget }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geo, setGeo] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { fetchCountries().then(setGeo); }, []);

  // globe projection once the style is loaded
  const onLoad = () => {
    const map = mapRef.current?.getMap();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any)?.setProjection?.({ type: "globe" });
    setReady(true);
  };

  // data-driven fill: guessed countries get their heat colour, mystery goes green
  const fillPaint = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match: any[] = ["match", ["get", "id"]];
    for (const [num, hex] of Object.entries(colorMap)) {
      if (mysteryNumeric !== undefined && Number(num) === mysteryNumeric) continue;
      match.push(Number(num), hex);
    }
    if (mysteryNumeric !== undefined) match.push(mysteryNumeric, "#00ff41");
    match.push("rgba(13,27,42,0.55)"); // default land fill
    return match;
  }, [colorMap, mysteryNumeric]);

  const fillLayer: FillLayerSpecification = {
    id: "country-fills",
    type: "fill",
    source: "countries",
    paint: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "fill-color": fillPaint as any,
      "fill-opacity": 0.85,
    },
  };

  // fly the camera to each guess; zoom ~4 flattens the globe into Mercator
  useEffect(() => {
    if (!ready || zoomTarget === undefined) return;
    const c = COUNTRY_BY_NUMERIC[zoomTarget];
    const map = mapRef.current?.getMap();
    if (!c || !map) return;
    map.flyTo({ center: [c.lng, c.lat], zoom: 4.2, duration: 1600, essential: true });
    // ease back out to the globe after a beat
    const t = setTimeout(() => map.flyTo({ center: [c.lng, c.lat], zoom: 1.4, duration: 1800 }), 3200);
    return () => clearTimeout(t);
  }, [zoomTarget, ready]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 260, background: "#080810" }}>
      <Map
        ref={mapRef}
        onLoad={onLoad}
        initialViewState={{ longitude: 10, latitude: 25, zoom: 1.4 }}
        minZoom={0.6}
        maxZoom={7}
        mapStyle={STYLE_URL}
        attributionControl={false}
        dragRotate={false}
        style={{ width: "100%", height: "100%" }}
      >
        {geo && (
          <Source id="countries" type="geojson" data={geo}>
            <Layer {...fillLayer} />
            <Layer
              id="country-borders"
              type="line"
              source="countries"
              paint={{ "line-color": "#0f2a44", "line-width": 0.5 }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}

export default WorldMapGlobe;
