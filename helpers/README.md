# helpers

4x4's build helpers: the small tools that package, publish and test a build, in Rust. Compiling 4x4 AWD Desk already
needs Rust, so they add no install; nothing here needs Python, Node or any other runtime.

One program, `x4h`, with a subcommand per tool.

## Build
```
cargo build --release --manifest-path helpers/Cargo.toml
```
Or skip that: `helpers/run <tool> [arguments]` (`helpers\run.ps1` in PowerShell) builds `x4h` the first time, again
whenever a source file here is newer than it, and then runs the tool. `helpers/run` alone lists the tools.

Rust 1.96 or newer. The crates it uses are in `Cargo.toml`, each with the reason it is there.

## The tools
| Tool | What it does |
|---|---|
| `release-file-pc <file> <application.ini> <VERSION file>` | Writes `latest.json` beside a Windows installer or a Linux tarball, and prints it: AWD's version (the one line in the VERSION file), Firefox's version and build id (from the built app's `application.ini`), the file's name, size and SHA-256. A running 4x4 AWD Desk reads this file to know a newer release is out. |
| `latest-json <file> <AWD version> <Firefox version> <build id>` | Prints the same record for a file whose versions the caller already knows (the Mac's disk image, whose versions are read from the app inside it). Writes nothing. |
| `latest-install <latest.json> <package name> <bytes> <sha256>` | Adds `install` to a `latest.json`: the installer package a newcomer is given, beside the file the app's own update takes. |
| `make-levels [--levels <folder>] [--artifact <level> <name> <url> <sha256> <bytes> [<version>]]` | Writes the four level files for installing AWD (`desk-mac`, `desk-mac-intel`, `desk-windows`, `desk-linux`): the checked steps a person's AI follows. The steps are in the source, once per system; a release only changes artifacts (`--artifact` sets one, then all four are written again). |
| `ui-lay <channel folder> <content folder>` | Lays a UI channel's files (`channel.json` and `files/<sha256>`) into an unpacked app's content folder and writes the UI's number into `4x4desk-boot/builtin.json`: a packaged app given a newer UI with no build. |
| `profile-icon <the app's .icns> <name> <out .icns> [hue]` | Mac. An app icon with its plate tinted in a colour and a name on a band below, so each copy of AWD in the Dock says which it is. Uses macOS's `iconutil`. |
| `json get [--or <text>] <file\|-> <key> [<key>…]` | One value out of a JSON file, for a shell script: a string bare, anything else as JSON. `-` reads standard input; a whole-number key indexes a list. |
| `serve <folder> [<port>] [--host <address>] [--cors]` | Serves a folder on a local port (8000 on 127.0.0.1 unless told otherwise), for looking at a built site or an app before it is published. Every answer says `Cache-Control: no-store`, so a reload shows the file on disk. Ctrl-C stops it. |
| `check [<folder>]` | The repository's own check, the one every pull request runs (`tools/check` calls it with the repository's root): every relative link, `src`, `href` and import resolves to a file; no file over 1 MB and no `.DS_Store`; every `.js` and `.mjs` file parses, when `node` is installed; every label the issue forms and the triage workflow use is in `.github/labels.yml`. Prints PASS or FAIL with one line per problem. |

## JSON, written the same way every time
Files these tools write are compared byte for byte (a level file's SHA-256, a `latest.json` on a download server), so
the writer is fixed: `src/pyjson.rs`. Keys keep the order they have in the source or in the file read; the indent,
the separators and whether non-ASCII is written as `\uXXXX` are named at each call.

## Adding a tool
A file in `src/` with `pub fn main(args: Vec<String>) -> i32`, a line in the table in `src/main.rs`, a row above.
Paths come in as arguments: a tool never assumes where it is in a repository.
