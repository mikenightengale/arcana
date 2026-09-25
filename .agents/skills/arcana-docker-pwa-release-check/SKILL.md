---
name: arcana-docker-pwa-release-check
description: Use only in the Cathedral Arcana project to review or verify Docker production builds, nginx serving, or PWA/offline behavior.
---

# Arcana Docker/PWA release check

Use this skill only for Cathedral Arcana repository work involving its production build, Docker packaging, static serving, or PWA behavior. Help the user reach a clear, evidence-based assessment of whether the affected path still works.

## Project-specific invariants

- Production is a static frontend served from nginx in Docker. The Dockerfile uses Node.js 22 to build `dist/`, then copies it into nginx. Compose maps host port 8080 to container port 80; nginx has a health check and SPA fallback to `index.html`.
- There is no app server in the container. The current deck, spread, and reading are kept in browser IndexedDB. The service worker caches the PWA for offline use; neither browser state nor offline availability is stored in the container.
- Keep the existing prompted service-worker update flow and cache behavior intentional. Check that changed assets and routes remain reachable through nginx and that the service worker's precache/navigation fallback still matches the built output.
- Do not deploy, publish, or change a live host as part of a check unless the user directly requests that action.

## Workflow

1. Inspect the relevant changes and the current `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `vite.config.ts`, and package scripts. Confirm assumptions from the repository instead of relying on this skill if configuration has changed.
2. Trace the affected path from Vite build output through the nginx image and Compose mapping. Check build stage/runtime stage, static asset paths, SPA route fallback, cache headers, and health-check target as relevant to the change.
3. For PWA changes, inspect service-worker registration/update behavior, manifest, precache patterns and size limit, and navigation fallback. Distinguish browser-held IndexedDB data from container files and service-worker caches. Avoid clearing a user's browser storage or service-worker data during verification.
4. Run focused checks appropriate to the change and available environment. Typical checks include `npm run build`, `docker compose config`, and `docker build -t cathedral-arcana-check .`. Use a disposable local browser profile or isolated environment for an end-to-end offline check when needed; do not start or replace a running service if it could disrupt the user's environment.
5. Report what was checked, the result, and any limitation such as an unavailable Docker daemon or inability to verify offline behavior. Do not claim an end-to-end container/PWA check based only on a successful frontend build.

## Release-specific checks

- Confirm Compose exposes host port 8080 to nginx port 80 and the health check targets nginx inside the container.
- Confirm direct navigation to app routes falls back to `index.html`, while real static assets resolve to their built files.
- Confirm cache rules allow HTML and service-worker updates to be discovered while fingerprinted static assets can remain cached as configured.
- Confirm the PWA can load its required manifest and cached resources offline after a successful online visit. Readings remaining after container replacement comes from browser IndexedDB; container restart is not a persistence test for browser data.
