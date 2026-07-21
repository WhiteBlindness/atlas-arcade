import worldCountries from "./worldCountries.json";

// Comprehensive country pool for GeoRadar, generated from mledoze/world-countries
// + samayo population by scripts/fetchCountries.mjs (see that file for why the
// deprecated restcountries API is no longer used). Regenerate with:
//   node scripts/fetchCountries.mjs
//
// `name` stays the English string so the other games (which read `.name` and
// self-filter by COUNTRY_META[numeric]) keep working unchanged; `pt`/`es` add
// the localized names GeoRadar searches and displays. Keyed everywhere by ISO
// numeric (ccn3), matching COUNTRY_META, COUNTRY_CLUES and the map topojson.
export interface Country {
  name: string;       // English common name
  pt: string;         // Portuguese common name
  es: string;         // Spanish common name
  numeric: number;    // ISO 3166-1 numeric (ccn3)
  lat: number;
  lng: number;
  population: number;
  code: string;       // ISO 3166-1 alpha-2 (cca2)
}

interface RawCountry {
  code: string;
  numeric: number;
  name: { en: string; pt: string; es: string };
  lat: number;
  lng: number;
  population: number | null;
}

export const COUNTRIES: Country[] = (worldCountries as RawCountry[]).map((c) => ({
  name: c.name.en,
  pt: c.name.pt,
  es: c.name.es,
  numeric: c.numeric,
  lat: c.lat,
  lng: c.lng,
  // The few unmatched populations are all tiny territories — a small default
  // keeps them correctly down-weighted (< 1M) by the target picker.
  population: c.population ?? 50_000,
  code: c.code,
}));

export const COUNTRY_BY_NUMERIC: Record<number, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.numeric, c])
);

/** Country name in the active UI language (falls back to English). */
export function countryName(c: Country, lang: string): string {
  return lang === "pt" ? c.pt : lang === "es" ? c.es : c.name;
}
