# apps/parts

The parts every 4x4 app is built from: one stylesheet and one small module, shared by all our apps, so an app is its own content and nothing else. Change a part here and every app has it.

See them all: open [`index.html`](index.html) (`http://localhost:8000/apps/parts/` with the server in the [main README](../../README.md#try-it)). It is also the check page: light and dark, every part, every press answered.

## Start a new app

1. Copy [`starter/`](starter/) to `apps/<your-app>/` and rename it in `manifest.json` and `index.html`.
2. Build the page from the parts below. Write CSS of your own only for what's truly the app's (a calculator's keys).
3. Keep what the app stores on the person's computer (`localStorage`, IndexedDB).
4. Open it at `http://localhost:8000/apps/<your-app>/`.

Every app links the two files, and that is all the wiring there is:

```html
<link rel="stylesheet" href="../parts/parts.css">
<script type="module" src="../parts/parts.js"></script>
```

## The parts

| Part | Markup | For |
|---|---|---|
| Page | `<app-page>` with an optional `<app-bar>` then `<app-body>` | The app's frame: a title bar and what scrolls |
| Bar | `<app-bar><h1>…</h1><bar-end>…</bar-end></app-bar>` | The app's name and its main actions |
| Button | `<button>`; `primary`, `danger`, `bare`, `big`, `icon`, `chip` | Quiet by default; one `primary` a screen; a `chip` is a small choice in a row |
| Field | `<app-field><span>Name</span><input></app-field>`; `inline` | A label over `input`, `select` or `textarea`, or beside it |
| Switch | `<button role="switch" aria-checked="false">…</button>` | On or off; says `change` |
| Tabs | `<app-tabs><button tab="a" current>` + `<app-pane name="a" current>` | Views of one thing; arrow keys move |
| Panel | `<app-panel>` | A lifted surface for one subject |
| Cards | `<app-cards>` of `<button card>` with `<card-picture>` | Big pictured choices; `current` marks the one |
| List | `<app-list>` of `<app-row>` with `<row-text>` and `<row-end>` | Things and what to do with them; `press`, `current` |
| Split | `<app-split id="…"><aside>…</aside><split-bar></split-bar><main>…</main></app-split>` | Two parts and a line the person drags; its place is kept |
| Empty | `<app-empty>` with an `h2`, a `p`, one button | Nothing here yet, and the one thing to do |
| Tag | `<app-tag>` with `ok`, `warn`, `bad` or `info` | A state, in a word |
| Busy | `<app-busy>` | Work under way, so nothing looks stalled |
| Said | `say('Saved')`, `say("That didn't work", 'bad')` | Every press answered on screen |

From `parts.js`: `say(text, kind)`, `el(tag, attrs, ...kids)`, `dress(scope)` for parts added after load. The document hears `look` when the host's colours arrive.

## How it's made

- **The look** is [`look.css`](look.css), generated from 4x4's design tokens: change the tokens, not this file. In a zone the host sends its own values (`{ x4: 'look', vars }`), so the app follows the person's theme and sizes.
- **Sizes** are `calc(N * var(--u))` and text `calc(N * var(--t))`. No text is under 16px.
- **Native controls stay native.** Parts style `button`, `input`, `select`; they don't replace them. Layout parts are plain elements named for what they are, with attributes for states. No framework, no build step.
- **A zone's colour** reaches the app as `--hue`; parts use it for what's lit.
- **The parts are one cascade layer** (`@layer parts`): an app's own CSS, and a widget's it brings (a map library), always wins over a part. `hidden` always hides.

## Worth knowing

- `parts.js` is a module and says `ready` to the host as soon as it runs. An app that listens for its own messages from the host must be listening by then: load its script as a plain one at the end of `<body>` (see [`../calculator/index.html`](../calculator/index.html)).
- In the desk an app runs in a sandboxed frame with no origin of its own, and a module there only loads from a server that sends CORS headers. Opened on its own from `python3 -m http.server`, it needs none.
- Opened on its own, an app's background is `--bg`; there's no setting for another yet.

## Not yet

- Asked for by apps built on the parts, and not made yet: a list that drops down under a field; a busy state on a field; a steady status line; tabs that wrap when narrow; a pressed-toggle group over a picture; a setting for the background when opened on its own.
- An app that is someone else's site with our changes laid over it can't load these files into the site's page.
- Seen in a browser on their own, light and dark: this page and the calculator.
