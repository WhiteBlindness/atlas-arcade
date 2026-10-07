import assert from "node:assert/strict";
import { test } from "node:test";
import { buildShareText } from "../src/lib/share";

test("shared results state the achieved score without invented player rankings", () => {
  const text = buildShareText({ gameTitle: "GEORADAR", score: 850, performance: 0.78, squares: "🟧🟨🟩" });
  assert.match(text, /Score: 850/);
  assert.match(text, /🟧🟨🟩/);
  assert.match(text, /atlasarcade\.app/);
  assert.doesNotMatch(text, /beat|players|percentile|%/i);
});
