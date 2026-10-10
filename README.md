# Arcana

A self-hosted, offline-capable tarot table with three illustrated decks. Arcana is private and client-side: no accounts, analytics, reading history, generated interpretations, or server-side reading data. Cards include short upright and reversed meaning guides for your own interpretation.

## Run it

With Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). Stop the server with **Ctrl+C**.

## Use the table

1. Choose a deck and paste a numbered Markdown spread, or leave the spread empty and choose a draw count. **Spread preview** lets you check the parsed positions before drawing.
2. Select **Shuffle the deck** to randomize the remaining cards and their upright or reversed orientations.
3. Press and hold **Hold to shuffle**, then release to set the deck. With the button focused, you can also hold and release **Space** or **Enter**. Select **Shuffle again** if you want to continue before drawing.
4. Select **Draw cards** to reveal one card per position, with its question, orientation, and meaning guide. **Copy reading** copies the questions and card names as Markdown, including reversed labels and spread titles. If clipboard access is unavailable, select and copy the reading text instead.
5. Choose **Prepare another reading** to continue with the remaining cards. Drawn cards stay out of the deck across reloads; **Reset the Deck** restores all 78 cards and clears the current reading and spread. Switching decks changes the artwork while preserving the remaining cards.

The table adapts to mobile screens, with the shuffle action below the spread and draw settings. Controls include accessible labels and status announcements, and animations respect your device's reduced-motion preference.

### Spread format

Paste one spread or several titled spreads together. Use Markdown headings to separate spreads; numbering can restart in each section. Arcana draws across all positions in order and retains the section titles in the copied reading.

```md
## Tarot Spread — “Current Direction”

1. **Current Energy**
   What is the dominant energy surrounding this situation?
2. **What should I focus on next?**

## Tarot Spread — “Next Steps”

1\. What can I put into practice today?
2\. **Support** — What support is available to me?
```

Plain numbered questions, bold position labels with questions on the same or following lines, fully bold questions, and escaped numbering such as `1\.` or `1\)` are supported. If a pasted spread cannot be read, check that each numbered position has a question, or clear it for an open draw. The total draw must fit the cards remaining in the deck.

## Decks and galleries

All three decks contain the same 78 tarot cards, with distinct artwork and matching card backs:

| Deck | Artwork |
| --- | --- |
| Crystal Geometry (Cathedral) | Crystalline geometry and animated symbolic scenes. |
| Nocturne | Silver and shadow, with nocturnal imagery. |
| The Veil | Threshold imagery exploring the seen and unseen. |

Choose a deck, then select **Explore Deck** to browse its full gallery by Major Arcana or suit. Toggle motion, upright/reversed orientation, and front/back views; select a card to enlarge it. Close the enlarged view with its close button or **Escape**, then use **Return to the table** to resume.

## Privacy and offline use

The selected deck, remaining cards, spread, and current reading are stored in this browser's IndexedDB. There is no reading history, server persistence, or cross-device sync. Clearing the site's browser data removes this saved state.

Load the app online first so the browser can cache its assets; install the PWA where supported for standalone use. Once cached, the table can work offline while its host is unavailable. When an update is ready, Arcana offers an **Update** button.

## Checks

```sh
npm test
npm run build
```

The Vite dev server serves the PWA directly. IndexedDB belongs to the browser installation, so restarting the dev server does not reset the deck.

## GitHub Pages deployment

The production site is served at [mikenightengale.github.io/arcana](https://mikenightengale.github.io/arcana/). Pushes to `main` run the GitHub Actions Pages deployment workflow, which tests and builds the app before deploying; set the repository's Pages publishing source to **GitHub Actions**. The production build uses the `/arcana/` base path and includes a fallback for direct gallery links. Readings and deck state remain local in browser IndexedDB. For local development, run `npm run dev`. GitHub Pages allows one site per repository, so a separate live preview requires a separate Pages site.
