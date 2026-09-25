# Arcana

A self-hosted, offline-capable tarot table. The first release is deliberately private and client-side: no account, history, interpretation engine, or server-side reading data.

## Run it

With Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Stop the server with **Ctrl+C**.

## Use the table

Paste a numbered Markdown spread to map one card to each position, or leave the spread empty and choose a draw count. Select **Shuffle the deck**, then **Draw all cards** when ready. Copy the result as Markdown. Cards drawn remain out of the deck across reloads; **Reset the deck** returns all 78 cards after confirmation.

The randomized deck and current reading are stored in this browser's IndexedDB. There is no reading history and no server persistence. Install the PWA after its first network load to keep using the table while its host is unavailable.

## Deck artwork

`public/decks/cathedral/deck.json` defines the standard 78-card structure and references artwork separately from the engine. This bootstrap includes lightweight, replaceable SVG placeholder illustrations and a matching card back because custom WebP artwork was not part of the supplied files. Replace the artwork and manifest paths when the commissioned deck is ready; meanings and interpretations do not belong in the manifest.

## Checks

```sh
npm test
npm run build
```

The Vite dev server serves the PWA directly. IndexedDB belongs to the browser installation, so restarting the dev server does not reset the deck.

## GitHub Pages deployment

The production site is served at `https://mikenightengale.github.io/arcana/`. Pushes to `main` run the GitHub Actions Pages deployment workflow; set the repository's Pages publishing source to **GitHub Actions**. Readings and deck state remain local in browser IndexedDB. For local development, run `npm run dev`. GitHub Pages allows one site per repository, so a separate live preview requires a separate Pages site.
