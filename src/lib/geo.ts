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

export function bearingToArrow(deg: number): string {
  const dirs = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

// Hot/cold distance buckets: <500km hot, <2000km warm, <5000km tepid, else cold.
export interface HeatBucket { hex: string; label: string; square: string; }

export function distanceHeat(km: number): HeatBucket {
  if (km < 500)  return { hex: "#ff3333", label: "HOT",   square: "🟥" };
  if (km < 2000) return { hex: "#ff8800", label: "WARM",  square: "🟧" };
  if (km < 5000) return { hex: "#ffe600", label: "TEPID", square: "🟨" };
  return           { hex: "#3b82f6", label: "COLD",  square: "🟦" };
}

export function distanceToHex(km: number): string {
  return distanceHeat(km).hex;
}

export function calculateScore(guessNumber: number): number {
  // beyond the 6th guess (daily mode is unlimited) score decays but stays > 0
  return [1000, 850, 700, 550, 400, 250][guessNumber - 1] ?? Math.max(50, 250 - (guessNumber - 6) * 25);
}
