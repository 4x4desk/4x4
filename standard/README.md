# 4x4's standard library

Everything 4x4's apps and programs are built from, in one place, so you can see what is already here, use it, and ask for what is missing.

**Use what is here first.** A new app or program takes its parts from this library. When something it needs is missing, add it here, where every app can use it, not inside the one app.

## The web: HTML, CSS and JavaScript
In [`apps/parts`](../apps/parts/). Every 4x4 app is built from these, and an app links just two files:

```html
<link rel="stylesheet" href="../parts/parts.css">
<script type="module" src="../parts/parts.js"></script>
```

| What | Where |
|---|---|
| The parts: page, buttons, fields, switches, tabs, cards, lists, views, notices, tags, dialogs, logs | `parts.css`, `parts.js` ([the table](../apps/parts/README.md#the-parts)) |
| The look: colours, type, light and dark | `look.css` |
| What an app keeps on this computer | `data()` in `parts.js` |
| What an app keeps with your other computers | `shared.js` |
| A conversation and its box; who is around | `named/thread.js`, `named/people.js` |
| A new app, ready to rename | [`starter/`](../apps/parts/starter/) |

See every part working: open `apps/parts/index.html` from a local server ([Try it](../README.md#try-it)).

## Rust
In [`rust/`](rust/): our own small parts, each with one job ([`parts.tsv`](rust/parts.tsv)), every outside crate our programs build, one version of each, and the rules that keep it that way ([`rust/README.md`](rust/README.md)).

## Missing something?
[Ask for a part](https://github.com/4x4desk/4x4/issues/new?template=missing-part.yml): what it should do, and anything you'd start from. Or build it and send it ([CONTRIBUTING.md](../CONTRIBUTING.md)).
