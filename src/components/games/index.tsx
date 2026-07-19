import dynamic from "next/dynamic";

const Loader = ({ color }: { color: string }) => (
  <div className="min-h-dvh flex items-center justify-center bg-arcade-bg">
    <p className={`font-pixel text-sm ${color} animate-blink`}>LOADING...</p>
  </div>
);

export const GlobleGame = dynamic(() => import("./GlobleGame"), {
  loading: () => <Loader color="text-arcade-neon-cyan" />,
  ssr: false,
});

export const CapitalInvaders = dynamic(() => import("./CapitalInvaders"), {
  loading: () => <Loader color="text-arcade-neon-orange" />,
  ssr: false,
});

export const FlagRush = dynamic(() => import("./FlagRush"), {
  loading: () => <Loader color="text-arcade-neon-blue" />,
  ssr: false,
});

export const PeaksValleys = dynamic(() => import("./PeaksValleys"), {
  loading: () => <Loader color="text-arcade-neon-green" />,
  ssr: false,
});

export const TectonicSnap = dynamic(() => import("./TectonicSnap"), {
  loading: () => <Loader color="text-arcade-neon-mint" />,
  ssr: false,
});

export const FrontierFaceOff = dynamic(() => import("./FrontierFaceOff"), {
  loading: () => <Loader color="text-arcade-neon-purple" />,
  ssr: false,
});

export const OneStrike = dynamic(() => import("./OneStrike"), {
  loading: () => <Loader color="text-arcade-neon-red" />,
  ssr: false,
});

export const UrbanLegends = dynamic(() => import("./UrbanLegends"), {
  loading: () => <Loader color="text-arcade-neon-magenta" />,
  ssr: false,
});

export const SkylineSilhouette = dynamic(() => import("./SkylineSilhouette"), {
  loading: () => <Loader color="text-arcade-neon-white" />,
  ssr: false,
});

export const BorderBlitz = dynamic(() => import("./BorderBlitz"), {
  loading: () => <Loader color="text-arcade-neon-lime" />,
  ssr: false,
});

export const StatAttack = dynamic(() => import("./StatAttack"), {
  loading: () => <Loader color="text-arcade-neon-pink" />,
  ssr: false,
});

export const AtlasJackpot = dynamic(() => import("./AtlasJackpot"), {
  loading: () => <Loader color="text-arcade-neon-yellow" />,
  ssr: false,
});
