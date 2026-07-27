import type { ComponentType } from "react";
import { Globe2, Zap, Flag, TrendingUp, Puzzle, Swords, Skull, Building2, Landmark, Sword, Layers, Trophy, type LucideIcon } from "lucide-react";
import type { GameSlug } from "@/store/gameStore";
import type { TKey } from "@/lib/i18n";
import type { MashupProps } from "@/components/games/mashup";
import {
  GlobleGame, CapitalInvaders, FlagRush, PeaksValleys, TectonicSnap, FrontierFaceOff,
  OneStrike, UrbanLegends, SkylineSilhouette, BorderBlitz, StatAttack, AtlasJackpot,
} from "@/components/games";

export interface GameRegistryEntry {
  slug: GameSlug;
  title: string;
  /** Grid card description key. Atlas Jackpot has no grid card, so this is absent for it. */
  descKey?: TKey;
  Icon: LucideIcon;
  Component: ComponentType<{ onExit: () => void } & MashupProps>;
  /** Implements the MashupProps contract — eligible for Atlas Jackpot's boss-rush pool. */
  supportsMashup: boolean;
  comingSoon?: boolean;
  locked?: boolean;
}

/**
 * Single source of truth for every game: title, icon, component, and Jackpot-pool
 * eligibility. Add a new game here once — the select grid (page.tsx), the mode-select
 * modal title lookup, and Atlas Jackpot's boss-rush pool all read from this, so a new
 * game can never silently go missing from one of them the way skyline-silhouette,
 * border-blitz and stat-attack did from the Jackpot pool (each was hand-added to
 * page.tsx's grid but never to AtlasJackpot.tsx's separately hardcoded POOL/COMPONENTS/
 * TITLES trio).
 */
export const GAME_REGISTRY: Record<GameSlug, GameRegistryEntry> = {
  "globle":             { slug: "globle",             title: "GEORADAR",           descKey: "descGloble",    Icon: Globe2,     Component: GlobleGame,        supportsMashup: true },
  "capital-invaders":   { slug: "capital-invaders",   title: "CAPITAL STRIKE",     descKey: "descCapital",   Icon: Zap,        Component: CapitalInvaders,   supportsMashup: true },
  "flag-rush":          { slug: "flag-rush",          title: "FLAG FRENZY",       descKey: "descFlag",      Icon: Flag,       Component: FlagRush,          supportsMashup: true },
  "peaks-valleys":      { slug: "peaks-valleys",      title: "PEAKS & VALLEYS",   descKey: "descPeaks",     Icon: TrendingUp, Component: PeaksValleys,      supportsMashup: true },
  "tectonic-snap":      { slug: "tectonic-snap",      title: "TECTONIC SNAP",     descKey: "descTectonic",  Icon: Puzzle,     Component: TectonicSnap,      supportsMashup: true },
  "frontier-faceoff":   { slug: "frontier-faceoff",   title: "FRONTIER FACE-OFF", descKey: "descFrontier",  Icon: Swords,     Component: FrontierFaceOff,   supportsMashup: true },
  "one-strike":         { slug: "one-strike",         title: "ONE STRIKE",        descKey: "descOneStrike", Icon: Skull,      Component: OneStrike,         supportsMashup: true },
  "urban-legends":      { slug: "urban-legends",      title: "URBAN LEGENDS",     descKey: "descUrban",     Icon: Building2,  Component: UrbanLegends,      supportsMashup: true },
  "skyline-silhouette": { slug: "skyline-silhouette", title: "SKYLINE SILHOUETTE", descKey: "descSkyline",  Icon: Landmark,   Component: SkylineSilhouette, supportsMashup: true },
  "border-blitz":       { slug: "border-blitz",       title: "BORDER BLITZ",      descKey: "descBorder",    Icon: Sword,      Component: BorderBlitz,       supportsMashup: true },
  "stat-attack":        { slug: "stat-attack",        title: "STAT ATTACK",       descKey: "descStat",      Icon: Layers,     Component: StatAttack,        supportsMashup: true },
  "atlas-jackpot":      { slug: "atlas-jackpot",      title: "ATLAS JACKPOT",     Icon: Trophy,             Component: AtlasJackpot,                        supportsMashup: false },
};

/** Grid cards — every game except Atlas Jackpot (rendered as its own hero banner). Narrowed
 *  so `descKey` reads as definitely present, since every non-Jackpot entry has one. */
export const GAMES_GRID: Array<GameRegistryEntry & { descKey: TKey }> = Object.values(GAME_REGISTRY).filter(
  (g): g is GameRegistryEntry & { descKey: TKey } => g.slug !== "atlas-jackpot",
);

/** Games eligible for Atlas Jackpot's boss-rush pool — anything implementing the MashupProps contract. */
export const MASHUP_POOL: GameSlug[] = Object.values(GAME_REGISTRY)
  .filter((g) => g.supportsMashup)
  .map((g) => g.slug);
