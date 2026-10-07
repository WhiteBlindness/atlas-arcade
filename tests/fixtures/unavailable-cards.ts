import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Globe2 } from "lucide-react";
import { GameCard } from "../../src/components/ui/GameCard";
import { GAME_THEME } from "../../src/lib/gameTheme";

const fixtures = Object.keys(GAME_THEME).flatMap((slug) =>
  (["locked", "comingSoon"] as const).map((status) => ({
    slug, status,
    markup: renderToStaticMarkup(createElement(GameCard, {
      slug: slug as keyof typeof GAME_THEME,
      title: "UNAVAILABLE FIXTURE", description: "Unavailable game description.",
      Icon: Globe2, highScore: 12_345, [status]: true, onPlay: () => {},
    })),
  })),
);
console.log(JSON.stringify(fixtures));
