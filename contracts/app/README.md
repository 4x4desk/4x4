# contracts/app: what an app is, on the person's computer

Version 1. In use in 4x4 AWD Desk. People see these called essence apps: an app cut down to what a person needs.

## The promise

**An app is one folder.** Everything that makes it what it is sits there, in plain files the person and their agent can read and change. Nothing about an app lives anywhere else.

```
<data>/4x4/tpa/<id>/
  tpa.json        what it is (below)
  icon.png|svg    its tile
  recipe.json     our changes to its source, all optional: allow, deny, capture, patch, style, script, drm
  style/*.css     laid over its pages before they draw
  script/*.js     run in its pages, in a sandbox that sees the page
  AGENTS.md       why it is this way, for the agent changing it (optional)
```

`<data>` is the desk's data folder on the person's computer.

`tpa.json`:

| Field | Meaning |
|---|---|
| `id` | The folder's name. One app, one id |
| `name` | What the person reads |
| `url` | Its source: a site's address, or our own page |
| `ctx` | Its sign-in's container. Apps on one account share one |
| `from` | Where its changes came from: `{ recipe, files: { path: sha-256 as shipped } }`. Absent for a plain site |
| `yours` | The files the person changed since: an update leaves these alone |

The folder is named `tpa` and the file `tpa.json` after an earlier word for an app. They may be renamed in a later version of this contract.

## Who does what

- **The site core** (part of the desk's glue layer) reads every folder and runs the app: it refuses what the app's recipe refuses, and lays on its style and scripts. It never writes a folder.
- **The installer** (the desk's own, and the only one) writes a folder: from the desk's catalogue of apps, from a site's address, or for a workspace being made. It records `from`.
- **Updates:** the changes 4x4 ships for each app arrive with the desk's UI update, with no recompile. At each start the installer compares each file with `from`: a file still as shipped takes the newer one; a file the person changed stays, and is listed in `yours`.
- **The person and their agent** may change any file. Their change is the app from then on.
- **Data** (sign-ins, what the app stores) is not in the folder. It stays in the app's container on that computer, so a folder can be shared without it.

The site core and the installer are not in this repository yet.

## What an app may ask of its host

Each is its own small promise. An app that uses none of them still works.

- **The look:** colours and sizes as CSS variables, generated from the design tokens. This repository carries a copy in [`apps/parts/look.css`](../../apps/parts/look.css).
- **Its workspace:** `x4.workspace`, an id, so two apps in one workspace can find each other (a video player and the panel beside it).
- **The agents' door:** `call` and `page`, for the person's own agent. Not in this repository yet.
- **Our own pages:** a folder with a web app manifest ([`apps/calculator/README.md`](../../apps/calculator/README.md) › The folder format).
- **The parts:** one shared stylesheet and module every app of ours is built from ([`apps/parts/README.md`](../../apps/parts/README.md)): buttons, fields, tabs, cards, lists, a splitter, and a line that answers every press. A new app starts from [`apps/parts/starter/`](../../apps/parts/starter/).

## Not yet

- Showing the person what an update would change in a file of theirs, and merging it.
- The desk's catalogue entry for an app and this folder as one file. Today the catalogue says where an app works and names its recipe.
