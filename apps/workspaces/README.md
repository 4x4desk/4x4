# apps/workspaces

Ready-made workspaces: each is one small file saying which apps sit in which zone. The shape is [`contracts/workspace`](../../contracts/workspace/).

| File | What it is |
|---|---|
| [`index.json`](index.json) | The list of workspaces the desk offers, by id |
| [`youtube.json`](youtube.json) | YouTube in the centre, with its panel on the right |

The apps a workspace names come from the desk's catalogue. The two that `youtube.json` names, `youtube` and `youtube-panel`, ship with the desk and are not in this repository yet.

## Add one

1. Write `<id>.json` in the contract's shape. Name apps the desk carries: the folders in [`apps/`](../) here, or ask at hello@4x4desk.app about the rest.
2. Add its id to `index.json`.
