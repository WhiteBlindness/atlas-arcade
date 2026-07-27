/** A single "↑" glyph rotated by the exact bearing — 0deg = north, 90deg = east, matching CSS's clockwise rotate(). */
export function BearingArrow({ deg, className }: { deg: number; className?: string }) {
  return (
    <span className={`inline-block ${className ?? ""}`} style={{ transform: `rotate(${deg}deg)` }}>
      ↑
    </span>
  );
}
