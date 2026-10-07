# Product

## Register

product

## Users

Two intended groups share the same shell:

- Casual geography players who want a short daily challenge.
- Players who want repeat arcade rounds, personal high scores and the Atlas Jackpot boss stage.

The product has no verified audience-size or usage-frequency statistics.

## Product purpose

Atlas Arcade offers 11 geography mini-games and a boss stage. Players choose a game, select daily or arcade mode, answer geography questions and review their result. The daily sequence uses a UTC-date seed. Arcade coins limit attempts and replenish over time.

## Brand personality

The interface follows an arcade cabinet: square controls, CRT scanlines, Press Start 2P labels, VT323 body text and distinct game accents. Keep this identity when fixing usability defects. Avoid rounded mobile-game styling, unrelated gradients, mascots and ad-shaped placeholders.

Distance-based scoring and curated geography datasets support the educational theme. Coordinates, borders and statistics have source and age limits; the product does not guarantee exact or current reference data.

## Design principles

1. Give immediate answer feedback from data available during the round. Preload the next comparison image where practical.
2. Keep one accent per game, shared by the card, mode selector and game interface. Yellow identifies Atlas Jackpot and game coins.
3. Preserve readable text and visible keyboard focus in both themes. Retro styling must accommodate touch targets and narrow screens.
4. Require deliberate actions to choose a mode or spend a coin. Explicit close controls and Escape dismiss dialogs; backdrop clicks do not.
5. Keep essential labels visible. Reduced-motion preferences remove non-essential ambient and decorative animation.

## Accessibility and inclusion

Text contrast targets are at least 4.5:1 for normal text and 3:1 for large text. Important focus indicators target 3:1 against adjacent surfaces. Browser tests verify representative rendered states; these checks do not certify whole-application WCAG conformance.

Icon-only controls need accessible names. Dialogs need names, initial focus, a focus trap and focus restoration. Score and state changes should be announced where useful. Names, text and icons accompany color so players do not depend on a hue alone.

## Trust boundaries

Game coins have no cash value. Guest balances and daily progress live in the browser. Authenticated balance changes require guarded database functions; client-computed outcomes cannot safely authorize persistent rewards. Server-bounded score submissions remain browser-reported results rather than verified gameplay.
