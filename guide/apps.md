# Apps

In 4x4 an app is one folder. Everything that makes it what it is sits there, in plain files the person and their agent can read and change.

## Essence Applications

4x4's kind of app is an Essence Application (EAP, or essence app for short): a source plus our changes to it, cut down to what a person needs. The source is one of two things:

- **A website**, with our changes laid over it: which addresses it may reach, styles that remove clutter, small scripts that tidy its pages. These live in the folder's `recipe.json`, `style/` and `script/`.
- **A page of our own**, built from the [shared parts](../apps/parts/) so every app looks and behaves alike. The [calculator](../apps/calculator/) is the first; a new one starts from [`apps/parts/starter/`](../apps/parts/starter/).

Either way it is one unit with one name. The person's data, sign-ins and what the app stores, is not in the folder; it stays on their computer.

## Updates keep the person's changes

The folder records each file as we shipped it. On an update, a file the person hasn't touched takes the newer version; a file they changed stays theirs. Showing them what an update would have changed in their file, and merging the two, is not built yet.

## Sharing

Sharing an app is sending its folder. The other person gets the app and none of your data.

The full promise, field by field: [`contracts/app`](../contracts/app/). Sending one in: [`CONTRIBUTING.md`](../CONTRIBUTING.md). Next: [zones and workspaces](workspaces.md).
