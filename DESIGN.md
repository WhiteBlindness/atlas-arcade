---
name: Atlas Arcade
description: A retro CRT arcade cabinet of geography mini-games — pixel chrome, twelve neon identities, one signal color.
colors:
  signal-cyan: "#00d4ff"
  pulse-green: "#00ff41"
  solar-yellow: "#ffe600"
  ember-orange: "#ff8c00"
  electric-blue: "#0088ff"
  reactor-mint: "#00ffa6"
  ultraviolet-purple: "#b800ff"
  alert-red: "#ff3333"
  hot-magenta: "#ff00ff"
  ghost-white: "#f8f8f8"
  volt-lime: "#ccff00"
  arcade-pink: "#ff00aa"
  void-bg: "#080810"
  panel-surface: "#0f0f1a"
  circuit-border: "#1a1a2e"
  ghost-ink: "#16161f"
typography:
  display:
    fontFamily: "'Press Start 2P', 'VT323', monospace"
    fontSize: "clamp(0.7rem, 2vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.15em"
  label:
    fontFamily: "'Press Start 2P', 'VT323', monospace"
    fontSize: "7px-11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.1em"
  body:
    fontFamily: "'VT323', monospace"
    fontSize: "0.875rem-1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  none: "0px"
components:
  button-primary:
    backgroundColor: "{colors.void-bg}"
    textColor: "{colors.signal-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.signal-cyan}"
    textColor: "{colors.void-bg}"
  card-game:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.signal-cyan}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "20px"
  modal-panel:
    backgroundColor: "{colors.void-bg}"
    textColor: "{colors.signal-cyan}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "24px"
---

# Design System: Atlas Arcade

## 1. Overview

**Creative North Star: "The Neon Atlas"**

Atlas Arcade is geography fused with cabinet arcade: a dark CRT bezel lit by a single glowing map. The system runs on one wordmark color (Signal Cyan) plus eleven equal-weight neon identities — one per mini-game — so a player always knows, by color alone, which game they're in before they read a single label. Every surface is dark by default (`#080810`), every corner is square, every button is a bracketed command (`[ PLAY ]`, `[ INSERT COIN ]`), and every glow is a `box-shadow`/`text-shadow` pair, never a lift or drop-shadow.

The system explicitly rejects generic mobile hyper-casual: no bright rounded gradients, no cartoon mascots, no ad-shaped interstitials pretending to be content. Atlas Arcade is a cabinet you walk up to, not a gacha app that chases you. High-energy stays honest — neon, blink, and glitch effects are tuned to loop gently, never to strobe; nothing here should be a photosensitivity risk.

**Key Characteristics:**
- One brand-primary (Signal Cyan) for chrome/wordmark; eleven co-equal per-game neon accents, never mixed within one screen.
- Zero border-radius anywhere in the real component system — sharp corners only.
- Elevation is glow, never lift: no drop-shadows, ever.
- Pixel display font for chrome/labels, monospace VT323 for readable body copy and as the accented-character fallback.
- A light "on paper" theme exists as a first-class alternate, not an afterthought: same structure, ink-toned neons, glow suppressed for legibility.

## 2. Colors

Dark and saturated at rest, with color doing the identity work that shape and iconography usually do — each of the twelve games is "the purple one" or "the mint one" before it's anything else.

### Primary
- **Signal Cyan** (`#00d4ff`): the ATLAS wordmark, the header brand accent, and GeoRadar's game identity. The one color that reads as "this app," not "this game."

### Secondary — the eleven game identities
Each mini-game owns exactly one of these, used consistently across its card, its mode-select modal border/glow, and its in-game HUD accents. No game borrows another's color; Solar Yellow is reserved for Atlas Jackpot alone.
- **Pulse Green** (`#00ff41`): Peaks & Valleys. Also the system's general "success/confirm/streak-positive" tone (premium token counter, correct-answer flashes).
- **Ember Orange** (`#ff8c00`): Capital Strike.
- **Electric Blue** (`#0088ff`): Flag Frenzy.
- **Reactor Mint** (`#00ffa6`): Tectonic Snap.
- **Ultraviolet Purple** (`#b800ff`): Frontier Face-Off.
- **Alert Red** (`#ff3333`): One Strike. Also the system's "danger/wrong answer/streak flame" tone.
- **Hot Magenta** (`#ff00ff`): Urban Legends.
- **Ghost White** (`#f8f8f8`): Skyline Silhouette — the one "neon" that's actually a desaturated glow, used deliberately since the game itself is about reading a dark silhouette.
- **Volt Lime** (`#ccff00`): Border Blitz.
- **Arcade Pink** (`#ff00aa`): Stat Attack.
- **Solar Yellow** (`#ffe600`): Atlas Jackpot exclusively — the boss-stage color, also doubling as the coin/premium-currency tone in the header. Never assigned to a mini-game.

