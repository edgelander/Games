# LandGrab Collaborated

A multiplayer, iOS-bound remake of LandGrab — a retro pixel-art game where you
claim plots of land by uploading images/PDFs onto a shared canvas.

> The original single-file prototype lives at the repo root as `landgrab.html`
> (untouched). This folder is the new, buildable version we collaborate on.

## What you need installed

1. **[Node.js](https://nodejs.org)** (LTS version) — this gives you `node` and `npm`.
2. **[GitHub Desktop](https://desktop.github.com)** — for collaborating without the command line.
   (See [CONTRIBUTING.md](./CONTRIBUTING.md) for the step-by-step workflow.)

## Run it locally

From inside the `landgrab-collaborated/` folder:

```bash
npm install     # first time only — downloads dependencies
npm run dev     # starts the local dev server
```

Then open the printed URL (usually http://localhost:5173) in your browser.
The dev server also prints a **Network** URL — open that on your phone (same Wi-Fi)
to test on a real device.

## Shared canvas setup (Supabase)

The game works locally without any setup, but plots only persist and become
**shared between players** once you connect a free Supabase backend:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard → **SQL Editor**, paste and run the contents of
   [`supabase-setup.sql`](./supabase-setup.sql). This creates the shared `plots`
   table, a public image bucket, and live updates.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
4. Copy `.env.example` to `.env.local` and paste those two values in.
5. Restart `npm run dev`. Uploads now save to the shared board and appear live for
   everyone — refresh on another device to see the same canvas.

> `.env.local` is git-ignored — never commit your keys. The anon key is safe in the
> browser; the `service_role` key must never be used here.

## Other commands

```bash
npm run build     # builds the optimized site into dist/
npm run preview   # serves the built site to double-check it
```

## Project layout

```
landgrab-collaborated/
├─ index.html          # page markup
├─ vite.config.js      # build config
├─ src/
│  ├─ main.js          # entry point — wires everything together
│  ├─ style.css        # all styles
│  ├─ dom.js           # references to page elements
│  ├─ state.js         # game state + saving
│  ├─ pricing.js       # plot pricing math (pure functions)
│  ├─ ui.js            # badge, price display, success overlay
│  ├─ interactions.js  # drag & resize the staging tile
│  ├─ upload.js        # loading an image/PDF
│  └─ purchase.js      # buying/committing a plot
```

## Install on iPhone

The game is a **PWA**, so you can add it to your Home Screen and it runs full-screen
like a real app (and the screen loads even with no signal):

1. Open the deployed site in **Safari** (Add to Home Screen only works in Safari, not Chrome).
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch it from the new "LandGrab" icon — no browser bars, just the game.

## Roadmap

- **Phase 0 (done):** Ported the prototype into this buildable project.
- **Phase 1 (done):** Installable on iPhone (PWA / Add to Home Screen) via `vite-plugin-pwa`.
- **Phase 2 (done):** Shared multiplayer canvas (Supabase: database + storage + realtime).
- **Phase 3:** Native iOS app via Capacitor → App Store.
