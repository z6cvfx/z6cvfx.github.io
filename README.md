[README.md](https://github.com/user-attachments/files/28853968/README.md)
# Helium — Homepage for the Helium Browser

A clean, fast, fully offline new tab page built for the [Helium browser](https://heliumhq.com), which ships with a blank homepage by default. Helium is a single `index.html` file with zero external dependencies — no npm, no frameworks, no build step.

---

## Features

- **Live clock & greeting** — 12hr/24hr toggle, personalised greeting with your name, updates every second with tab-throttle catch-up
- **Weather widget** — powered by [Open-Meteo](https://open-meteo.com/) (no API key required), supports geolocation or manual lat/lon, auto-refreshes every 15 minutes, Celsius or Fahrenheit
- **Quick links grid** — icon tiles with favicons (Google or DuckDuckGo source, switchable), right-click context menu to edit or remove, drag-to-reorder
- **Search bar** — supports DuckDuckGo, Google, Bing, Brave, Startpage, Kagi, or a fully custom URL; smart direct-URL detection so typing a URL navigates instead of searching
- **Notes pad** — floating scratch pad persisted to `localStorage`, toggleable from the toolbar
- **Themeable backgrounds** — solid colour, gradient (with 8 presets: Sunset, Ocean, Grape, Forest, Night, Candy, Mint, Dusk), animated aurora (floating glow blobs), or a custom image upload
- **Auto dark/light mode** — follows `prefers-color-scheme`, overridable to force light or dark
- **Settings panel** — full UI for every option; live background preview before saving; export/import config as JSON for backup or sharing across devices

---

## How it's built

### Single-file, zero dependencies

Everything — fonts, favicon, styles, and logic — lives in one `index.html`. There is no npm, no bundler, no CDN calls at runtime. The page works completely offline from the moment it loads.

- **Fonts** — Inter (UI) and Space Grotesk (clock numerals) are embedded as base64-encoded variable font data URIs inside `@font-face` blocks. Non-latin text falls back to the system font stack automatically.
- **Favicon** — a "He" monogram tile embedded as a base64 PNG data URI, styled to match the quick-link tiles.

### Config & persistence

All user settings are serialised to a single JSON object and stored under the key `helium-homepage-config` in `localStorage`. A `mergeConfig()` function deep-merges saved settings with the built-in defaults so new config keys added in future versions never break existing saves.

Background images uploaded from disk are too large for `localStorage`'s ~5 MB string quota, so they are stored separately in **IndexedDB**, keeping the main config lean.

Notes text is stored under its own key (`helium-homepage-notes`) so it can be updated on every keystroke without touching the heavier settings object.

### Background engine

Four background modes are supported, all driven by the same `applyBackground()` function:

| Mode | Implementation |
|------|---------------|
| `theme` | Uses CSS custom properties from the active light/dark theme |
| `solid` | Sets a CSS hex colour directly on `<body>` |
| `gradient` | Animating CSS gradient with two colour stops and 8 named presets |
| `aurora` | Three absolutely-positioned radial-gradient blobs animated with `float` keyframes |
| `image` | Uploaded image written to IndexedDB, rendered as a `<div>` layer with optional dim and blur sliders; a SVG film-grain + vignette overlay is added for depth |

When a custom background is active, the page auto-detects its brightness using canvas pixel sampling and switches UI elements to a frosted-glass treatment accordingly.

### Weather

Weather data comes from the Open-Meteo free API — no API key needed. WMO weather interpretation codes are mapped to emoji + description strings locally. Responses are cached in `localStorage` and only re-fetched after 15 minutes (or when settings change), so the widget works on slow connections without hammering the API.

### Clock

The clock schedules itself to fire on exact second boundaries (not every 1000 ms from an arbitrary start), and listens to the `visibilitychange` event to catch up after a tab has been throttled by the browser.

### Settings panel

The settings panel is built entirely with native HTML form elements — no UI library. It supports live preview of background changes before committing, and a Cancel/Escape path that reverts any unsaved state (including background image picks) back to the last saved config via a `panelSnapshot` string diff.

---

## Installation

1. Download `index.html`
2. In Helium, set your homepage to the local file path or host it at a URL (e.g. GitHub Pages)
3. That's it — no install, no build

### Hosting on GitHub Pages

```
https://yourusername.github.io
```

Push `index.html` (lowercase) to the root of a repo named `yourusername.github.io`, enable GitHub Pages from `main` branch in Settings → Pages, and your homepage will be live within a minute.

---

## Configuration

Open the settings panel (⚙ button, top right) to configure:

- Clock format (12hr / 24hr) and greeting name
- Search engine (DuckDuckGo, Google, Bing, Brave, Startpage, Kagi, or custom URL)
- Quick links — add, edit, reorder, remove
- Weather — enable/disable, unit, geolocation or manual coordinates
- Background — theme / solid / gradient / aurora / image
- Theme override — auto / light / dark
- Notes pad — enable/disable
- Open links in new tab
- Favicon source

**Export / Import** — use the export button to save your config as a `.json` file and import it on another device to restore your setup exactly.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Markup | Semantic HTML5 |
| Styles | Vanilla CSS with custom properties (design tokens) |
| Logic | Vanilla JS (ES2020+), no frameworks |
| Persistence | `localStorage` + IndexedDB |
| Weather API | [Open-Meteo](https://open-meteo.com/) (free, no key) |
| Fonts | Inter + Space Grotesk (self-hosted, base64 embedded) |

---

## License

MIT
