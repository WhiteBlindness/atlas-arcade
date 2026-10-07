import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { Globe2 } from "lucide-react";
import { GameCard } from "../src/components/ui/GameCard";

const baseProps = {
  slug: "globle" as const,
  title: "GEORADAR",
  description: "Guess the mystery country.",
  Icon: Globe2,
  onPlay: () => {},
};

test("locked GameCard fixture is disabled, explains its status, and keeps a personal best", () => {
  const html = renderToStaticMarkup(createElement(GameCard, {
    ...baseProps,
    locked: true,
    highScore: 12_345,
  }));

  assert.match(html, /<button[^>]*disabled=""/);
  assert.match(html, /aria-describedby="game-globle-description game-globle-status game-globle-locked"/);
  assert.match(html, /\sLOCKED<\/span>/);
  assert.match(html, />COMING SOON<\//);
  assert.match(html, />12 345<\//);
});

test("coming-soon GameCard fixture is disabled and does not claim a personal best", () => {
  const html = renderToStaticMarkup(createElement(GameCard, {
    ...baseProps,
    comingSoon: true,
    highScore: 12_345,
  }));

  assert.match(html, /<button[^>]*disabled=""/);
  assert.match(html, /aria-describedby="game-globle-description game-globle-status"/);
  assert.match(html, />COMING SOON<\//);
  assert.doesNotMatch(html, />12 345<\//);
});
