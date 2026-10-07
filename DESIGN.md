---
name: Atlas Arcade
description: A retro CRT arcade cabinet of geography mini-games: pixel chrome, twelve neon identities, one signal color.
colors:
  signal-cyan: "#00d4ff"
  pulse-green: "#00ff41"
  solar-yellow: "#ffe600"
  ember-orange: "#ff8c00"
  electric-blue: "#0088ff"
  reactor-mint: "#00ffa6"
  ultraviolet-purple: "#d000ff"
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

# Design system: Atlas Arcade

## Identity

Atlas Arcade uses square controls, CRT-inspired backgrounds, Press Start 2P labels and VT323 body text. A distinct accent identifies each game alongside its name and icon. Cyan identifies the app shell; yellow identifies Atlas Jackpot and game coins. Preserve this identity when improving readability or accessibility.

Use theme tokens from `src/app/globals.css` and game accents from `src/lib/gameTheme.ts`. Avoid copying a separate palette into a component. Dark surfaces use `#080810` and `#0f0f1a`; light surfaces use `#f4f3ec` and `#e7e6db` with `#16161f` body text.

## Color and contrast

Normal text targets at least 4.5:1. Large text and important non-text indicators target at least 3:1 against adjacent colors. Calculate relative luminance from rendered colors, including opacity and filters. Wait for finite transitions to settle before measuring an interaction state. Tokens alone do not prove whole-application WCAG conformance.

| Accent | Dark token | Light token |
|---|---|---|
| Cyan | `#00d4ff` | `#006e85` |
| Green | `#00ff41` | `#00751e` |
| Yellow | `#ffe600` | `#706500` |
| Orange | `#ff8c00` | `#995400` |
| Blue | `#0088ff` | `#0065bd` |
| Mint | `#00ffa6` | `#00754c` |
| Purple | `#d000ff` | `#a200e0` |
| Red | `#ff3333` | `#cc0000` |
| Magenta | `#ff00ff` | `#b300b2` |
| White/ink | `#f8f8f8` | `#16161f` |
| Lime | `#ccff00` | `#566b00` |
| Pink | `#ff00aa` | `#c20081` |

Use explicit foreground and background colors for filled actions. A dark-theme game-card action fills with its accent and uses dark ink on hover, keyboard focus and press. Light-theme actions use a persistent accent block with white text. Do not derive both foreground and background from `currentColor`. Disabled and locked cards keep readable labels and communicate their state through text and semantics.

Dark-theme neon shadows supplement borders and labels. Light mode suppresses decorative neon shadows. Essential information must remain legible without glow, color recognition or animation.

## Typography and layout

Use Press Start 2P for short labels and headings, with VT323 and monospace fallbacks. The Google sign-in button follows its provider branding rules and uses a self-hosted Google Sans medium font at 14px with 20px line height. Use VT323 for descriptions, instructions and policy text. Keep line lengths and spacing readable; increase body text rather than fitting a paragraph into a tiny label style. Inputs use at least 16px text on mobile to avoid automatic zoom.

Keep controls square and visibly labeled. Aim for 44 by 44 CSS pixels for touch controls where practical. Narrow layouts may wrap or scroll a clearly bounded control rail, but must not produce document-level horizontal overflow. Policy tables use their own keyboard-accessible scroll region.

## Interaction and dialogs

Cards expose the same information through pointer hover and keyboard focus. Hover, focus and pressed states preserve title, description, score and action contrast. A visible outline identifies keyboard focus; glow may supplement it. Decorative transforms must not obscure neighboring controls.

Use buttons for actions and links for navigation. Icon-only controls need accessible names. Decorative icons and backgrounds do not need descriptive alternatives. Images that communicate a question need an equivalent description that does not reveal the answer.

Dialogs have a name, initial focus, a focus trap and focus restoration. Escape closes the topmost dialog. An explicit close control remains available. Backdrop clicks do not dismiss dialogs. Nested dialogs retain the parent dialog's focus when the child closes.

## Motion

Keep essential labels visible throughout their animation. Ambient blink and flicker effects must not repeatedly hide text. Reduced-motion preferences suppress non-essential movement and make transitions immediate. Time-sensitive gameplay still needs visible state feedback; animation alone must not communicate a countdown or result.

Retro styling is a visual choice, not a photosensitivity guarantee. Review new effects in their rendered context and include them in reduced-motion checks.

## Verification

Playwright measures card contrast across both themes and interaction states. Representative shell, dialog, legal-page and game flows receive keyboard, layout and axe checks. Screenshots supplement computed-style assertions. See `docs/audit/visual-accessibility.md` and `docs/audit/browser-regression.md` for coverage and remaining limits.