### Neutral
- **Void** (`#080810`): the default page/app background — near-black, not true black.
- **Panel Surface** (`#0f0f1a`): cards, modals, HUD panels — one step lighter than Void.
- **Circuit Border** (`#1a1a2e`): default dividers and inactive borders, before an accent color takes over on hover/active/selected.
- **White** (`#ffffff`): primary body text on the dark theme.
- **Ghost Ink** (`#16161f`): primary body text and the light-theme's own "white" neon slot — on `.light`, this replaces both plain body text and every neon-white surface (since a literal near-white glow is illegible on a light background).

### Named Rules
**The One Signal Rule.** Signal Cyan is the only color allowed to mean "this is Atlas Arcade" as opposed to "this is [game]." It appears in the wordmark, the header brand mark, and GeoRadar (which is treated as the flagship/first game) — never as a generic default accent elsewhere.

**The No-Borrowing Rule.** A game's accent color appears on its card, its mode-select modal, and its own HUD — and nowhere else. Solar Yellow is hard-reserved for Atlas Jackpot; no other surface may use it as a primary accent.

## 3. Typography

**Display/Label Font:** "Press Start 2P", with "VT323" then `monospace` as fallback
**Body Font:** "VT323", with `monospace` fallback

**Character:** A true bitmap arcade font (Press Start 2P) carries all chrome, titles, and labels at deliberately tiny sizes (7px–11px is normal here, not a bug) with wide tracking. VT323 — a taller, more legible pixel-monospace — carries actual reading copy (descriptions, body text, countdown timers) and quietly substitutes for Press Start 2P's missing accented uppercase glyphs (Í, Ã, Ç) in PT/ES copy, so multilingual text never shows tofu.

### Hierarchy
- **Display** (400, `clamp(0.7rem, 2vw, 1.5rem)`, 1.4 line-height, 0.15em tracking): page-level headings like "SELECT GAME" or a modal's game title. Press Start 2P.
- **Label** (400, 7px–11px, 0.1em tracking, uppercase by convention): buttons, badges, HUD counters, step indicators. The bulk of all UI text lives here. Press Start 2P.
- **Body** (400, 14px–16px, 1.6 line-height): descriptions, instruction copy, countdowns. VT323 — legible at reading size where the pixel display font would strain the eye.

### Named Rules
**The Tiny-Label Rule.** Press Start 2P is never used above ~24px; it's a chrome/label font, not a display font at hero scale. Anything meant to be *read* comfortably (descriptions, instructions, modal body copy) is VT323, not Press Start 2P.

## 4. Elevation

Atlas Arcade has no drop-shadow, lift, or z-axis elevation model at all. Depth is communicated entirely through **border + colored glow**: a 1px accent border plus a matched `box-shadow` glow (`0 0 8px <color>, 0 0 20px <color>55`) stands in for "this is raised" or "this is focused." Nothing ever gets a dark, neutral drop-shadow — that would read as a different, un-arcade-like design language.

### Shadow Vocabulary
- **Neon glow** (`box-shadow: 0 0 8px <accent>, 0 0 20px <accent>55`), one variant per accent color (`shadow-neon-cyan`, `shadow-neon-green`, … `shadow-neon-white`): applied to a card/modal/button on hover, focus, or active/selected state, always matching that surface's own accent — never a foreign color.
- **Text glow** (`text-shadow: 0 0 8px <accent>, 0 0 20px <accent>55`), the `neon-text-*` utilities: the same glow language applied to headings and labels instead of containers.

### Named Rules
**The Glow-Not-Lift Rule.** Emphasis is expressed by brightening (glow) and by border color, never by scale-up shadow or a simulated z-axis lift. A "raised" element in this system is brighter, not closer.

**The Tap-Flash Rule.** `:hover` does not exist for the majority of players — they're on touch screens. Every interactive card and CTA button pairs its hover treatment with an equally deliberate `:active` treatment: a visible press-down (`active:scale-95`, not the near-imperceptible `scale-[0.98]`) plus a high-opacity accent fill (`active:bg-<accent>/20`–`/30`, or `active:bg-current/15` on buttons whose own text color already carries the accent; neutral ghost controls get `active:bg-white/10`). The flash must read as *distinctly stronger* than any hover-state tint on the same element, since on mobile it's the player's only confirmation the tap registered.

## 5. Components

Buttons, cards, and modals share one grammar: a labeled rectangle, sharp corners, a 1px border in the surface's accent color, and a glow that only appears on hover/active/selected — never at rest.

