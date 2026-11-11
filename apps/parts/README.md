# apps/parts

The parts every 4x4 app is built from: one stylesheet and one small module, shared by all our apps, so an app is its own content and nothing else. Change a part here and every app has it.

See them all: open [`index.html`](index.html) (`http://localhost:8000/apps/parts/` with the server in the [main README](../../README.md#try-it)). It is also the check page: light and dark, every part, every press answered.

## Start a new app

1. Copy [`starter/`](starter/) to `apps/<your-app>/` and rename it in `manifest.json` and `index.html`.
2. Build the page from the parts below. Write CSS of your own only for what's truly the app's (a calculator's keys).
3. Keep what the app stores with the data part (`data()`, below): it keeps each app's things apart from every other app's.
4. Open it at `http://localhost:8000/apps/<your-app>/`.

## For an agent making an app for the person at their computer

Write it into the person's own apps folder, not into this repository: `<data>/4x4/apps/<your-app>/` (`<data>` is `$XDG_DATA_HOME`, else `~/.local/share`; `%LOCALAPPDATA%` on Windows), copied from [`starter/`](starter/) with its `manifest.json` named. The desk keeps the parts beside it in `<data>/4x4/apps/parts/`, so the starter's `../parts/` links work unchanged. The person finds it under Yours in Apps or a dock's +, and puts it in a zone. There is no build and no server. The promise is in [`contracts/app/README.md`](../../contracts/app/README.md) › Your own apps.

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
| List | `<app-list>` of `<app-row>` with `<row-text>` and `<row-end>` | Things and what to do with them; `press` (Enter, Space and the arrow keys work too), `current` |
| Split | `<app-split id="…"><aside>…</aside><split-bar></split-bar><main>…</main></app-split>` | Two parts and a line the person drags; its place is kept |
| Turns | `<app-split turns>`, `at="main"`, a `<button turn-back>` | A list and what's opened from it. When narrow (a zone can be 300 pixels wide), they take turns at full height |
| Empty | `<app-empty>` with an `h2`, a `p`, one button | Nothing here yet, and the one thing to do |
| Tag | `<app-tag>` with `ok`, `warn`, `bad` or `info` | A state, in a word |
| Busy | `<app-busy>` | Work under way, so nothing looks stalled |
| Said | `say('Saved')`, `say("That didn't work", 'bad')`, `say('Deleted', '', { text: 'Undo', run })` | Every press answered on screen. With one button, it stays longer, and holds while the pointer is over it |
| Data | `const box = data()` | What the app keeps (below) |

From `parts.js`: `say(text, kind, act)`, `el(tag, attrs, ...kids)`, `data(id)`. Parts added after load are dressed by themselves; `dress(scope)` stays for apps that call it. The document hears `look` when the host's colours arrive.

## What an app keeps: `data()`

```js
import { data } from '../parts/parts.js';
const box = data();                     // this app's box; its id is the app's folder name
box.set('note.1', { text: 'Milk' });    // any value JSON can hold; kept at once
box.get('note.1', fallback);  box.remove('note.1');  box.all();   // all: { key: value } of everything
box.on('change', e => e.detail);        // { key, value, elsewhere }: elsewhere when another open copy changed it;
                                        // key is null when many changed at once (a copy brought in)
box.saveCopy();                         // "Save a copy": downloads one .json file of everything
box.bringCopy({ merge, words });        // "Bring a copy in": asks for that file and takes it in
box.export();  box.import(copy, { merge });   // the same, as a plain object
```

- **Why a box:** in the desk, every app the person makes shares one web origin, so plain `localStorage` keys would collide. A box keeps its keys under `4x4.data.<id>.`.
- **Bringing a copy in** keeps what's here unless the copy has the same key. When both have it, `merge(key, here, there)` decides (a notes app might keep the one edited last). A copy from another app, or a file that isn't a copy, is refused with a plain line.
- **What it isn't:** it is not synced, not shared between computers or between browsers, and not a backup. It lives in the desk's browser storage on this computer, and goes if the person clears this site's data. Save a copy is the way to keep or move it today.
- **When nothing can be kept** (a frame with no storage of its own), `box.kept` is false and the box lasts only this visit; the app should say so. When the computer's space is full, `set` returns false and the person is told once.
- **Size:** browser storage holds a few megabytes per origin, shared by all the person's apps. That is fine for notes and settings; pictures and long recordings want IndexedDB or files, which aren't a part yet.

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

- Asked for by a notes app built on the parts, and made: rows the keys press, a said line with Undo, turns when narrow, and the data part. Still wanted: a menu under a button (for now, Save a copy and Bring a copy in sit at the foot of the notes list).
- Asked for by other apps built on the parts, and not made yet: a list that drops down under a field; a busy state on a field; a steady status line; tabs that wrap when narrow; a pressed-toggle group over a picture; a setting for the background when opened on its own.
- An app that is someone else's site with our changes laid over it can't load these files into the site's page.
- Seen in a browser on their own, light and dark: this page, the calculator, and a notes app built on the parts as the proof of the data part. Not yet seen inside a zone of a desk.
