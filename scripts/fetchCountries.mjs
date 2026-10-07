// scripts/fetchCountries.mjs
//
// Generates matching app and public snapshots for country reference data.
// They include localized names, coordinates, ISO numeric code, and population.
//
// Data sources:
// - mledoze/countries supplies localized names, country codes, and coordinates.
// - samayo/country-json supplies population values by English country name.
// This script merges the static datasets into the app and public snapshots.
// Run: node scripts/fetchCountries.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const GEO_URL = "https://cdn.jsdelivr.net/gh/mledoze/countries@master/countries.json";
const POP_URL = "https://cdn.jsdelivr.net/gh/samayo/country-json@master/src/country-by-population.json";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "data", "worldCountries.json");
const PUBLIC_OUT = join(ROOT, "public", "licenses", "world-countries.json");

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
  const serialized = JSON.stringify(out, null, 2) + "\n";
  await Promise.all([
    mkdir(dirname(OUT), { recursive: true }),
    mkdir(dirname(PUBLIC_OUT), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(OUT, serialized, "utf8"),
    writeFile(PUBLIC_OUT, serialized, "utf8"),
  ]);

  // ── Report ────────────────────────────────────────────────────────────────
  console.log(`\nWrote ${out.length} countries → ${OUT}`);
  console.log("Public license snapshot: " + PUBLIC_OUT);
  console.log(`Skipped (no ISO numeric): ${skipped.length ? skipped.join(", ") : "none"}`);
  console.log(`No population matched (${noPopulation.length}): ${noPopulation.join(", ") || "none"}`);
  const bottom = [...out].filter((c) => c.population != null).sort((a, b) => a.population - b.population).slice(0, 20);
  console.log("\nSmallest 20 by population (sanity check — must all be micro/island states):");
  for (const c of bottom) console.log(`  ${String(c.population).padStart(10)}  ${c.name.en}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