### Buttons
- **Shape:** square corners, 0px radius, always.
- **Primary:** `border: 1px solid <accent>`, transparent/`void-bg` background, accent-colored text, wrapped in literal brackets in copy (`[ PLAY ]`, `[ INSERT COIN ]`, `[ CLOSE ]`). On hover: background fills solid with the accent color and text flips to near-black/void, plus the matching neon glow.
- **Hover / Focus:** `hover:bg-<accent> hover:text-black hover:shadow-neon-<accent>`, `transition-* duration-200` on every interactive element for consistent timing.
- **Active / Press (see The Tap-Flash Rule):** `active:scale-95` plus an accent-tinted `active:bg-*` fill — this is the primary feedback channel on mobile, not a hover afterthought. All interactive controls carry `touch-action: manipulation` to kill the 300ms mobile tap delay.
- **Ghost / Cancel:** no border, muted gray text (`text-gray-600`), brightens to white on hover, `active:bg-white/10` on press — used only for "back out" actions (Cancel, dismiss), never for a primary action.

### Cards (Game Select Grid)
- **Corner Style:** 0px radius, plus four small literal corner-bracket glyphs (absolutely positioned L-shaped border fragments) at each corner — a deliberate "targeting reticle" detail unique to game cards.
- **Background:** Panel Surface (`#0f0f1a`).
- **Shadow Strategy:** flat at rest; on hover, border and glow both switch to the card's own accent (see Elevation).
- **Border:** 1px, the game's own accent color at rest already (not neutral-then-accent-on-hover — the identity color is always visible).
- **Internal Padding:** ~20px (`p-5`), consistent gap-4 rhythm between icon/title/description/CTA.

### Modals
- **Corner Style:** 0px radius, 1px border and glow in the relevant accent (Signal Cyan for generic modals like Profile/Leaderboard; the selected game's own accent for the mode-select modal; Alert Red for the out-of-coins modal).
- **Background:** Void (`#080810`) or Panel Surface, full-bleed `bg-black/75`–`/85` scrim behind.
- **Close behavior — hard rule:** modals close **only** via an explicit `X` or `[ CLOSE ]` control. Backdrop click and backdrop drag never close a modal. This is deliberate, not an oversight — see PRODUCT.md's "explicit state, explicit close" principle.
- **Internal Padding:** 24px (`p-6`), `space-y-4` rhythm between sections.

### Inputs / Fields
- **Style:** bordered rectangle, `border-arcade-border` at rest, accent border on focus, dark surface fill. Font-size held at ≥16px on mobile specifically to defeat iOS Safari's input-triggered auto-zoom.
- **Focus:** border color shifts to the surface's accent; no separate focus ring or glow beyond that border shift.

### Navigation (Header)
- **Style:** single horizontal bar, `border-b border-arcade-border`, wordmark left (Signal Cyan "ATLAS" + gray "ARCADE" subtitle), a horizontally-scrollable icon/counter rail right (`overflow-x-auto scrollbar-hide` on mobile, since the full set of controls — language, streak, coins, premium tokens, leaderboard, theme, sound, auth — doesn't fit narrow viewports at once).
- **States:** icon-only controls at `w-10 h-10` (44px+ effective tap target via padding), `active:scale-90` press feedback, color shifts to the relevant accent on hover (cyan default, red for destructive sign-out).

### Signature Component: Coin / Token Counter
A bordered pill (not fully rounded — `border` rectangle) holding a small radial-gradient coin glyph plus a Label-weight number, color-coded by currency: Solar Yellow for arcade coins, Pulse Green for premium tokens, Alert Red for the daily streak flame. Admin accounts replace the coin count with an `∞` + `DEV` badge in Pulse Green.

## 6. Do's and Don'ts

### Do:
- **Do** give every mini-game exactly one accent color, reused identically across its card, its mode-select modal, and its HUD (`src/lib/gameTheme.ts` is the single source of truth — extend it, don't fork it).
- **Do** keep every corner square — 0px radius is the system default, not a missing feature.
- **Do** express emphasis with a colored glow (`shadow-neon-*` / `neon-text-*`) matched to the surface's own accent, never a neutral drop-shadow.
- **Do** require an explicit close control (`X` / `[ CLOSE ]`) on every modal; never wire a backdrop click or drag to dismiss.
- **Do** keep Press Start 2P at label/chrome scale only; move to VT323 the moment copy is meant to be actually read.
- **Do** keep looping ambient effects (flicker, blink, glitch) subtle and slow enough to never risk photosensitivity — this is a hard constraint from PRODUCT.md, not a style preference.

### Don't:
- **Don't** build generic mobile hyper-casual UI — no bright rounded gradients, no cartoon mascots, no ad-shaped interstitials. That is this system's explicit anti-reference.
- **Don't** reuse Solar Yellow for anything other than Atlas Jackpot and the coin/premium currency readouts.
- **Don't** add `border-radius` to a card, button, modal, or input. If a shape needs to look "soft," that's the wrong instinct for this system.
- **Don't** add a neutral/dark drop-shadow anywhere. If something needs to look "elevated," give it a matching neon glow instead.
- **Don't** wire any backdrop-click-to-close behavior on a modal, even as a "convenience."
- **Don't** design a flashing/strobing effect, even subtle-seeming ones stacked together — audit new motion against the existing `flicker` (8s loop, ~1-3% opacity dip) and `blink` (1s step-end) rates as the ceiling, not the floor.
