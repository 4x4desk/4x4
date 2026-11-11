# contracts

The agreements the pieces of 4x4 meet through: what one piece promises another, and nothing about how either is built. A change here can break every piece that uses it, so it is reviewed with more care than anything else in the repository.

Each contract is a folder with a README: the promise, who keeps it, and its version.

## The layers

4x4 AWD Desk is built in layers. Each one changes at its own pace, and each meets the next through a contract here, so work on one doesn't need the others' code.

| Layer | What it is | How often it changes | Meets the next through |
|---|---|---|---|
| 1. Foundation | Firefox with our patches, compiled and signed | When Firefox moves: every month or two | The window it opens, and the part that runs each app |
| 2. Glue | The window, the bar, zones, workspaces, the part that runs each app (the site core), the installer | Any day: it reaches every desk as a signed UI update, with no recompile | [`app/`](app/), [`workspace/`](workspace/) |
| 3. Apps | One folder each: a source plus our changes, or a page of our own | Any day; the person and their agent change them too | [`app/`](app/) |
| 4. Workspaces | One small file each: which apps, and where | Whenever a person likes | [`workspace/`](workspace/) |
| 5. Data | Sign-ins and what each app stores, in its own container | Never leaves the computer | Not yet written |

Building a new app touches layer 3 only. A new feature for every desk goes in layer 2. Layer 1 is for what the layers above can't do.

Layers 1 and 2 are not in this repository yet. Their side of each contract is described here in plain words, so an app or a workspace can be built against it today.

## What's here

- [`app/`](app/): an app on the person's computer: one folder, what's in it, who writes it, how it updates and keeps the person's changes. Version 1, in use in 4x4 AWD Desk.
- [`workspace/`](workspace/): a workspace as one small file: which apps, and where. Version 1, in use in 4x4 AWD Desk.
