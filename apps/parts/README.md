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

Standard HTML for what is pressed and for the outline; a named element for each thing, its last word its kind: `recipe-list` is a list, `plant-card` a card. `parts.js` reads the last word and gives every such element its kind's look, role and life, so an app names things for what they are and writes no wiring.

**What a new page writes** (the parts page, [`index.html`](index.html), shows each one working):

| Part | Markup | For |
|---|---|---|
| Page | `<app-page>` with `<header><h1>…</h1> buttons</header>` then `<main>` | The app's frame: a title bar and what scrolls |
| Button | `<button>`; `primary`, `danger`, `bare`, `big`, `icon`; `ok`, `bad` | Quiet by default; one `primary` a screen; `ok` and `bad` are yes and no to something happening now |
| Field | `<label>Name <input name="…"></label>` | A label around its `input`, `select` or `textarea` |
| Switch | `<button role="switch" aria-checked="false">…</button>` | On or off; a press flips it and the button says `change` (it bubbles; `e.detail` is true for on). The app may set `aria-checked` itself to show what is so |
| Field and key | `<form inline><label>… <input></label><button primary>Add</button></form>` | A field with its key on one line; the key goes under when narrow |
| Group | `<…-group>` around buttons | Keys that belong together, in a row that wraps |
| Tabs | `<tab-group><button tab="a" current>` and beside it `<section tab="a" current>` | Views of one thing; arrow keys move; wraps when narrow |
| Card | `<…-card>` | A lifted surface for one subject; `hidden` until wanted |
| Choices | `<…-grid>` of `<button card>` with `<card-picture>` | Big pictured choices; `current` marks the one |
| List | `<…-list>` of `<list-row>` with `<row-title>`, `<row-note>`, a picture before (`<…-portrait>`, `<…-icon>`), buttons after | Things and what to do with them; `press` on a row makes the whole row the key (Enter and Space too, also on a row made with `el()`); `current`; `done` strikes its title. Narrow, a row's two or more buttons go under its words |
| View | `<…-view name="…"><aside>…</aside><view-splitter></view-splitter><main>…</main></…-view>` | Two sides and a line the person drags; `turns`: narrow, the sides take turns (`at="main"`, a `<button turn-back>`) |
| Nothing yet | `<…-notice>` straight after a list, with an `h2`, a `p`, one button; or `empty="…"` on the list | Shown while the list has no rows. A notice anywhere else (trouble, nothing open) is always shown: hide it with `hidden` |
| Tag, badge | `<…-tag ok|warn|bad|info>`, `<…-badge>` | A state in a word; a count |
| Working | `<progress>` | Work under way |
| Must answer | `<dialog>` with a `form method="dialog"` | Something to answer before going on; `showModal()` |
| Changes | `<…-log lines>` of `<log-line added|removed>` | What changed, line by line |
| Thread | `<…-thread>` (`named/thread.js`, `named/thread.css`) | A conversation and the box to write in |
| Said | `say('Saved')`, `say("That didn't work", 'bad')`, `say('Deleted', '', { text: 'Undo', run })` | Every press answered on screen |
| Data | `const box = data()` | What the app keeps (below) |
| Shared | `const s = await shared()` (`shared.js`) | What the app keeps with the person's other computers (below) |
| People | a `<…-list>` filled by `fill(list, devices)` (`named/people.js`) | Who is around, with a dot for whether they can be reached and one key each; says `pick` |

Apps written before these names use `app-bar`, `app-body`, `app-split`, `app-list` and the rest; those still draw, and a page with any of them on it keeps the older behaviour whole.

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

## What an app shares: `shared()`

For an app used on more than one computer at once: a list, a board, a game. `data()` keeps on this computer; `shared()` (`shared.js`) keeps with the person's other computers and with people they let in, through 4x4's peer-to-peer service on the computer. A shared thing is a conversation of its own: every change is one line, kept on every computer in it, and an app draws from the lines. Anyone in it may choose to present (the others watch and can still write) or to work together. The header of `shared.js` has every call.

## For an agent, and the common jobs

An agent making an app, or trimming a site with a recipe, is handed [`skill/4x4-app/SKILL.md`](skill/4x4-app/SKILL.md); the desk lays it, with this folder, on the person's computer. The [`blueprints/`](blueprints/) say the easy way to do a common job, each written from a real app.

## How it's made

- **The look** is [`look.css`](look.css), generated from 4x4's design tokens: change the tokens, not this file. In a zone the host sends its own values (`{ x4: 'look', vars }`), so the app follows the person's theme and sizes.
- **Sizes** are `calc(N * var(--u))` and text `calc(N * var(--t))`. No text is under 16px.
- **Native controls stay native.** Parts style `button`, `input`, `select`; they don't replace them. Layout parts are plain elements named for what they are, with attributes for states. No framework, no build step.
- **A zone's colour** reaches the app as `--hue`; parts use it for what's lit.
- **The parts are one cascade layer** (`@layer parts`): an app's own CSS, and a widget's it brings (a map library), always wins over a part. `hidden` always hides.

## Worth knowing

- `parts.js` is a module and says `ready` to the host as soon as it runs. An app that listens for its own messages from the host must be listening by then: load its script as a plain one at the end of `<body>` (see [`../calculator/index.html`](../calculator/index.html)).
- In the desk an app runs in a sandboxed frame with no origin of its own, and a module there only loads from a server that sends CORS headers. Opened on its own from a plain local server (`helpers/run serve . 8000`), it needs none.
- Opened on its own, an app's background is `--bg`; there's no setting for another yet.

## Not yet

- Asked for by a notes app built on the parts, and made: rows the keys press, a said line with Undo, turns when narrow, and the data part. Still wanted: a menu under a button (for now, Save a copy and Bring a copy in sit at the foot of the notes list).
- Asked for by other apps built on the parts, and not made yet: a list that drops down under a field; a busy state on a field; a steady status line; tabs that wrap when narrow; a pressed-toggle group over a picture; a setting for the background when opened on its own.
- An app that is someone else's site with our changes laid over it can't load these files into the site's page.
- Seen in a browser on their own, light and dark: this page, the calculator, and a notes app built on the parts as the proof of the data part. Not yet seen inside a zone of a desk.
