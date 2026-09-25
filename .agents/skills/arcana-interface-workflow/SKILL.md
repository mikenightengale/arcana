---
name: arcana-interface-workflow
description: Use only in the Cathedral Arcana project for changes to its screens, interactions, responsive layout, or visual styling.
---

# Arcana interface workflow

Use this skill only for UI work in the Cathedral Arcana repository. Preserve the app's quiet, dark, cathedral-inspired visual language and its Prepare → Shuffle → Reading flow while making the requested change work across screen sizes and browsers.

## Project-specific context

- `src/App.tsx` owns the three reading stages and composes setup, shuffle, reading, and update-notice UI. `src/tarot/DeckGallery.tsx` owns the gallery and enlarged-card dialog.
- `src/theme.css` defines the dark plum/navy foundation, gold and ivory accents, typography, and Crystal Geometry palette. `src/styles.css` contains the responsive layouts, focus styling, and reduced-motion CSS rules.
- The app uses React, TypeScript, and Vite. Existing automated tests use Vitest with jsdom; the repository does not currently include a dedicated browser-test framework.

## UI guidance

- Keep edits aligned with the existing CSS variables, typography, borders, and restrained accent colors. Preserve the card's portrait aspect ratio and legibility where card presentation is involved.
- Preserve the user's reading flow and current actions. Make status, validation, loading, and error feedback perceivable without relying on color alone.
- Use semantic controls and labels. Keep all actions keyboard reachable, retain visible focus, and ensure dialogs and toggles expose their state and can be operated and dismissed by keyboard.
- Support narrow layouts without horizontal overflow or clipped controls. Check both the main table and gallery/modal if the change touches shared sizing or styling.
- Respect `prefers-reduced-motion` in both CSS animation and JavaScript-driven effects. Do not make motion the only way to understand a state change.

## Verification

1. Inspect the relevant components and existing styles before changing them. Identify which reading stage, control, or viewport sizes the change affects.
2. Run the project's build and focused UI tests when appropriate. The available package scripts are `npm run build` and `npm test`.
3. Verify the changed UI in both Chrome and Firefox when browser access is available. Check the affected flow at a desktop size and a narrow/mobile size; include keyboard operation and reduced-motion behavior when relevant. Do not infer Firefox compatibility from a Chrome-only check.
4. If either browser or a needed setting cannot be tested, inspect the implementation for browser-specific APIs/CSS and state clearly which browser behavior remains unverified. Do not claim cross-browser verification without actually checking both.
5. Summarize the visible change and the checks performed, including browser names and viewport/interaction coverage when verified.
