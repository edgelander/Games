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

## Roadmap

- **Phase 0 (done):** Ported the prototype into this buildable project.
- **Phase 1:** Make it installable on iPhone (PWA / Add to Home Screen).
- **Phase 2:** Shared multiplayer canvas (Supabase: database + storage + realtime).
- **Phase 3:** Native iOS app via Capacitor → App Store.
