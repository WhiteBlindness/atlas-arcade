import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080810",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          {/* corner reticle — the GameCard corner-bracket motif, at icon scale */}
          <path d="M2 7V2H7" stroke="#00d4ff" strokeWidth="2" />
          <path d="M21 2H26V7" stroke="#00d4ff" strokeWidth="2" />
          <path d="M26 21V26H21" stroke="#00d4ff" strokeWidth="2" />
          <path d="M7 26H2V21" stroke="#00d4ff" strokeWidth="2" />
          {/* globe: outer ring, equator, meridian */}
          <circle cx="14" cy="14" r="6.5" stroke="#00d4ff" strokeWidth="2" />
          <line x1="7.5" y1="14" x2="20.5" y2="14" stroke="#00d4ff" strokeWidth="1.5" />
          <path d="M14 7.5C16.8 10.2 16.8 17.8 14 20.5C11.2 17.8 11.2 10.2 14 7.5Z" stroke="#00d4ff" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
