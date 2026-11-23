# Blueprint: a picture or a file in an app

Written from Text chat (its thread takes Add, a drop and a paste; *seen* between computers on 2026-11-18).

## Choose this when
The app holds pictures or documents the person adds: a photo on a list item, a receipt, a plan.

## The shape
- **In a shared thing:** `await t.file(file)` (`shared.js`): the file is kept on this computer by its hash and said as a line; every computer of the person's in the thing fetches it, piece by piece, checked. A line's `file` is `{ hash, name, size }`; show it with `<img src="/api/file/<hash>">` or a link to that address.
- **Getting the file:** an Add button with a hidden `<input type="file">`, a drop on the area, a paste. The thread part does all three: `thread.file = f => t.file(f)`.
- **On this computer only:** keep the file's bytes out of `data()` (its store is small). Ask the person to keep the file where they keep files, and keep only its name and what it is in `data()`; or put it in a shared thing with only this computer's other devices.
- Say the size as it goes ("Sending plan.pdf, 2 MB…") and say when it fails.

## Watch for
- Up to 64 MB at once; bigger ones go when opened.
- Another person's computer does not fetch files yet (only the person's own computers do): say so before sending a file in a thing shared with someone.
