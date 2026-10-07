import type { Locator } from "@playwright/test";

export interface ContrastMeasurement {
  text: string;
  foreground: string;
  background: string;
  cssBackground: string;
  ancestorFilters: string[];
  ratio: number;
}

export interface FocusMeasurement {
  outlineColor: string;
  outlineStyle: string;
  outlineWidth: number;
  ratio: number;
}

export async function measureContrast(locator: Locator): Promise<ContrastMeasurement> {
  return locator.evaluate((element) => {
    type RGBA = [number, number, number, number];

    const clamp = (value: number): number => Math.max(0, Math.min(255, value));
    const parse = (value: string): RGBA | null => {
      const fn = value.slice(0, value.indexOf("(")).trim().toLowerCase();
      const body = value.slice(value.indexOf("(") + 1, value.lastIndexOf(")"));
      const values = body.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number);
      if (!values || values.length < 3) return null;

      if (fn === "lab") {
        const L = values[0];
        const a = values[1];
        const b = values[2];
        const fy = (L + 16) / 116;
        const fx = fy + a / 500;
        const fz = fy - b / 200;
        const f = (v: number): number => v ** 3 > 216 / 24389 ? v ** 3 : (116 * v - 16) / 903.3;
        const x50 = f(fx) * 0.96422;
        const y50 = f(fy);
        const z50 = f(fz) * 0.82521;
        const x = 0.9555766 * x50 - 0.0230393 * y50 + 0.0631636 * z50;
        const y = -0.0282895 * x50 + 1.0099416 * y50 + 0.0210077 * z50;
        const z = 0.0122982 * x50 - 0.020483 * y50 + 1.3299098 * z50;
        const linear = [
          3.24096994 * x - 1.53738318 * y - 0.49861076 * z,
          -0.96924364 * x + 1.8759675 * y + 0.04155506 * z,
          0.05563008 * x - 0.20397696 * y + 1.05697151 * z,
        ];
        const srgb = linear.map((v) => clamp(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055)));
        return [srgb[0], srgb[1], srgb[2], values[3] ?? 1];
      }

      if (fn === "oklab" || fn === "oklch") {
        let L = values[0];
        let a = values[1];
        let b = values[2];
        if (L > 1) L /= 100;
        if (fn === "oklch") {
          const angle = (b * Math.PI) / 180;
          b = a * Math.sin(angle);
          a = a * Math.cos(angle);
        }
        const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
        const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
        const sRoot = L - 0.0894841775 * a - 1.291485548 * b;
        const l = lRoot ** 3;
        const m = mRoot ** 3;
        const s = sRoot ** 3;
        const linear = [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        ];
        const srgb = linear.map((v) => clamp(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.sign(v) * Math.abs(v) ** (1 / 2.4) - 0.055)));
        return [srgb[0], srgb[1], srgb[2], values[3] ?? 1];
      }

      if (fn === "color" && body.trim().startsWith("srgb")) {
        return [
          clamp(values[0] * 255),
          clamp(values[1] * 255),
          clamp(values[2] * 255),
          values[3] ?? 1,
        ];
      }

      return [clamp(values[0]), clamp(values[1]), clamp(values[2]), values[3] ?? 1];
    };

    const composite = (top: RGBA, under: RGBA): RGBA => {
      const alpha = top[3] + under[3] * (1 - top[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        (top[0] * top[3] + under[0] * under[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + under[1] * under[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + under[2] * under[3] * (1 - top[3])) / alpha,
        alpha,
      ];
    };

    const luminance = (rgb: RGBA): number => {
      const linear = (value: number): number => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
    };

    const card = element.closest("button[aria-label], button[type=submit]");
    if (!card) throw new Error("Contrast target is outside a labeled or submit button");

    const bodyColor = parse(getComputedStyle(document.body).backgroundColor);
    const htmlColor = parse(getComputedStyle(document.documentElement).backgroundColor);
    const backdrop = bodyColor && bodyColor[3] > 0
      ? bodyColor
      : htmlColor && htmlColor[3] > 0
        ? htmlColor
        : [255, 255, 255, 1] as RGBA;

    const backgroundLayers: RGBA[] = [];
    const ancestorFilters: string[] = [];
    let opacity = 1;
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const layer = parse(style.backgroundColor);
      if (layer && layer[3] > 0) backgroundLayers.push(layer);
      opacity *= Number(style.opacity) || 1;
      if (style.filter !== "none") ancestorFilters.push(style.filter);
      if (node === card) break;
    }

    let background = backdrop;
    for (const layer of backgroundLayers.reverse()) background = composite(layer, background);

    const style = getComputedStyle(element);
    const foreground = parse(style.color);
    if (!foreground) throw new Error("Unsupported computed foreground color: " + style.color);
    const cssBackground = style.backgroundColor;
    const foregroundPixel = composite(foreground, background);
    let visibleBackground = composite(
      [background[0], background[1], background[2], background[3] * opacity],
      backdrop,
    );
    let visibleForeground = composite(
      [foregroundPixel[0], foregroundPixel[1], foregroundPixel[2], foregroundPixel[3] * opacity],
      backdrop,
    );
    const applyFilters = (input: RGBA): RGBA => ancestorFilters.reduce((color, filter) => {
      let result = color;
      const functions = filter.matchAll(/([a-z-]+)\(([^)]+)\)/gi);
      for (const match of functions) {
        const name = match[1].toLowerCase();
        const amount = Number.parseFloat(match[2]);
        if (name === "brightness" && Number.isFinite(amount)) {
          result = [clamp(result[0] * amount), clamp(result[1] * amount), clamp(result[2] * amount), result[3]];
        } else if (name === "contrast" && Number.isFinite(amount)) {
          result = [
            clamp((result[0] - 128) * amount + 128),
            clamp((result[1] - 128) * amount + 128),
            clamp((result[2] - 128) * amount + 128),
            result[3],
          ];
        }
      }
      return result;
    }, input);
    visibleBackground = applyFilters(visibleBackground);
    visibleForeground = applyFilters(visibleForeground);
    const foregroundLuminance = luminance(visibleForeground);
    const backgroundLuminance = luminance(visibleBackground);
    const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);

    const rgb = (color: RGBA): string => "rgb("
      + Math.round(color[0]) + ", "
      + Math.round(color[1]) + ", "
      + Math.round(color[2]) + ")";

    return {
      text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
      foreground: style.color + " (" + rgb(visibleForeground) + ")",
      background: rgb(visibleBackground),
      cssBackground,
      ancestorFilters,
      ratio: Number(ratio.toFixed(3)),
    };
  });
}

