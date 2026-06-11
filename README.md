# Element2

A fast, private, single-file new-tab homepage, built for the [Helium browser](https://helium.computer/) — and any other Chromium-based browser.

Everything lives in one `index.html`: no build step, no frameworks, no trackers, no external fonts. Your settings never leave your browser.

## Features

- **Clock, date & greeting** — 12/24-hour, optional name, minute-precise without burning CPU in background tabs
- **Weather chip** — powered by the free, keyless [Open-Meteo](https://open-meteo.com/) API; uses your location (with permission) or manual coordinates, °C/°F, cached for 10 minutes
- **Search** — DuckDuckGo, Google, Bing, Brave, Startpage, Kagi, or any custom engine (`%s` = query); pastes that look like URLs navigate directly
- **Search suggestions** — DuckDuckGo autocomplete with full keyboard navigation ([setup below](#search-suggestions))
- **Quick links** — editable tiles with monogram or real favicons, drag-to-reorder, and a right-click menu (open in new tab, copy address, edit, remove)
- **Backgrounds** — solid, gradient, animated gradient, floating aurora, or an image (URL or a local file stored in your browser) with darken/blur sliders; text contrast adapts to the background's brightness automatically
- **Notes pad** — an optional scratchpad in the corner that autosaves as you type
- **Themes** — auto (follows the system), light, or dark
- **Settings panel** — live preview, discard protection, JSON export/import for backups and syncing between machines

## Getting started

### Host it on GitHub Pages

1. Fork (or clone) this repository.
2. In the repo: **Settings → Pages → Deploy from a branch**, pick your default branch, save.
3. Your homepage is live at `https://<username>.github.io/<repo>/` (or `https://<username>.github.io/` if the repo is named `<username>.github.io`).

### Set it as your new tab in Helium

Open Helium's settings and set the URL above as your new-tab page / homepage. In other Chromium browsers, use any "custom new tab" extension, or set it as the startup/home page.

### Or run it locally

Download `index.html` and open it — that's it. Everything (settings, background image, notes) is stored inside the browser, and the page works offline except for the optional network features listed under [Privacy](#privacy--data).

## Search suggestions

Out of the box the page queries DuckDuckGo's official autocomplete API directly. **DuckDuckGo doesn't allow cross-origin reads** (no CORS headers), so on a hosted copy (GitHub Pages included) the browser blocks the response and the dropdown silently stays closed — the page stops retrying after a few failures.

To make suggestions work on a hosted copy, deploy the included relay:

1. Create a free worker at [Cloudflare Workers](https://workers.cloudflare.com/) and paste in [`suggestions-worker.js`](suggestions-worker.js).
2. In the page: **⚙ Settings → Search suggestions → relay URL** → `https://<your-worker>.workers.dev/?q=%s`
3. Save. Done.

The worker asks DuckDuckGo first and transparently falls back to Brave, then Bing, if DDG refuses or rate-limits its datacenter IP (a 200-with-empty-`[]` soft block you may encounter). Results are cached at the edge for 5 minutes. Open `https://<your-worker>.workers.dev/?q=helium&debug` to see what every provider returns from the worker's own IP. Remove entries from the `PROVIDERS` array in the worker if you'd rather not fall back.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| any letter, or `/` | focus the search box from anywhere |
| `Enter` | search (or navigate, if you typed a URL) |
| `Alt+Enter` | search in a new tab |
| `↓` / `↑` | move through suggestions |
| `Esc` | close suggestions → clear focus; also closes menus and settings |
| `↑` / `↓` on a link row's ⠿ handle | reorder quick links in settings |

## Privacy & data

Everything is stored locally: settings in `localStorage`, a chosen background image in IndexedDB, notes under their own key (so they survive a settings reset). Export/import moves settings between browsers as a JSON file.

The page makes **no network requests at all**, except the features below — each with its own off-switch in ⚙ Settings:

| Feature | Talks to | When | Default |
| --- | --- | --- | --- |
| Weather | `api.open-meteo.com` | on load, cached 10 min | on |
| Search suggestions | `duckduckgo.com` or your relay | while typing in the search box | on |
| Site icons | DuckDuckGo or Google favicon API | when rendering quick links | off |
| Geolocation | browser permission prompt | only if "Use my location" is on | on, falls back to manual coordinates |

Fonts (Inter, Space Grotesk) and the favicon are embedded in the file — nothing is fetched from Google Fonts or any CDN.

## Customizing the defaults

All defaults live in the `DEFAULT_CONFIG` object near the top of the `<script>` in `index.html` — quick links, search engine, theme, weather coordinates, and so on. The **Reset** button restores whatever is defined there, so edits to it become your personal factory settings.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | the entire homepage — self-contained |
| `suggestions-worker.js` | optional Cloudflare Worker relay for search suggestions |
| `screenshot.png` | the image above |
