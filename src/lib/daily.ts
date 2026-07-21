// Daily challenge seeding — deterministic randomness from the UTC date so
// every player worldwide gets the exact same challenge on the same day.
// No dependencies: xmur3 string hash + mulberry32 PRNG (~15 lines total).

/** Current UTC date as "YYYY-MM-DD" — the global daily-challenge key. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Milliseconds until the next UTC midnight (daily reset countdown). */
export function msUntilNextUtcMidnight(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/** xmur3 — hashes an arbitrary string into a 32-bit seed. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — fast seeded PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

/**
 * Seeded RNG for a game's daily challenge. Same slug + same UTC day =
 * identical sequence for every player. Pass a `date` override for testing.
 */
export function createDailyRng(gameSlug: string, date: string = todayUTC()): Rng {
  return mulberry32(hashSeed(`atlas-arcade:${gameSlug}:${date}`));
}

/** Seeded RNG from an arbitrary string (non-daily uses). */
export function createSeededRng(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

/** Fisher–Yates shuffle driven by a seeded RNG. Returns a new array. */
export function seededShuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick one element deterministically. */
export function seededPick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Weighted deterministic pick. Each element's `weight(item)` sets its relative
 * chance of selection (e.g. weight 10 is chosen 10x as often as weight 1).
 * Weights must be non-negative; at least one must be > 0.
 */
export function seededWeightedPick<T>(arr: readonly T[], rng: Rng, weight: (item: T) => number): T {
  const weights = arr.map(weight);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r < 0) return arr[i];
  }
  return arr[arr.length - 1]; // floating-point safety net
}

/** Pick n distinct elements deterministically. */
export function seededSample<T>(arr: readonly T[], n: number, rng: Rng): T[] {
  return seededShuffle(arr, rng).slice(0, Math.min(n, arr.length));
}

/**
 * RNG for a game session: daily mode → globally shared seeded sequence,
 * anything else → plain Math.random.
 */
export function gameRng(slug: string, mode: "daily" | "arcade" | null | undefined): Rng {
  return mode === "daily" ? createDailyRng(slug) : Math.random;
}

/**
 * Mock "better than X% of players today" stat for daily end screens.
 * Takes a normalized performance value (0 = worst, 1 = perfect) and maps it
 * through a logistic curve, clamped to 1–99 so it always reads plausibly.
 * TODO: replace with a real aggregate query once daily results are stored.
 */
export function mockPercentile(performance: number): number {
  const p = Math.max(0, Math.min(1, performance));
  const pct = Math.round(100 / (1 + Math.exp(-6 * (p - 0.45))));
  return Math.max(1, Math.min(99, pct));
}
