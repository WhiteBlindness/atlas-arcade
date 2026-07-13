import dynamic from "next/dynamic";

const Loader = ({ color }: { color: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-arcade-bg">
    <p className={`font-pixel text-sm ${color} animate-blink`}>LOADING...</p>
  </div>
);

export const GlobleGame = dynamic(() => import("./GlobleGame"), {
  loading: () => <Loader color="text-arcade-neon-cyan" />,
  ssr: false,
});

export const CapitalInvaders = dynamic(() => import("./CapitalInvaders"), {
  loading: () => <Loader color="text-arcade-neon-magenta" />,
  ssr: false,
});

export const FlagRush = dynamic(() => import("./FlagRush"), {
  loading: () => <Loader color="text-arcade-neon-yellow" />,
  ssr: false,
});

export const PeaksValleys = dynamic(() => import("./PeaksValleys"), {
  loading: () => <Loader color="text-arcade-neon-green" />,
  ssr: false,
});
