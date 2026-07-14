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

export function distanceToHex(km: number): string {
  if (km < 500)  return "#00ff41";
  if (km < 2000) return "#ef4444";
  if (km < 4000) return "#f97316";
  if (km < 6000) return "#eab308";
  if (km < 9000) return "#3b82f6";
  return "#1e3a8a";
}

export function calculateScore(guessNumber: number): number {
  // beyond the 6th guess (daily mode is unlimited) score decays but stays > 0
  return [1000, 850, 700, 550, 400, 250][guessNumber - 1] ?? Math.max(50, 250 - (guessNumber - 6) * 25);
}
