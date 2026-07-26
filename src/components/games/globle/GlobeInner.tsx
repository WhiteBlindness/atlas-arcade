"use client";

import Globe, { type GlobeMethods, type GlobeProps } from "react-globe.gl";
import type { MutableRefObject } from "react";

/**
 * Thin client-only wrapper around react-globe.gl.
 *
 * Exists for one reason: this module is loaded through next/dynamic({ssr:false})
 * (react-globe.gl touches `window` at import time), and a dynamic() boundary does
 * not reliably forward `ref`. Passing the ref as a normal prop (`globeRef`) gets
 * it through the boundary intact, so the parent can call pointOfView().
 */
export default function GlobeInner({
  globeRef,
  ...props
}: GlobeProps & { globeRef?: MutableRefObject<GlobeMethods | undefined> }) {
  return <Globe ref={globeRef} {...props} />;
}
