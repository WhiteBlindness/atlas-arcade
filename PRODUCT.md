# Product

## Register

product

## Users

Two overlapping groups, roughly 70/30:
- **Casual geo-trivia players (majority)**: play 1-2 quick rounds a day via the Daily Challenge, chasing a streak and leaderboard bragging rights. Low commitment, drop in/out in under a minute.
- **Competitive score-chasers (minority)**: grind Arcade mode for high scores, spend coins across the 12 mini-games, and push toward the Atlas Jackpot boss stage (unlocked at L5·L10·L15).

Both groups share one app shell: a game-select grid, a Daily/Arcade mode-select modal per game, in-game HUDs, and a coin economy that gates Arcade attempts.

## Product Purpose

A retro arcade cabinet of geography mini-games (GeoRadar, Capital Strike, Flag Frenzy, Peaks & Valleys, Tectonic Snap, Frontier Face-Off, One Strike, Urban Legends, Skyline Silhouette, Border Blitz, Stat Attack, plus the Atlas Jackpot boss stage). Success looks like: a player opens the arcade, immediately reads which game does what and what mode they're in, and gets clean instant feedback on every guess — no dead air, no ambiguity about score or state.

## Brand Personality

Punchy, retro, precise — a real arcade cabinet, not a mobile hyper-casual skin.
- **Retro / nostalgic**: 80s-90s arcade cabinet, CRT scanlines, pixel font (Press Start 2P + VT323), neon glow on dark.
- **Punchy / high-energy**: fast feedback, instant score reveals, bold neon accents, confident retro-UI chrome (`[ BUTTON ]` bracket styling, blinking CTAs).
- **Precise / educational**: geography accuracy is the actual product — real distance-based scoring, real country/city data. The retro skin sits on top of a genuinely accurate geo-quiz engine, never at the expense of it.
- Accessible by design intent: high-energy does not mean high-risk — no strobe/seizure-triggering effects, ever (see Accessibility).

## Anti-references

Explicitly not: generic mobile hyper-casual (bright rounded gradients, cartoon mascots, aggressive ad-style interstitials, Candy-Crush/King-style chrome). Atlas Arcade is a cabinet game, not a gacha app — no forced-cheerful mascots, no gradient-soup buttons, no ad-shaped UI pretending to be content.

## Design Principles

1. **Instant feedback, always.** Every guess, reveal, and mode transition must read as immediate — no visible network/render lag on the comparison moment (see the Peaks & Valleys image-preload fix as the standard to match elsewhere).
2. **One accent color per game, used consistently.** Each of the 12 games owns a single neon identity color (already codified in `src/lib/gameTheme.ts`) carried through its card, mode-select modal, and in-game HUD. Yellow is reserved exclusively for Atlas Jackpot.
3. **Retro chrome, not retro friction.** Pixel fonts and bracket-button styling (`[ PLAY ]`) are the voice; they must never come at the cost of tap targets, readability, or load speed.
4. **Explicit state, explicit close.** Modals close only via their `X`/`[ CLOSE ]` control, never backdrop click — state changes (mode chosen, coin spent, answer locked) must be deliberate, not accidental.
5. **High-energy, zero seizure-risk.** Flicker/glitch/blink effects stay subtle and looping at safe, non-strobing rates (see `body::before` flicker, `neonPulse`) — never used as a substitute for real motion design, never fast/high-contrast enough to be a photosensitivity risk.

## Accessibility & Inclusion

- **WCAG AA contrast**: 4.5:1 minimum for body text against its background, in both the dark (default) and light (`.light` class) themes.
- **No seizure-risk motion**: no strobe, no rapid high-contrast flashing. Existing `flicker`/`blink`/`glitch` effects must stay within safe amplitude/frequency — flagged explicitly by the user as a hard constraint, not a nice-to-have.
- **Screen reader support**: meaningful `aria-label`s on icon-only controls (already the pattern for close/X buttons), live-region announcements for score/state changes where practical, and no information conveyed by color/animation alone without a text or icon fallback.
