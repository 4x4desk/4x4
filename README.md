# 4x4

4x4 AWD Desk is a desktop for people who work at large monitors. The screen is divided into zones, each zone holds apps, and a workspace says which apps sit where.
Every app is one folder of plain files that the person, and their own AI agent, can read and change.
It runs on the person's own computer, and what they store stays there.

The desk is at [4x4desk.app](https://4x4desk.app). This repository holds the open parts of it that are ready: the contracts the pieces meet through, the shared parts every app is built from, the first app, and a first workspace.

## The layers

The desk is built in five layers. Each changes at its own pace and meets the next through a contract, so work on one doesn't need the others' code.

| Layer | What it is | In this repository |
|---|---|---|
| 1. Foundation | The browser engine the desk runs on: Firefox, with our patches, compiled and signed | Not here yet |
| 2. Glue | The window, the bar, the zones, workspaces, the part that runs each app, the installer | Not here yet |
| 3. Apps | One folder each: a source plus our changes, or a page of our own | [`apps/parts`](apps/parts/), [`apps/calculator`](apps/calculator/) |
| 4. Workspaces | One small file each: which apps, and where | [`apps/workspaces`](apps/workspaces/) |
| 5. Data | Sign-ins and what each app stores | Never in a repository: it stays on the person's computer |

Building a new app touches layer 3 only. The contracts between the layers are in [`contracts/`](contracts/).

## What's here

```
contracts/       the promises the layers keep to each other
  app/           what an app is: one folder, who writes it, how it updates
  workspace/     what a workspace is: one small file
apps/
  parts/         the shared parts every app is built from, and a starter for a new app
  calculator/    the first app built from the parts
  workspaces/    ready-made workspaces
```

**Not here yet:** the desk itself (layers 1 and 2) and the other apps it ships with. Each joins this repository when it is ready for someone new to read.

## Try it

From the root of a clone, with any Python 3:

```sh
python3 -m http.server 8000
```

Then open:

- <http://localhost:8000/apps/parts/>: every part, in light and dark, with every press answered.
- <http://localhost:8000/apps/calculator/>: the calculator, on its own. Resize the window to see its three layouts.

There is no build step and nothing to install. Each app is plain HTML, CSS and JavaScript.

## Build an app

Copy [`apps/parts/starter/`](apps/parts/starter/) to `apps/<your-app>/` and build it from the parts. [`apps/parts/README.md`](apps/parts/README.md) lists them, and [`CONTRIBUTING.md`](CONTRIBUTING.md) says how to send it in.

## Contributing

Welcome. [`CONTRIBUTING.md`](CONTRIBUTING.md) says how a change travels. Bugs and app ideas go in [issues](https://github.com/4x4desk/4x4/issues), questions in [Discussions](https://github.com/4x4desk/4x4/discussions).

## Licence

Code is under the [GNU Affero General Public License v3.0](LICENSE). Documentation and data are under [CC BY-SA 4.0](LICENSE-docs.md).

## Contact

- Questions and ideas: hello@4x4desk.app
- Security problems: please write to security@4x4desk.app rather than opening a public issue.
