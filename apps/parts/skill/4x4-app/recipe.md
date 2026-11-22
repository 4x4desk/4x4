# A site made into an app: writing a recipe

A recipe is our changes to a website so it can be an app in a zone: what it may reach, what it may not, and how it looks. The shape is one for everyone: `recipe.schema.json` beside this file, and `node check-recipe.mjs <the recipe's folder>` (beside it too) says whether a recipe fits.

## Where
A site the person added is a folder in their desk's TPA folder: `<data>/4x4/tpa/<id>/`, beside the apps folder (`<apps>/../tpa/<id>/`). It holds `tpa.json` (written by the desk: don't change `id`, `url`, `ctx`) and, once you write it, `recipe.json` with `style/` and `script/`. The person adds the site first (Apps › type its address, or Make it an app from a link).

## recipe.json
```json
{
  "id": "kijiji", "name": "Kijiji", "home": "https://www.kijiji.ca/",
  "about": "Kijiji, its ads and trackers gone, dark when the desk is dark.",
  "allow": ["kijiji.ca", "*.kijiji.ca", "fonts.gstatic.com"],
  "deny": ["*://www.google.com/pagead/*"],
  "style": ["style/dark.css"]
}
```
| Key | What it does |
|---|---|
| `id`, `name`, `home` | the folder's name, what the person reads, where it opens (required) |
| `about` | one or two sentences on what you changed |
| `allow` | host globs its pages may reach, beside `home`'s own host. Absent: the site's own domain, and for a big maker's site the hosts that maker's own products need (YouTube's video from googlevideo.com) |
| `deny` | URL globs refused even on an allowed host (beacons, ads) |
| `style` | CSS under `style/`, laid before the page draws; dark inside `@media (prefers-color-scheme: dark)` |
| `script` | JavaScript under `script/`, run at each page's start, seeing the page's DOM |
| `capture` | URL globs whose replies a page of ours may read |
| `patch` | `[{ match, theme, find, replace }]`: replies rewritten before the page sees them |
| `links` | `[{ match, do }]`: `"beside"`, another app's id, or `"drop"` |
| `drm` | `true` for protected video (a streaming site) |
No other key: one shape. In a glob `*` matches anything, dots and slashes too; `*.wikipedia.org` does not cover `wikipedia.org`, so list both.

The desk passes its light or dark on to the site: `@media (prefers-color-scheme: dark)` in a style follows it. Prefer that to a script.

## Steps
1. Ask the person to open the site as it is (fenced, no recipe) and say what breaks: sign-in, pictures, video, maps. The dot in the app's corner lists, by company, what the desk stopped; each thing that is needed is a host to `allow`. Without the person, start from the site's own domains.
2. `deny` what the site sends about the person.
3. `style`: hide what the person said they don't want. Prefer hiding to rewriting; a script only for what CSS can't do. Never touch a sign-in form.
4. Write `AGENTS.md` beside it: why each change is there, for the next agent.
5. `node check-recipe.mjs <folder>`. The desk reads recipes when it starts: ask the person to quit 4x4 and open it again, then to look at the app, and fix what they say. The folder's name is the site's id as the desk made it (`en-wikipedia-org`), and the recipe's `id` is that name.
