# Atlas Arcade

Geography mini-games and a boss stage, in a retro arcade cabinet.

**Live:** https://atlasarcade.app

**Status:** Live. Verified on September 27, 2026.

The game list includes GeoRadar, Capital Strike, Flag Frenzy, Peaks & Valleys, Tectonic Snap, Frontier Face-Off, One Strike, Urban Legends, Skyline Silhouette, Border Blitz, and Stat Attack. **Atlas Jackpot** is a boss stage that unlocks at levels 5, 10, and 15.

## Motivation

Online geography quizzes often take one of two routes. Educational games can feel like school, while polished casual games can use approximate scoring or outdated facts. Wordle showed that a daily puzzle can be quick, shared, and worth returning to because it is limited.

Atlas Arcade combines a daily puzzle, an arcade-style game loop, and a quiz engine based on real geography data. Its games cover location, names, elevation, skylines, and borders.

## The idea

The CRT skin is the surface. Underneath is a quiz engine that takes geography seriously: real distance-based scoring against real country and city data, no approximations dressed up as difficulty. The retro styling never gets to cost accuracy, and it never gets to cost tap targets or load speed either.

Every game runs in one of two modes. **Daily Challenge** is the same puzzle worldwide, seeded by UTC date, with streaks and leaderboard rankings. **Arcade** allows unlimited play for score and uses a coin economy that refills over time. The daily challenge stays limited, while extended play remains optional.

## Problems worth solving

**One shell for every game.** A change to the mode selector should not require edits in each game. The game-select grid, Daily/Arcade modal, HUD frame, scoring reveal, and coin spend each live in one shared shell. A game supplies its round logic and accent color through `gameTheme.ts`.

**The comparison moment cannot lag.** In a guessing game, the instant between locking an answer and seeing the result is the entire product. Peaks & Valleys shipped with a visible stall there, because the comparison image was fetched at reveal time. Preloading it during the guess phase fixed that game and set the standard the others are held to: no network work on the reveal path, ever.

**Dark theme without a flash.** The arcade is dark by default and saves the user's choice, so the theme must be applied to `<html>` before first paint. Otherwise, each load starts with a white flash. A synchronous inline script runs before hydration. `layout.tsx` documents the React setup and two warnings in this Next.js fork that isolation testing found cannot be fixed in application code.

**An energy economy that respects the player.** Arcade play is gated by coins, and the balance is easy to get wrong in the greedy direction. The rules (`src/lib/tokens.ts`): hold at most 5, regenerate 1 every 2 hours while below the ceiling, at most 10 granted per UTC day, reset at UTC midnight alongside the daily challenge. Crucially the same model runs for guests in localStorage and for signed-in players in Supabase, so nobody is punished for not having an account.

**High-energy visuals with limits.** Retro visuals can include flicker, glitch, and neon. Those effects can pose photosensitivity risks, so each is limited in intensity and frequency. The game never relies on color or motion alone to convey information.

## Design rules the code enforces

These aren't style preferences, they're constraints checked during review:

- **Zero border-radius**, anywhere. Elevation is glow, never a drop shadow.
- **One neon accent per game**, defined once in `src/lib/gameTheme.ts` and carried through the game's card, its mode-select modal and its in-game HUD. Yellow belongs to Atlas Jackpot alone.
- **Modals require an explicit close action.** Use the `X` or `[ CLOSE ]` control. A backdrop click never closes a modal. Spending a coin or locking an answer should require intent.
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

A Supabase project is optional. To enable sign-in, leaderboards, and referral bonuses, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, then apply the files in `supabase/migrations/` in filename order. Anonymous play works without Supabase.

Country data is regenerated with `node scripts/fetchCountries.mjs`.

## Note on the fork

This project uses a Next.js version with breaking API changes. Read `node_modules/next/dist/docs/` instead of assuming upstream conventions. See `AGENTS.md` for project guidance.
