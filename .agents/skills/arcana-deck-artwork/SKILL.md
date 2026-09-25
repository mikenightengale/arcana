---
name: arcana-deck-artwork
description: Use only in the Cathedral Arcana project when adding or replacing deck cards, card visuals, or deck artwork assets.
---

# Arcana deck and artwork workflow

Use this skill only for card data or artwork work in the Cathedral Arcana repository. Make the requested deck/artwork change and verify the manifest and every affected rendering path.

## Project-specific structure

- `public/decks/cathedral/deck.json` is the canonical deck manifest. It contains exactly 78 cards with unique stable IDs and descriptive metadata; it is not a place for meanings or interpretations.
- Card faces are currently rendered as React SVG in `src/tarot/CrystalCard.tsx`. The optional `visual` fields in `src/types/tarot.ts` and the manifest configure parts of that renderer; confirm a field is actually consumed before adding or changing it.
- The deck back is a static asset referenced by `cardBack` in the manifest. `App.tsx` builds its public URL from that path. The gallery, shuffle, and reading views also use card visuals/assets, so check all affected contexts.
- Public asset URLs are rooted at `/`; files live under `public/`. Vite's PWA asset inclusion and precache patterns are in `vite.config.ts`.

## Workflow

1. Inspect the manifest schema, tarot types, renderer, and all usages of the changed card or asset. Confirm current conventions rather than assuming each face is a standalone image.
2. Keep the deck at exactly 78 cards with unique, stable IDs. For a replacement, preserve the card's identity and existing references unless the user asks to change them. Keep card name, arcana, suit, rank, and visual metadata aligned with the type and renderer.
3. Keep meaning, advice, and interpretation text out of the manifest and artwork metadata. Add only identity and presentation data that the app needs to render the deck.
4. For file-based art, place assets under `public/decks/cathedral/` and use a valid manifest-relative path where the schema supports one. Confirm the path exists and the generated URL resolves. If adding an asset format or path, check `vite.config.ts` so it is included or precached where required for offline use.
5. Review the visual in the deck gallery and in a reading card when rendering behavior changes. Check upright and reversed presentation if relevant, plus the card back if it changed. Preserve legibility and the existing card frame/aspect ratio unless the user requested a new treatment.
6. Run the relevant build and deck checks available in the repository. Report the exact checks performed and any visual/offline behavior that could not be verified.
