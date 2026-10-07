# Atlas Arcade

Eleven geography mini-games and the Atlas Jackpot boss stage, in a retro arcade cabinet.

[Play Atlas Arcade](https://atlasarcade.app)

Atlas Arcade is live. Guests can play without an account. Supabase supports sign-in, profiles, high scores and referrals. Daily challenges use a seed derived from the UTC date; arcade mode uses replenishing game coins. Coins and premium tokens have no cash value, and the app has no purchase flow.

## Product and engineering

The games cover country locations, capitals, flags, elevation, borders, cities and geography statistics. A shared registry supplies the game grid, mode selector and Jackpot pool. Zustand stores session state and browser preferences; pure geography and token functions keep scoring and regeneration rules separate from the interface.

The visual system uses pixel typography, square controls and a distinct accent for each game. Explicit foreground and background tokens preserve game-card readability across hover, focus and pressed states in dark and light themes. Modal keyboard support and focused Playwright/axe checks cover the shared shell. Reduced-motion preferences disable non-essential animation.

Game components load on demand. The globe renderer uses react-globe.gl and three.js. Peaks & Valleys preloads the next comparison image during the current round; reveal handlers use the current round data rather than waiting for a new question request. External images and map data still depend on their providers and the connection.

## Stack

Next.js App Router, React, TypeScript, Zustand, Supabase, Tailwind, react-globe.gl, three.js, Press Start 2P and VT323. The app is hosted on Vercel and has English, Portuguese and Spanish game text.

## Run locally

Use Node.js 24 and npm:

```bash
npm ci
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` before starting the app. The client initializes Supabase even for guest sessions; playing as a guest does not require creating an account. The repository does not yet contain the complete deployed database schema and RPC definitions; do not treat its migration directory as a complete fresh-project setup.

Country data is regenerated with `node scripts/fetchCountries.mjs`.

## Checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:live
npm audit
npm audit --omit=dev
```

Local browser tests use an isolated Supabase test endpoint. The live smoke test reads the public site in a fresh browser context and does not submit account or score data. Card tests calculate contrast from browser-computed colors; screenshots supplement those assertions.

## Data, content and limits

Privacy, terms, storage information and source credits are available through the app footer. [Asset provenance](docs/asset-provenance.md) records image-level licences, attribution conditions and unresolved rights. Geography statistics and coordinates are curated snapshots; some are rounded or can become outdated. They are game data, rather than a reference source for current statistics.

Authenticated balance and score hardening includes guarded database RPCs and a migration with schema preflight checks. That migration requires review against the deployed schema and validation in a test database before production application. The client fails closed when these RPCs are missing. Scores are still reported by the browser; the server bounds submissions but does not verify each answer. Client-computed Jackpot rewards cannot authorize account token grants.

The operator's public identity, privacy contact, retention schedule and deployed deletion behavior remain necessary policy decisions. Full application accessibility and third-party asset rights are not certified by the focused automated checks.

[Design rules](DESIGN.md) and [product intent](PRODUCT.md) describe the interface. Read the installed Next.js guides under `node_modules/next/dist/docs/` before changing framework APIs.
