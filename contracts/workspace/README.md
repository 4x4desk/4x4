# contracts/workspace: a workspace is a small file

Version 1. In use in 4x4 AWD Desk.

## The promise

**A workspace is only which apps, and where they sit.** It holds no app, no data and no code. Any app can go in any workspace.

```json
{
  "v": 1,
  "id": "youtube",
  "name": "YouTube",
  "hue": 25,
  "about": "YouTube with its panel beside it",
  "docks": { "centre": ["youtube"], "right": ["youtube-panel"] }
}
```

| Field | Meaning |
|---|---|
| `v` | This contract's version: 1 |
| `id` | The file's name, without `.json`. One workspace, one id |
| `name` | What the person reads |
| `hue` | A number on the colour wheel, or any CSS colour |
| `about` | One line on what it's for |
| `docks` | Zone → app ids ([`contracts/app`](../app/)). The first of each is in front. The zones are `left`, `centre`, `right` and `bottom` |
| `kept` | Optional: the zones' sizes and layout, as the desk's window layout exports them |

## Where they live

- **Ones every desk carries:** [`apps/workspaces/<id>.json`](../../apps/workspaces/), listed in `index.json`. Their apps must be in the desk's catalogue.
- **The person's own:** `<data>/4x4/workspaces/<id>.json`, beside their apps. With the same id, the person's wins.

## Who does what

- **The desk** offers each file under New workspace. On a press it installs any app that's missing, through its one installer, and hands the docks to the window layout.
- **The window layout** (the frame, part of the glue layer) keeps every workspace's docks, Home's included, as the person left them, and can export one in this shape.
- **Sharing a workspace** is sending this file. The other person's desk installs the apps it names.

The desk and its window layout are not in this repository yet.

## Not yet

- Save this as… writing a file here. Today the window layout keeps workspaces a person made in its own state.
- Home is kept like any workspace a person made, but isn't a file here yet.
