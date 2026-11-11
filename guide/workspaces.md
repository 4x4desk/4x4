# Zones and workspaces

## Zones

A zone is a place on the screen that shows one thing at a time. The usual start is four: Left, Centre, Right and Bottom. The line between two zones is a splitter: drag it to resize, double-click to put it back. Zen lets the zone you're in fill the whole space while the others wait.

## Docks

Every zone has its own dock, a strip of icons for the apps it can show. Click an icon and that app comes to the front. The others wait with their state kept. A zone has no tabs; its dock is how you switch.

## Workspaces

A workspace is a name, its zones, the apps in them and where each was left. The person switches between workspaces, and makes, renames and removes them, from the top left of the bar. One might be YouTube with its companion panel; another, a set of tools for real estate.

A workspace holds only which apps and where: no app code, no data, no sign-ins. A sign-in belongs to its app. Detail such as a client list lives inside an app in a zone, so the list of workspaces stays short.

As a file, a workspace is small:

```json
{ "v": 1, "id": "youtube", "name": "YouTube", "hue": 25,
  "docks": { "centre": ["youtube"], "right": ["youtube-panel"] } }
```

Sharing one is sending that file; the other desk installs the apps it names. Ready-made workspaces ship in [`apps/workspaces/`](../apps/workspaces/). Saving a person's own workspace as a file is not built yet.

The full promise: [`contracts/workspace`](../contracts/workspace/). Next: [the look](design.md).
