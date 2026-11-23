# contracts/recipe: our changes to a site, so it can be an app

Version 1. One shape for every recipe, ours and the person's. The shape is [`recipe.schema.json`](../../apps/parts/skill/4x4-app/recipe.schema.json) and its check [`check-recipe.mjs`](../../apps/parts/skill/4x4-app/check-recipe.mjs) beside it: `node apps/parts/skill/4x4-app/check-recipe.mjs recipes/kijiji`. The page an agent reads is [`recipe.md`](../../apps/parts/skill/4x4-app/recipe.md). The recipes themselves are in [`recipes/`](../../recipes/README.md); [`kijiji/`](../../recipes/kijiji/) is a whole one.

## What a recipe is
A recipe is our changes to someone else's site: data the desk runs. A [blueprint](../../blueprints/README.md) is how to build something of our own: a page an agent reads before it builds. The test: does the desk run it, or does an agent read it?

A site made into an app is one folder (`contracts/app`): its `tpa.json` says which site, and its **recipe** says what we change. With no recipe the site is still fenced: it reaches only its own domain and its maker's, and nothing else of the internet. A recipe adds, in order of how far it goes:

| Step | What the person gets | Keys |
|---|---|---|
| Fenced | the site in its own container, reaching only itself | none (`home` names the site) |
| Slimmed | ads, trackers and extras gone | `allow`, `deny`, `style` |
| Reshaped | our own controls inside the site's pages | `script`, `patch` |
| Our page beside it | a page of ours reading what the site sends | `capture`, `links` |

## The folder
```
<id>/
  recipe.json     the recipe (below); the only file required
  style/*.css     laid over the site's pages before they draw
  script/*.js     run in its pages at their start, in a sandbox that sees the page's DOM (not its scripts)
  AGENTS.md       why it is this way, for the agent changing it (optional; laid with the recipe)
  README.md       notes for us (optional; not laid)
```
Nothing else is part of the recipe. Our own tools that read a site for us (Kijiji's saved search call, YouTube's Ask) sit in a `tools/` folder beside it and are never laid into a person's folder. Our own driving of a site's controls (AI Studio for Voices) is `drive.json`, also not laid.

## recipe.json
| Key | Type | What it does |
|---|---|---|
| `id` | name: letters, digits, `.` `_` `-` | the folder's name, and the app's id |
| `name` | text | what the person reads |
| `home` | address, `https://…` | where the app opens |
| `about` | text | one or two sentences on what we changed and why |
| `allow` | host globs (`"*.kijiji.ca"`) | the hosts its pages may reach. Absent: its own registrable domain, and for a big maker's site the hosts that maker's own products need (YouTube's video from googlevideo.com; the list is the desk's). Present: exactly these and `home`'s host, plus what the person allows later |
| `deny` | URL globs (`"*://www.google.com/pagead/*"`) | refused even on an allowed host: the site's own beacons and ads |
| `style` | paths under `style/` | CSS laid over its pages. A dark look goes inside `@media (prefers-color-scheme: dark)` |
| `script` | paths under `script/` | JavaScript run in its pages at their start |
| `capture` | URL globs | replies copied as they arrive, for a page of ours to read |
| `patch` | `[{ match, theme?, find?, replace? }]` | replies rewritten before the page sees them; `theme: true` themes the CSS the site's scripts add later |
| `links` | `[{ match, do }]` | what a click on a link does: `"beside"` (the zone beside, this app's rules), another app's id, or `"drop"`. The first match wins; a link nothing takes asks the person |
| `drm` | `true` | its pages may play protected video (a streaming site) |

A glob's `*` matches any run of characters, dots and slashes too; nothing else is special, and case doesn't count. `*.wikipedia.org` does not cover `wikipedia.org`: list both.

Every key but `id`, `name` and `home` is optional. A key not in this table is refused by the check: one shape, so a reader of any recipe knows every recipe.

## Where a recipe comes from
One folder shape, `<id>/` with its `recipe.json`, at three levels. The person chooses which they take; nothing is pushed on them.
1. **The public repository's `recipes/`**: reviewed in the open, carried by the desk to everyone.
2. **A network's own repository**: the same folders, shared among one group's computers and nobody else's. Not built yet.
3. **The person's folder**: `<data>/4x4/tpa/<id>/`. This is the copy the desk runs. A recipe from the other levels is laid into it; a file the person or their agent changed stays theirs through every update (`contracts/app` › Ours, yours and back to stock).

A recipe is the same shape at every level, so it moves between them by copying the folder.

## Who reads it
- **The desk's site core** runs the app by it: refuses what it refuses, copies what it captures, lays its style and script.
- **The desk's installer** lays `recipe.json`, the files it names and `AGENTS.md` into `<data>/4x4/tpa/<id>/`, and keeps the person's changes on our updates ([`contracts/app`](../app/README.md)).
- **The person's agent** writes and changes recipes in that folder; a recipe it writes is the same shape as ours.

## Writing one
1. `home`: the address the person uses. Open it fenced (no recipe) and note what breaks: a sign-in, pictures, video, maps. Each one is a host to `allow`.
2. `deny` what the site sends about the person (its beacons, its ads), found in the requests the desk refuses or lets through.
3. `style`: hide what the person doesn't want. Prefer hiding to rewriting; a script only for what CSS can't do.
4. Keep `about` true; put the reasons in `AGENTS.md`.
5. `node apps/parts/skill/4x4-app/check-recipe.mjs <folder>`, then quit the desk and open it again: it reads recipes when it starts.

4x4 ships recipes for sites such as Kijiji (fenced, slimmed, dark), YouTube (reshaped, with a page of ours beside it), Netflix (fenced, protected video) and Google AI Studio (slimmed, captured). Sending one: [`CONTRIBUTING.md`](../../CONTRIBUTING.md#the-easiest-way-in-trim-a-site) › Trim a site.
