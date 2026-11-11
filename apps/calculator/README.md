# apps/calculator

A calculator: the first of our own apps, built from the [shared parts](../parts/). The same folder opens on its own in any browser and runs in a zone of 4x4 AWD Desk. It is also the example of the folder format a person, or their agent, builds an app in.

## What's here

- [`manifest.json`](manifest.json): what the app is (below).
- [`index.html`](index.html), [`calculator.js`](calculator.js), [`calculator.css`](calculator.css): the app. It takes its look, base text, buttons and the host's look message from [`../parts`](../parts/); its own CSS is only the answer, the keys, the tape and its three layouts.
- [`icon.svg`](icon.svg): its tile in the desk's dock.
- [`check/shared.html`](check/shared.html): two calculators in shared mode, with the page standing in for the host (below).

## How it works

- **Order:** sums are worked the way a person reads them, × and ÷ before + and −.
- **Percent:** 200 + 5% is 210. After + or −, % is that share of what came before; anywhere else it divides by 100.
- **Rounding:** answers are rounded to twelve significant digits, so 0.1 + 0.2 is 0.3.
- **Keys:** C clears the number and AC clears everything. The keyboard works too: digits, `. + - * / x`, Enter or =, Backspace, Escape, %.
- **The tape:** each finished sum lands on it, and pressing one brings its answer back.
- **Layout:** it fits its zone. Narrow, the keys sit under the answer. Wide, the tape is beside them. Short and wide, the keys are on the right.

## The folder format: what an app is

An app is a folder with a `manifest.json` and the page it names:

```json
{
  "name": "Calculator",
  "icons": [{ "src": "icon.svg", "type": "image/svg+xml", "sizes": "any" }],
  "start_url": "index.html"
}
```

The folder's name is the app's id. The desk reads the manifest to make the app's tile in a dock.

**Why these three fields, in this shape:**

- **They are three fields of the W3C web app manifest, unchanged.** Every browser already reads this file. Agents have seen thousands of them, and the same folder can be installed as a web app on a phone. So there is nothing new to learn, and nothing of ours to keep compatible.
- **They are the least a dock needs:** a name to show, a tile, and a page to open.
- **What it costs:** `icons` is a list of objects where one string would do. That's the price of the standard.
- **Other options we weighed:**
  - **A richer contract:** `manifest.json` plus an `app.js` with a `start(ctx)` function, and a `ctx` for records, people and sites. More capable, but every app then depends on our core.
  - **A three-key `app.json` of our own** (`name`, `icon`, `entry`). Simpler to read, but no browser or agent knows it.
- **What would change this:** an app that needs to ask the host for something: a permission, data, another zone. Then a field or a message would join, and the three fields stay.

**The rules an app keeps,** so it runs on its own and in the desk alike:

- **It runs in a sandboxed frame:** scripts and forms only. It has no origin of its own: no reach into the page, its storage or its cookies.
- **Scripts:** `calculator.js` is classic; `../parts/parts.js` is a module, so in the strict sandbox (no origin) whatever serves it must send CORS headers.
- **Nothing is fetched from anywhere else.**
- **Its look comes from the host,** through `parts.js`: it says `{ x4: 'ready' }` to its parent. The host answers with `{ x4: 'look', vars }`: the look file's values, the person's two sizes (`--size`, `--text`, `--u`, `--t`) and its zone's colour (`--hue`). The host answers again whenever those change. `parts.js` sets them on `:root`, and the calculator refits its answer on the `look` event.
- **Its light is the host's** (`--scheme` in the look; until then, the computer's), and in a zone it draws on the zone's own surface.
- **Until the look comes,** it shows nothing, so it never flashes its own colours. Opened on its own, it uses the look file's values ([`../parts/look.css`](../parts/look.css)), in the computer's light.

## Shared with someone

Two people in a call in the desk can see the same calculator. The call itself is part of the desk, not this repository; [`check/shared.html`](check/shared.html) plays its part so the shared mode can be tried here. Its calculators run in sandboxed frames, as in the desk, so it needs a server that sends CORS headers (`Access-Control-Allow-Origin: *`); plain `python3 -m http.server` doesn't, and the frames stay empty.

- The host says `{ x4: 'share' }`. From then on a press (a key, the keyboard, or the tape) isn't worked: it goes to the host as `{ x4: 'press', key }`. A tape answer goes as `recall:<answer>`.
- The host sends every press, from either person, back to everyone as `{ x4: 'press', key }`, in one order of its own, and only those are worked. So both calculators work the same presses in the same order and show the same sum.
- A page that joins partway through is sent the presses so far.
- Alone, or until the host says `share`, nothing changes.

## Not yet

- Keyboard focus: a press in its zone, outside the frame, could hand it the keys.
