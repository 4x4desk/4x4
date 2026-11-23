# Blueprint: what an app keeps, on this computer

Now (2026-11-17, the session "MS - What a 4x4 app is"; written from making Lists, a person's own app, from `apps/parts/starter`): an app keeps its things with the data part, `data()`, one key per thing, and draws its screen from the box.
How we know: *ran* in a browser against the parts as AWD lays them in the person's apps folder (Lists: lists, items, ticks, Undo, wide and narrow). *Seen* in an AWD zone on 2026-11-18: offered, added, drawn in the desk's look, a list made.
What would change this: data too big for the browser's store; two computers needing the same box; AWD holding boxes as files.

## Choose this when
The app is the person's or ours, a page built from `apps/parts`, and what it keeps is small and theirs alone: notes, lists, settings, what was open. A few megabytes in all, shared by every app of the person's.

## The shape
```js
import { el, say, data } from '../parts/parts.js';
const box = data();                                  // this app's box; its id is the app's folder name
box.set(`list.${id}`, { name, items, at: Date.now() });   // one key per thing, any JSON value, kept at once
box.get(`list.${id}`);  box.remove(`list.${id}`);  box.all();
box.on('change', draw);                              // draw the whole screen from the box, here and nowhere else
```
1. **One key per thing** (`list.<id>`), not one key holding everything. Two open copies of the app then change different things without one overwriting the other, and a copy brought in merges thing by thing.
2. **Draw from the box on `change`.** A press changes the box and stops there; `change` redraws. Another open copy of the app is then right at once (`elsewhere` in the event), and so would another computer be, the day boxes cross between them.
3. **A changed thing is a new value:** `structuredClone` what `get` gave, change the copy, `set` it. Give each thing a time (`at`) so "which is newer" has an answer.
4. **Undo is the old value kept in a variable** and set back: `say('Removed', '', { text: 'Undo', run: () => box.set(key, before) })`.
5. **Save a copy and Bring a copy in** are two keys on the screen calling `box.saveCopy()` and `box.bringCopy({ merge })`; `merge(key, here, there)` picks when both have the key (Lists keeps the newer `at`).
6. **Say so when nothing can be kept:** `if (!box.kept) say('This visit only: nothing can be kept here', 'warn')`.

A whole app that does this: Lists, in the person's apps folder on MS (`<data>/4x4/apps/lists/`, five files); `apps/notes` in this repo; `apps/parts/starter/app.js` in small.

## Where the data sits
In the desk's browser storage for the person's apps, on that computer, under `4x4.data.<app's folder name>.`. Not in the app's folder, so the folder can be handed to someone without it. Not synced, not backed up: clearing the desk's site data clears it. Save a copy is how it is kept or moved today.

## Watch for
- **The folder's name is the box's name.** Rename the folder and the app opens empty; the old things are still there under the old name.
- **Don't read the box into a variable at start and trust it after.** Another copy may have changed it; read on `change`.
- **Don't style a split's own `<aside>` or `<main>` with `display`.** Lay out a `<div>` inside. (Since 2026-11-17 the parts hold their turns against this, but a desk carries the parts it was last given.)
- **A field the person is typing in** shouldn't be overwritten by a redraw: skip it while it has the focus.
- **No secrets in the app's folder,** and none in a box: other pages of the person's apps share the store's origin.

## When something else is the better pick
- **Pictures, recordings, anything large:** IndexedDB in the app, or files. Not a part yet; the app writes it.
- **Rows to search, sort and join (thousands):** SQLite on the person's computer, through a small local service the app names in its manifest's `reach`. No blueprint yet.
- **Several people on the same data:** not this. Use `shared()` (the parts' README, `apps/parts/README.md` › What an app shares).
- **A site's own data** (its sign-in, what the site stores): stays with the site, in its container. Nothing to do.
