---
name: 4x4-app
description: Make or change an app for the person's 4x4 desk. Use when the person asks for an app, a tool, a page in a zone, or a change to one of their apps; and when they want a website trimmed (a recipe). Covers where apps live, the starter, the shared parts, keeping and sharing what an app holds, and writing a recipe for a site.
---

# Making an app for the person's 4x4 desk

You are the person's own agent, on their computer, in their apps folder. What you write is theirs: they can open it, change it, give it away. Write for them, in their language, and keep it small.

## Where you are
- The **apps folder** is the folder this skill was laid in, two levels up: `<apps>/parts/skill/4x4-app/` → `<apps>/`. Each app is one folder in it: `<apps>/<id>/`, `<id>` made of letters, digits, `.` `_` `-`.
- `<apps>/parts/` is laid by the desk, fresh at every start: never write in it, and never copy it into an app. Link to it.
- The desk lists every folder with a `manifest.json` that has a `name`, under **Yours** in its app manager, at its next start or the next time Apps opens.
- Can't tell where the apps folder is? Look for `parts/starter` under `~/Library/Application Support/4x4/AWD/*/data/4x4/apps/` (Mac), `%LOCALAPPDATA%\4x4\apps\` (Windows), `~/.local/share/4x4/apps/` (Linux), and ask the person when there are several.

## Two kinds of thing you can make
1. **An app of their own**: a page built from the parts (a list, a planner, a tool, a game). Steps below.
2. **A site made into an app** (a recipe): a website the person uses, fenced and trimmed. See `recipe.md` in this folder.

## An app of their own, step by step
1. Copy `<apps>/parts/starter/` to `<apps>/<id>/`. Put the app's name in `manifest.json` › `name`, in `index.html`'s `<title>` and `<h1>`, and a line on what it is in `description`.
2. Read `<apps>/parts/README.md` › **The parts**: the table of what a page writes. Name each thing for what it is, ending in its kind (`plant-list`, `recipe-card`, `trip-view`; the kinds are listed at the top of The parts, and a name must end in one); write no `class`, `id`, `div` or `style`; standard HTML for what is pressed. The parts page, `<apps>/parts/index.html`, shows every part working.
3. Write `app.js` with `import { el, say, data } from '../parts/parts.js'`. Answer every press with `say()`. Write CSS of your own only for what is truly the app's.
4. **What it keeps:** `const box = data()`: kept on this computer, apart from every other app's. `<apps>/parts/blueprints/data-on-this-computer.md` is the way to do it.
5. **What it reaches:** nothing outside its folder, unless `manifest.json` lists host names: `"reach": ["api.example.org"]`. Ask the person before adding one; the desk shows them the list.
6. **Sharing with their other computers, or with people they let in:** `"reach": ["127.0.0.1"]` and `import { shared } from '../parts/shared.js'` (README › What an app shares). Every change is a line both sides keep; anyone in a shared thing may present or work together.
7. Look at it: the person opens it from Apps › Yours into a zone. A zone can be 300 pixels wide and the desk can be light or dark: the parts handle both if you used them.
8. Tell the person in one or two plain sentences what it does and where it is.

## Rules that keep the person safe
- Only their apps folder. Nothing else on their computer, no installs, no server.
- No address of the internet without asking (`reach`).
- Nothing about the person goes anywhere they didn't ask for.

## Changing an app
- One of their own: change its files. One of 4x4's own apps: in Apps, **Make it mine** first, then change the copy in `<apps>/<id>/`; their changes survive our updates, and **Back to stock** undoes them.
- A part not doing what the app needs: write it in the app; say to the person what was missing, so it can come back to 4x4.
