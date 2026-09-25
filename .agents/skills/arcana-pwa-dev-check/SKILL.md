---
name: arcana-pwa-dev-check
description: Use in the Cathedral Arcana project to review or verify the Vite development server, PWA behavior, or client-side persistence.
---

# Arcana PWA development check

Use this skill for Cathedral Arcana repository work involving the app's local run path, service worker, offline behavior, or browser persistence. The app runs directly through Vite with `npm run dev`; there is no container or application server.

## Project-specific invariants

- The app is a static client-side React and TypeScript frontend served by Vite. Do not add a backend, account system, analytics, or network dependencies without an explicit product request.
- The current deck, spread, and reading stay in the user's browser IndexedDB. Never clear browser storage during verification.
- Vite's PWA plugin has development support enabled. The service worker can cache app files for offline use after a successful online visit and installation/cache setup.
- Keep the prompted service-worker update flow and cache behavior intentional. Confirm changed assets and routes remain reachable through Vite and the configured navigation fallback.

## Workflow

1. Inspect the relevant changes, `package.json`, and `vite.config.ts`. Confirm current scripts and PWA settings instead of relying on assumptions.
2. Run `npm run dev` when checking the app's live local behavior. Use the URL printed by Vite and stop the server with Ctrl+C when finished.
3. For PWA changes, inspect service-worker registration/update behavior, manifest, precache patterns and size limit, and navigation fallback. Distinguish browser-held IndexedDB data from service-worker caches.
4. Run focused checks appropriate to the change and available environment. Typical checks include `npm test` and `npm run build`. Use a disposable local browser profile or isolated environment for an end-to-end offline check when needed; do not clear the user's browser storage.
5. Report what was checked, the result, and any limitation. Do not claim an end-to-end offline check based only on a successful frontend build.

## PWA-specific checks

- Confirm Vite can serve the app routes and static assets used by the change.
- Confirm cache rules allow HTML and service-worker updates to be discovered while fingerprinted static assets can remain cached as configured.
- Confirm the PWA can load its required manifest and cached resources offline after a successful online visit.
- Reading persistence comes from browser IndexedDB; restarting Vite should not erase it. Offline availability comes from the browser's service-worker cache and is distinct from IndexedDB data.
