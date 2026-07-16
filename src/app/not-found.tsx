import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-start pt-8 md:justify-center md:pt-0 gap-8 bg-arcade-bg px-4 text-center">
      <p className="font-pixel text-6xl text-arcade-neon-red neon-text-red">404</p>

      <div className="space-y-3">
        <h1 className="font-pixel text-sm text-arcade-neon-red neon-text-red tracking-widest animate-blink">
          GAME OVER
        </h1>
        <p className="font-pixel text-[10px] text-gray-400 tracking-widest">PAGE NOT FOUND.</p>
        <p className="font-mono text-sm text-gray-600">This sector of the map is uncharted.</p>
      </div>

      <Link
        href="/"
        className="font-pixel text-[10px] border border-arcade-neon-cyan text-arcade-neon-cyan neon-text-cyan px-6 py-3 hover:bg-arcade-neon-cyan hover:text-black transition-all"
        style={{ boxShadow: "0 0 12px #00d4ff55, 0 0 32px #00d4ff22" }}
      >
        ← BACK TO ARCADE
      </Link>
    </div>
  );
}
