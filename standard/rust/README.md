# The Rust standard library

Every Rust crate 4x4's programs are built from, one version of each, kept up to date together.

## The rules
1. **One workspace.** Our Rust programs live in one Cargo workspace with one lock file (today `services/`: x4-p2p, x4-engine, x4-home, x4-identity, x4-sessions, x4-sessions-snapshot, x4-versions, x4-std).
2. **One version of each crate.** `crates --check` fails when a crate reaches a program at two versions and is not on [`allow.tsv`](allow.tsv). That file says which crate holds each old copy and the move that ends it. It only shrinks.
3. **Latest only.** All crates are updated together, then everything is built and tested. A crate that lags behind the rest is fixed in our own copy (`[patch.crates-io]`, as iroh and spake2 are). If it can't be fixed, it is replaced or dropped.
4. **The source is ours.** [4x4desk/crates](https://github.com/4x4desk/crates) holds the source of every crate we build, so a build never depends on anyone else's server.
5. **Every crate has a reason.** A new crate comes in only when nothing in [`crates.tsv`](crates.tsv) already does the job. Write the reason beside it in the Cargo.toml.
6. **Our own small crates are the parts.** A job done in two programs becomes one small crate in the workspace. A few long-running services hold the shared work (the network, storage, the desk). Short tools are built into one program.

## The files
- [`crates.tsv`](crates.tsv): every crate our programs build, its version, which programs use it, and whether one of ours names it directly. Look here first.
- [`allow.tsv`](allow.tsv): the crates still at two versions, and what ends each.
- `crates`: rewrites `crates.tsv`. `crates --check` is the one-version check. `crates --mirror <clone>` refreshes 4x4desk/crates.

Only crates that reach a running program are counted, on Linux, Apple Mac and Windows. Build-time macros, test-only crates and crates for other systems never run on a person's computer.

## Missing something?
[Ask for a part](https://github.com/4x4desk/4x4/issues/new?template=missing-part.yml): what it should do, and a crate you'd use if you know one.
