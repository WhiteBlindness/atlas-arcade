const R = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

// Hot/cold distance buckets: <500km hot, <2000km warm, <5000km tepid, else cold.
// `tier` is a locale-neutral key — callers translate it via i18n, never render it directly.
export type HeatTier = "hot" | "warm" | "tepid" | "cold";
export interface HeatBucket { hex: string; tier: HeatTier; square: string; }

export function distanceHeat(km: number): HeatBucket {
  if (km < 500)  return { hex: "#ff3333", tier: "hot",   square: "🟥" };
  if (km < 2000) return { hex: "#ff8800", tier: "warm",  square: "🟧" };
  if (km < 5000) return { hex: "#ffe600", tier: "tepid", square: "🟨" };
  return           { hex: "#3b82f6", tier: "cold",  square: "🟦" };
}

export function distanceToHex(km: number): string {
  return distanceHeat(km).hex;
}

// European convention: full integer, space as the thousands separator (pt-PT
// locale groups with U+00A0 NBSP — normalized to a plain space here so it
// matches the pixel font stack and copy/paste cleanly). No "16.6k km" shorthand.
export function formatKm(km: number): string {
  return Math.round(km).toLocaleString("pt-PT").replace(/ /g, " ");
}

export function formatDistance(km: number): string {
  return `${formatKm(km)} km`;
}

export function calculateScore(guessNumber: number): number {
  // beyond the 6th guess (daily mode is unlimited) score decays but stays > 0
  return [1000, 850, 700, 550, 400, 250][guessNumber - 1] ?? Math.max(50, 250 - (guessNumber - 6) * 25);
}
