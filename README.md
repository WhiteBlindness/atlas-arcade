# Atlas Arcade

Twelve geography mini-games and a boss stage, in a retro arcade cabinet.

**Live:** https://atlasarcade.app

GeoRadar · Capital Strike · Flag Frenzy · Peaks & Valleys · Tectonic Snap · Frontier Face-Off · One Strike · Urban Legends · Skyline Silhouette · Border Blitz · Stat Attack — plus **Atlas Jackpot**, a mashup boss stage that unlocks at levels 5, 10 and 15.

## Motivation

Geography quizzes online tend to fall into one of two traps. Either they're genuinely educational and feel like a school exercise, or they're slick and casual but quietly wrong — "close enough" scoring, stale capitals, borders from a decade ago. Wordle proved a third thing was possible: one puzzle a day, shared by everyone, over in ninety seconds, and worth coming back to precisely because it's scarce.

Atlas Arcade is an attempt at all of it at once — the daily-ritual loop, an arcade cabinet's energy, and a quiz engine that doesn't cheat on the facts. Twelve games rather than one, because geography has more than one interesting question in it: where a place is, what it's called, how high it sits, what its skyline looks like, who it borders.

## The idea

The CRT skin is the surface. Underneath is a quiz engine that takes geography seriously: real distance-based scoring against real country and city data, no approximations dressed up as difficulty. The retro styling never gets to cost accuracy, and it never gets to cost tap targets or load speed either.

Every game runs in one of two modes. **Daily Challenge** is the same puzzle worldwide, seeded by UTC date, played for a streak and a leaderboard place. **Arcade** is unlimited play for score, gated by a coin economy that refills over time — so the daily stays scarce and the grind stays optional.

## Problems worth solving

**Twelve games, one shell.** The obvious failure mode is twelve bespoke games sharing nothing, where a change to the mode-select modal means twelve edits and three of them get forgotten. Everything general — the game-select grid, the Daily/Arcade modal, the HUD frame, the scoring reveal, the coin spend — lives once. A game supplies its own round logic and an accent color registered in `gameTheme.ts`, and inherits the rest.

**The comparison moment cannot lag.** In a guessing game, the instant between locking an answer and seeing the result is the entire product. Peaks & Valleys shipped with a visible stall there, because the comparison image was fetched at reveal time. Preloading it during the guess phase fixed that game and set the standard the others are held to: no network work on the reveal path, ever.

**Dark theme, no flash.** The arcade is dark by default and the user's choice is persisted, so the theme has to be on `<html>` before first paint — otherwise every load starts with a white flash. That means a synchronous inline script running before hydration, and a documented dance with React to keep it from tripping a hydration mismatch. `layout.tsx` carries the full notes, including two warnings in this Next.js fork that isolation testing showed are not fixable from application code.

**An energy economy that respects the player.** Arcade play is gated by coins, and the balance is easy to get wrong in the greedy direction. The rules (`src/lib/tokens.ts`): hold at most 5, regenerate 1 every 2 hours while below the ceiling, at most 10 granted per UTC day, reset at UTC midnight alongside the daily challenge. Crucially the same model runs for guests in localStorage and for signed-in players in Supabase, so nobody is punished for not having an account.

**High-energy without harm.** Retro means flicker, glitch and neon — effects that in careless hands are a photosensitivity hazard. Every one of them is capped in amplitude and frequency, and no information is ever conveyed by color or motion alone. This is treated as a hard constraint, not a polish item.

## Design rules the code enforces

These aren't style preferences, they're constraints checked during review:

- **Zero border-radius**, anywhere. Elevation is glow, never a drop shadow.
- **One neon accent per game**, defined once in `src/lib/gameTheme.ts` and carried through the game's card, its mode-select modal and its in-game HUD. Yellow belongs to Atlas Jackpot alone.
- **Modals close only** via an explicit `X` / `[ CLOSE ]` control — never a backdrop click. Spending a coin or locking an answer should take intent.
- **No strobe. Ever.** The flicker, blink and glitch effects stay low-amplitude and slow. High-energy must not mean photosensitivity risk, and WCAG AA contrast holds in both the dark and light themes.

Full visual system in `DESIGN.md`, product intent in `PRODUCT.md`.

## Stack

Next.js App Router · TypeScript · Zustand for game state · Supabase for auth, profiles, leaderboards and referrals · MapLibre GL and react-globe.gl / three.js for the map and globe games · Tailwind · Press Start 2P + VT323

Deployed on Vercel. UI is localized through `src/lib/i18n.ts`.

## Running it

```bash
npm install
npm run dev
```

Needs a Supabase project — set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then apply everything in `supabase/migrations/` in filename order. Anonymous play works without it; sign-in, leaderboards and referral bonuses don't.

Country data is regenerated with `node scripts/fetchCountries.mjs`.

## Note on the fork

This project targets a Next.js version with breaking API changes. Consult `node_modules/next/dist/docs/` rather than assuming upstream conventions — see `AGENTS.md`.
