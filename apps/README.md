# apps

Our own apps, one folder each, and the parts they are built from.

| Folder | What it is |
|---|---|
| [`parts/`](parts/) | The shared stylesheet and module every app is built from, a page showing every part, and [`starter/`](parts/starter/) for a new app |
| [`calculator/`](calculator/) | A calculator: the first app built from the parts |
| [`workspaces/`](workspaces/) | Ready-made workspaces: which apps, and where |

## Open an app

From the repository's root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/apps/<folder>/`. Each app also opens on its own in any browser served this way: it takes its look from [`parts/look.css`](parts/look.css) and the computer's light or dark setting.

In 4x4 AWD Desk the same folder runs in a zone, in a sandboxed frame, and takes its colours and sizes from the desk instead.

## What makes a folder an app

A `manifest.json` with three fields of the standard web app manifest, and the page it names:

```json
{
  "name": "Calculator",
  "icons": [{ "src": "icon.svg", "type": "image/svg+xml", "sizes": "any" }],
  "start_url": "index.html"
}
```

The folder's name is the app's id. Why this shape, and the rules an app keeps so it runs on its own and in the desk alike: [`calculator/README.md`](calculator/README.md) › The folder format. The full promise is [`contracts/app`](../contracts/app/).
