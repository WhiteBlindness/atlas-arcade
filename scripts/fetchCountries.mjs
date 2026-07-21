// scripts/fetchCountries.mjs
//
// Generates src/data/worldCountries.json — the comprehensive GeoRadar country
// pool with localized (EN/PT/ES) names, coordinates, ISO numeric code and
// population.
//
// NOTE ON THE DATA SOURCE:
// The task originally specified https://restcountries.com/v3.1/all, but that
// endpoint is DEPRECATED — it now 301-redirects to a "This API version has been
// deprecated … migrate to v5" error and returns no data. Rather than depend on a
// dead (and now gated) API, this script pulls the SAME underlying dataset that
// restcountries is built from, straight from its open static sources on jsDelivr:
//   • mledoze/world-countries — name.common, translations.por/spa.common,
//     cca2, ccn3 (ISO numeric), latlng. Everything except population.
//   • samayo/country-json      — population, keyed by English country name.
// Both are static CDN JSON (no key, no rate limit), so re-running this stays
// reproducible and the app ships a baked JSON with zero runtime API latency.
//
// Run: node scripts/fetchCountries.mjs

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const GEO_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json";
const POP_URL = "https://cdn.jsdelivr.net/gh/samayo/country-json@master/src/country-by-population.json";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "worldCountries.json");

/** Normalize a country name for fuzzy matching: strip accents, punctuation, case. */
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Population overrides (by cca2) for countries whose name doesn't match the
// samayo dataset — chiefly large states we must NOT let default to "small",
// which would break the weighted target picker. Values are approximate; only
// the <1M vs >=1M bucket matters for weighting.
const OVERRIDE_POP = {
  CD: 102_000_000, // DR Congo (samayo: "Congo [DRC]")
  TW: 23_500_000,  // Taiwan
  TR: 85_000_000,  // Türkiye (samayo: "Turkey")
  CV: 525_000,     // Cabo Verde
  FJ: 924_000,     // Fiji
};

async function getJSON(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log("Fetching mledoze/world-countries + samayo population …");
  const [geo, pop] = await Promise.all([getJSON(GEO_URL), getJSON(POP_URL)]);

  // Population lookup keyed by normalized English name.
  const popByName = new Map();
  for (const p of pop) popByName.set(norm(p.country), p.population);

  const out = [];
  const skipped = [];
  const noPopulation = [];

  for (const c of geo) {
    const numeric = Number(c.ccn3); // ccn3 is a zero-padded STRING ("004") — coerce.
    // Kosovo (and any entry lacking an ISO numeric) can't key into the numeric-based
    // META/CLUES/topojson maps — skip it rather than invent a colliding code.
    if (!c.ccn3 || !Number.isFinite(numeric) || !Array.isArray(c.latlng) || c.latlng.length < 2) {
      skipped.push(c.name?.common ?? c.cca2);
      continue;
    }

    // Population by name: try common, official, then alt spellings.
    const candidates = [c.name?.common, c.name?.official, ...(c.altSpellings ?? [])];
    let population = OVERRIDE_POP[c.cca2] ?? null;
    if (population == null) {
      for (const cand of candidates) {
        const hit = popByName.get(norm(cand));
        if (hit != null) { population = hit; break; }
      }
    }
    if (population == null) noPopulation.push(c.name?.common);

    out.push({
      code: c.cca2,
      numeric,
      name: {
        en: c.name?.common,
        pt: c.translations?.por?.common ?? c.name?.common,
        es: c.translations?.spa?.common ?? c.name?.common,
      },
      lat: c.latlng[0],
      lng: c.latlng[1],
      population, // may be null; countries.ts overlays COUNTRY_CLUES first, then this.
    });
  }

  out.sort((a, b) => a.name.en.localeCompare(b.name.en));
  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\nWrote ${out.length} countries → ${OUT}`);
  console.log(`Skipped (no ISO numeric): ${skipped.length ? skipped.join(", ") : "none"}`);
  console.log(`No population matched (${noPopulation.length}): ${noPopulation.join(", ") || "none"}`);
  const bottom = [...out].filter((c) => c.population != null).sort((a, b) => a.population - b.population).slice(0, 20);
  console.log("\nSmallest 20 by population (sanity check — must all be micro/island states):");
  for (const c of bottom) console.log(`  ${String(c.population).padStart(10)}  ${c.name.en}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
