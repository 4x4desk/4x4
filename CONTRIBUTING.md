# Contributing

Thank you for looking. This project is young, and every issue and pull request is read by a person. Start small, and ask early.

## Where to start

- **A question, or an idea to talk over:** [Discussions](https://github.com/4x4desk/4x4/discussions).
- **A bug, an app you'd like, or an app you'd like to build:** open an [issue](https://github.com/4x4desk/4x4/issues/new/choose) and pick its form.
- **Something to work on:** issues labelled `good first issue` or `help wanted`.

A new issue may get a first reply from an AI helper, which suggests labels and asks for anything missing. It says so at the top, and a person follows.

## The easy way in: one essence app

An essence app is an app cut down to what a person needs, built from the shared parts.

1. **Pick an app.** An open source app you know, or a tool you use every day. Open an "Offer an essence app" issue to check the idea first.
2. **Cut it down.** Keep what a person reaches for; leave out the rest.
3. **Build it from the parts.** Copy [`apps/parts/starter/`](apps/parts/starter/) to `apps/<your-app>/` and follow [`apps/parts/README.md`](apps/parts/README.md). The calculator ([`apps/calculator/`](apps/calculator/)) is a worked example.
4. **Keep the rules an app keeps** ([`apps/calculator/README.md`](apps/calculator/README.md) › The folder format):
   - one folder, with a `manifest.json` (`name`, `icons`, `start_url`), its page and an `icon.svg`;
   - nothing fetched from anywhere else;
   - what it stores stays on the person's computer (`localStorage`, IndexedDB);
   - your own CSS only for what is truly the app's; no text under 16px; check it in light and dark, narrow and wide.
5. **Write its README:** what it does, what you left out and why, and where it came from.

If you bring code from another project, its licence must allow it to be shared under the AGPL-3.0, and its copyright notice comes along with it. Say so in the app's README.

## Run things

There is no build step. From the repository's root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/apps/<folder>/`. The parts page, `http://localhost:8000/apps/parts/`, shows every part in light and dark.

Before you send a change, run the same check a pull request runs:

```sh
python3 tools/check
```

It makes sure every link resolves, no file is over 1 MB, there's no `.DS_Store`, and every script parses.

## Send a change

1. Fork the repository and make a branch.
2. Keep each pull request to one thing: one app, or one fix.
3. Sign off every commit (below).
4. Open a pull request. Its form asks what it changes and how you checked it.

A change to [`contracts/`](contracts/) affects every piece that uses it, so it gets a longer look. Open an issue about it first.

## How a change travels

One thing here is unusual. This repository is published from the project's working repository, where the desk's other layers are still being built. So a pull request isn't merged here with the button:

1. A person reviews it here, with you, until it's ready.
2. A maintainer applies it in the working repository, with a `Co-authored-by:` line naming you, so the commit carries your credit.
3. It arrives back here with the next publish, and the pull request is closed with a link to that commit.

This may become ordinary merging later, as more of the desk moves here.

## Sign-off: the Developer Certificate of Origin

Every commit carries a line saying you have the right to contribute it, under the [Developer Certificate of Origin](https://developercertificate.org/):

```
Signed-off-by: Your Name <you@example.org>
```

`git commit -s` adds it for you; a check on every pull request looks for it. You keep the copyright in your work; you license it under this repository's licences: AGPL-3.0 for code, CC BY-SA 4.0 for documentation and data ([`LICENSE-docs.md`](LICENSE-docs.md)). There is nothing else to sign.

## Be kind

Everyone here follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please report a security problem to security@4x4desk.app rather than in a public issue. [`SECURITY.md`](SECURITY.md) says what to include.