export async function measureFocusContrast(locator: Locator): Promise<FocusMeasurement> {
  return locator.evaluate((element) => {
    type RGBA = [number, number, number, number];
    const clamp = (value: number): number => Math.max(0, Math.min(255, value));
    const parse = (value: string): RGBA | null => {
      const opening = value.indexOf("(");
      const fn = value.slice(0, opening).trim().toLowerCase();
      const body = value.slice(opening + 1, value.lastIndexOf(")"));
      const values = body.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number);
      if (!values || values.length < 3) return null;

      let linear: number[] | null = null;
      if (fn === "lab") {
        const [L, a, b] = values;
        const fy = (L + 16) / 116;
        const fx = fy + a / 500;
        const fz = fy - b / 200;
        const f = (v: number): number => v ** 3 > 216 / 24389 ? v ** 3 : (116 * v - 16) / 903.3;
        const x50 = f(fx) * 0.96422;
        const y50 = f(fy);
        const z50 = f(fz) * 0.82521;
        const x = 0.9555766 * x50 - 0.0230393 * y50 + 0.0631636 * z50;
        const y = -0.0282895 * x50 + 1.0099416 * y50 + 0.0210077 * z50;
        const z = 0.0122982 * x50 - 0.020483 * y50 + 1.3299098 * z50;
        linear = [
          3.24096994 * x - 1.53738318 * y - 0.49861076 * z,
          -0.96924364 * x + 1.8759675 * y + 0.04155506 * z,
          0.05563008 * x - 0.20397696 * y + 1.05697151 * z,
        ];
      } else if (fn === "oklab" || fn === "oklch") {
        let L = values[0];
        let a = values[1];
        let b = values[2];
        if (L > 1) L /= 100;
        if (fn === "oklch") {
          const angle = (b * Math.PI) / 180;
          b = a * Math.sin(angle);
          a = a * Math.cos(angle);
        }
        const lRoot = L + 0.3963377774 * a + 0.2158037573 * b;
        const mRoot = L - 0.1055613458 * a - 0.0638541728 * b;
        const sRoot = L - 0.0894841775 * a - 1.291485548 * b;
        const l = lRoot ** 3;
        const m = mRoot ** 3;
        const s = sRoot ** 3;
        linear = [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        ];
      } else if (fn === "color" && body.trim().startsWith("srgb")) {
        return [clamp(values[0] * 255), clamp(values[1] * 255), clamp(values[2] * 255), values[3] ?? 1];
      } else {
        return [clamp(values[0]), clamp(values[1]), clamp(values[2]), values[3] ?? 1];
      }

      const srgb = linear.map((channel) => clamp(255 * (
        channel <= 0.0031308
          ? 12.92 * channel
          : 1.055 * Math.sign(channel) * Math.abs(channel) ** (1 / 2.4) - 0.055
      )));
      return [srgb[0], srgb[1], srgb[2], values[3] ?? 1];
    };
    const composite = (top: RGBA, under: RGBA): RGBA => {
      const alpha = top[3] + under[3] * (1 - top[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        (top[0] * top[3] + under[0] * under[3] * (1 - top[3])) / alpha,
        (top[1] * top[3] + under[1] * under[3] * (1 - top[3])) / alpha,
        (top[2] * top[3] + under[2] * under[3] * (1 - top[3])) / alpha,
        alpha,
      ];
    };
    const luminance = (color: RGBA): number => {
      const linear = (channel: number): number => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2]);
    };

    const style = getComputedStyle(element);
    const outline = parse(style.outlineColor);
    const body = parse(getComputedStyle(document.body).backgroundColor);
    const html = parse(getComputedStyle(document.documentElement).backgroundColor);
    const backdrop = body && body[3] > 0 ? body : html && html[3] > 0 ? html : [255, 255, 255, 1] as RGBA;
    if (!outline) throw new Error("Unsupported outline color: " + style.outlineColor);
    const visibleOutline = composite(outline, backdrop);
    const foregroundLuminance = luminance(visibleOutline);
    const backgroundLuminance = luminance(backdrop);
    const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
      / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    return {
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
      ratio: Number(ratio.toFixed(3)),
    };
  });
}
