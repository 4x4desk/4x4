# Contributing

Thank you for looking. This project is young, and so is the way it takes changes: there are no issue templates and no automated checks yet. Every pull request is read by a person. Start small, and ask early.

## The easy way in: one essence app

An essence app is an app cut down to what a person needs, built from the shared parts.

1. **Pick an app.** An open source app you know, or a tool you use every day. Ask at hello@4x4desk.app, or open an issue, if you'd like to check the idea first.
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

## Send a change

1. Fork the repository and make a branch.
2. Keep each pull request to one thing: one app, or one fix.
3. Sign off every commit (below).
4. Open a pull request that says what it does and how you checked it.

A change to [`contracts/`](contracts/) affects every piece that uses it, so it gets a longer look. Open an issue about it first.

## Sign-off: the Developer Certificate of Origin

Every commit carries a line saying you have the right to contribute it, under the [Developer Certificate of Origin](https://developercertificate.org/):

```
Signed-off-by: Your Name <you@example.org>
```

`git commit -s` adds it for you. You keep the copyright in your work; you license it under this repository's licences: AGPL-3.0 for code, CC BY-SA 4.0 for documentation and data ([`LICENSE-docs.md`](LICENSE-docs.md)). There is nothing else to sign.

## Security

Please report a security problem to security@4x4desk.app rather than in a public issue.
