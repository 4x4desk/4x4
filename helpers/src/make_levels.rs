//! make-levels: writes 4x4 AWD Desk's level files, desk-{mac,mac-intel,windows,linux}.json, the checked steps a
//! person's AI follows to install AWD. The format is the levels contract (version 0).
//!   x4h make-levels [--levels <folder>]                 rewrite all four, keeping each file's artifacts
//!   x4h make-levels [--levels <folder>] --artifact <level> <name> <url> <sha256> <bytes> [<version>]
//!                                                       set one artifact, then rewrite all four
//! <folder> is where the level files live (default: levels in the current folder).
//! The steps live here, once per system, so the Mac's two files can't drift apart and a release only changes
//! artifacts. No step needs administrator rights; every download is checked against its SHA-256 before anything opens.
//! Artifacts point at files that are never overwritten (alpha/levels/<level>/<sha256 prefix>/<file> on
//! get.4x4desk.app), so a level file that's live keeps working until the next one replaces it.
use serde_json::{json, Map, Value};
use std::path::{Path, PathBuf};
use x4_helpers::pyjson::{dumps, print_form, round_half_even, Style};

const TEAM: &str = "AHXUX6G3Z5";
const APP: &str = "~/Applications/4x4 AWD Desk.app";
const DMG: &str = "~/Downloads/4x4-AWD-Desk.dmg";
const MNT: &str = "~/Downloads/4x4-AWD-Desk-check";
const FOR: &str = "Your apps side by side in zones, each with its own sign-in, and your own AI beside your work. An early version (alpha).";

fn load(levels: &Path, level: &str) -> Map<String, Value> {
    match std::fs::read_to_string(levels.join(format!("{}.json", level))) {
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(Value::Object(o)) => o,
            Ok(_) => Map::new(),
            Err(e) => {
                eprintln!("make-levels: {}.json: {}", level, e);
                std::process::exit(1)
            }
        },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Map::new(),
        Err(e) => {
            eprintln!("make-levels: {}.json: {}", level, e);
            std::process::exit(1)
        }
    }
}

fn artifacts(levels: &Path, level: &str, names: &[&str]) -> Map<String, Value> {
    let old = load(levels, level).get("artifacts").and_then(Value::as_object).cloned().unwrap_or_default();
    names.iter().map(|n| (n.to_string(), old.get(*n).cloned()
        .unwrap_or_else(|| json!({"url": null, "sha256": null, "size_mb": null, "version": null})))).collect()
}

/// A value that counts as there: not missing, null, false, 0 or "".
fn truthy(v: Option<&Value>) -> Option<&Value> {
    v.filter(|v| match v {
        Value::Null | Value::Bool(false) => false,
        Value::String(s) => !s.is_empty(),
        Value::Number(n) => n.as_f64() != Some(0.0),
        Value::Array(a) => !a.is_empty(),
        Value::Object(o) => !o.is_empty(),
        _ => true,
    })
}

fn version_of(arts: &Map<String, Value>, name: &str) -> Value {
    truthy(arts[name].get("version")).cloned().unwrap_or_else(|| json!("159.0.1"))
}

fn size_words(arts: &Map<String, Value>) -> String {
    truthy(arts["desk"].get("size_mb")).map(print_form).unwrap_or_else(|| "140".into())
}

/// a's keys, then b's (b's value wins where both have a key; the key keeps a's place).
fn with(a: &Value, b: Value) -> Value {
    let mut out = a.as_object().cloned().unwrap_or_default();
    if let Value::Object(b) = b {
        for (k, v) in b {
            out.insert(k, v);
        }
    }
    Value::Object(out)
}

// ---- Mac (Apple chip and Intel): the system's own tools ----
fn mac(levels: &Path, level: &str, arch: &str, chip_yes: &str, chip_no: &str) -> Value {
    let mut arts = artifacts(levels, level, &["desk"]);
    if let Some(desk) = arts.get_mut("desk").and_then(Value::as_object_mut) {
        desk.insert("team".into(), json!(TEAM));
    }
    let ver = version_of(&arts, "desk");
    let size = size_words(&arts);
    // The installed app's own process, not a builder's copy elsewhere. "[A]pplications" matches the path but not the
    // pattern itself, so the shell an AI runs this in (zsh -c "pgrep -f …") doesn't count as a match.
    let running = json!(["/usr/bin/pgrep", "-f", "[A]pplications/4x4 AWD Desk.app/Contents/MacOS/4x4desk"]);
    let pgrep_closed = json!({"command": running, "exits": 1});
    let trash = |path: &str| json!(["/usr/bin/osascript", "-e", "on run argv", "-e",
        "tell application \"Finder\" to delete (POSIX file (item 1 of argv) as alias)", "-e", "end run", path]);
    let finder = json!({"acts": "macos-prompt",
        "say": "macOS may ask whether this may control Finder (once): Allow lets it move the old app to the Trash."});
    let team_id = format!("TeamIdentifier={}", TEAM);
    let mnt_app = format!("{}/4x4 AWD Desk.app", MNT);
    let info = format!("{}/Contents/Info", APP);
    let aside = "<data>/aside-4x4 AWD Desk.app";
    json!({
        "level": 0, "id": level, "version": "2026.11.07-1", "owner": "awd-builds",
        "title": "4x4 AWD Desk for your Mac", "for": FOR, "size_mb": 300,
        "needs": ["ai"], "runners": ["agent", "max"],
        "done": [{"command": ["/usr/bin/codesign", "-dv", APP], "prints": team_id},
                 {"command": ["/usr/bin/defaults", "read", info, "CFBundleShortVersionString"], "prints": ver}],
        "artifacts": arts,
        "todo": ["Bringing a desk saved from 4x4 PWA Desk (my-4x4.json) isn't built in AWD yet; the step comes back when it is."],
        "fits": [{"fact": "os", "is": "macos", "yes": "This is a Mac.",
                  "no": "This one is for a Mac; 4x4 AWD Desk has its own for Windows and Linux."},
                 {"fact": "arch", "is": arch, "yes": chip_yes, "no": chip_no}],
        "steps": [
            {"id": "download", "title": "Download 4x4 AWD Desk",
             "say": format!("Downloads 4x4 AWD Desk (about {} MB) into your Downloads folder. Nothing is opened or installed yet.", size),
             "who": "run",
             "run": {"command": ["/usr/bin/curl", "-fL", "--retry", "3", "--create-dirs", "-o", DMG, "<artifacts.desk.url>"],
                     "plan": null, "noPlan": "A download with the system's own curl; the next steps check what arrived before anything is opened."},
             "changes": "one file in Downloads",
             "check": {"command": ["/usr/bin/shasum", "-a", "256", DMG], "prints": "<artifacts.desk.sha256>",
                       "no": "The download doesn't match 4x4's release: it may be damaged or not ours. Delete it and try again."},
             "undo": {"command": ["/bin/rm", DMG]}, "ask": "once"},
            {"id": "check-signature", "title": "Check that it's really from 4x4",
             "say": format!("Opens the download read-only, without starting anything in it, and checks it with Apple's own tools: signed by 4x4's developer account (team {}) and notarized by Apple, the download and the app inside it both.", TEAM),
             "who": "run",
             "run": {"command": ["/usr/bin/hdiutil", "attach", "-nobrowse", "-readonly", "-mountpoint", MNT, DMG],
                     "plan": null, "noPlan": "Opens the disk image read-only in a folder in Downloads to look inside; nothing runs."},
             "changes": "a read-only disk image opened in Downloads",
             "check": [
                 {"command": ["/usr/bin/codesign", "-dv", DMG], "prints": team_id,
                  "no": "The download isn't signed by 4x4's developer account."},
                 {"command": ["/usr/sbin/spctl", "--assess", "--type", "open", "--context",
                              "context:primary-signature", "-vv", DMG], "prints": "Notarized Developer ID",
                  "no": "Apple hasn't notarized this download."},
                 {"command": ["/usr/bin/codesign", "-dv", mnt_app],
                  "prints": team_id, "no": "The app inside isn't signed by 4x4's developer account."},
                 {"command": ["/usr/bin/codesign", "--verify", "--deep", "--strict", mnt_app],
                  "exits": 0, "no": "The app inside has been changed since it was signed."},
                 {"command": ["/usr/sbin/spctl", "--assess", "--type", "execute", "-vv", mnt_app],
                  "prints": "Notarized Developer ID", "no": "Apple hasn't notarized the app inside."}],
             "undo": {"command": ["/usr/bin/hdiutil", "detach", MNT]}, "ask": "once"},
            {"id": "quit-old", "title": "Quit 4x4 AWD Desk if it's open",
             "say": "4x4 AWD Desk is open. Quit it (4x4 AWD Desk › Quit, or ⌘ Q) so the new one can take its place; your desks and sign-ins stay, they're kept outside the app.",
             "who": "person", "check": with(&pgrep_closed, json!({"no": "4x4 AWD Desk is still open."})),
             "undo": {"none": "Nothing changed."}, "ask": "once", "when": pgrep_closed},
            {"id": "clear-aside", "title": "Clear an earlier set-aside copy",
             "say": "An older 4x4 AWD Desk set aside by an earlier install is still in 4x4's folder in your Library. It goes to the Trash first, so this install's set-aside has an empty place.",
             "who": "run", "when": {"command": ["/bin/test", "-e", aside], "exits": 1},
             "run": {"command": trash(aside), "plan": null,
                     "noPlan": "Finder's own move to the Trash, so it can still be taken back out."},
             "person": finder, "changes": "an earlier set-aside app in the Trash",
             "check": {"command": ["/bin/test", "!", "-e", aside], "exits": 0,
                       "no": "The old copy is still in 4x4's folder: macOS may have said no to moving it."},
             "undo": {"say": "It's in the Trash: Put Back brings it to 4x4's folder in your Library."}, "ask": "once"},
            {"id": "data-folder", "title": "Make 4x4's folder in your Library",
             "say": "Makes 4x4's own folder in your Library, where the old copy is set aside in the next step.",
             "who": "run", "when": {"command": ["/bin/test", "-d", "<data>"], "exits": 0},
             "run": {"command": ["/bin/mkdir", "-p", "<data>"], "plan": null,
                     "noPlan": "One empty folder with the system's own mkdir."},
             "changes": "one empty folder in your Library",
             "check": {"command": ["/bin/test", "-d", "<data>"], "exits": 0, "no": "4x4's folder isn't there."},
             "undo": {"command": ["/bin/rmdir", "<data>"]}, "ask": "once"},
            {"id": "set-aside", "title": "Set the old 4x4 AWD Desk aside",
             "say": "Moves the 4x4 AWD Desk you have now into 4x4's own folder in your Library, so the new one goes into an empty place and the old one can come back if anything goes wrong.",
             "who": "run", "when": {"command": ["/bin/test", "-e", APP], "exits": 1},
             "run": {"command": ["/bin/mv", APP, aside], "plan": null,
                     "noPlan": "A move with the system's own mv: a rename, no copy and no extra room."},
             "changes": "the old app moved into 4x4's folder in your Library",
             "check": [{"command": ["/bin/test", "-e", format!("{}/Contents/Info.plist", aside)],
                        "exits": 0, "no": "The old 4x4 AWD Desk didn't arrive in 4x4's folder."},
                       {"command": ["/bin/test", "!", "-e", APP], "exits": 0,
                        "no": "The old 4x4 AWD Desk is still in Applications."}],
             "undo": {"command": ["/bin/mv", aside, APP]}, "ask": "once"},
            {"id": "install", "title": "Put 4x4 AWD Desk in your Applications",
             "say": "Copies the checked app into the Applications folder in your home folder. No password is needed. Your desks, sign-ins and sites are kept outside the app, so they stay.",
             "who": "run",
             "run": {"command": ["/usr/bin/ditto", mnt_app, APP], "plan": null,
                     "noPlan": "A copy with the system's own ditto, which keeps the signature, into an empty place."},
             "changes": "one app in Applications in your home folder",
             "check": [{"command": ["/usr/bin/codesign", "--verify", "--deep", "--strict", APP], "exits": 0,
                        "no": "The copied app doesn't verify."},
                       {"command": ["/usr/bin/defaults", "read", info, "CFBundleShortVersionString"],
                        "prints": ver, "no": "The copied app isn't the version that was downloaded."}],
             "undo": {"command": ["/bin/rm", "-r", APP]}, "ask": "each"},
            {"id": "close-download", "title": "Close the download",
             "say": "Closes the disk image it was checked in. The download stays in Downloads; you can delete it.",
             "who": "run",
             "run": {"command": ["/usr/bin/hdiutil", "detach", MNT], "plan": null,
                     "noPlan": "Closes what the check step opened."},
             "changes": "the disk image closed",
             "check": {"command": ["/bin/test", "!", "-e", mnt_app], "exits": 0,
                       "no": "The disk image is still open."},
             "undo": {"none": "It's the download; the app is already in place."}, "ask": "once"},
            {"id": "first-start", "title": "Open 4x4 AWD Desk",
             "say": "Open 4x4 AWD Desk from Applications (or ⌘ Space, type 4x4). The first time, macOS asks whether to open an app downloaded from the internet: press Open. The desk opens with Welcome in the middle.",
             "who": "person",
             "check": {"command": running, "exits": 0, "no": "4x4 AWD Desk isn't open yet."},
             "person": {"acts": "macos-prompt", "say": "macOS asks whether to open an app downloaded from the internet: Open."},
             "undo": {"say": "Quit it (⌘ Q). To remove it, move it from Applications in your home folder to the Trash."},
             "ask": "once"},
            {"id": "tidy", "title": "Remove the old 4x4 AWD Desk",
             "say": "Now that the new one has opened, moves the old one that was set aside to the Trash.",
             "who": "run", "when": {"command": ["/bin/test", "-e", aside], "exits": 1},
             "run": {"command": trash(aside), "plan": null,
                     "noPlan": "Finder's own move to the Trash, so it can still be taken back out."},
             "person": finder, "changes": "the old app in the Trash",
             "check": {"command": ["/bin/test", "!", "-e", aside], "exits": 0,
                       "no": "The old copy is still in 4x4's folder."},
             "undo": {"say": "It's in the Trash: Put Back brings it back."}, "ask": "once"}]})
}

// ---- Windows and Linux: our hands script does the moves, so each step has a plan and refuses in code ----
fn pc(levels: &Path, level: &str, system: &str) -> Value {
    let win = system == "windows";
    let p = if win { "-Plan" } else { "--plan" }; // the hands' plan flag: changes nothing, prints what it would do
    let arts = artifacts(levels, level, &["desk", "hands"]);
    let size = size_words(&arts);
    let hands = if win { "<data>\\awd-windows.ps1" } else { "<data>/awd-linux.sh" };
    let dl = if win { "<home>\\Downloads\\4x4-AWD-Desk-windows.zip" } else { "~/Downloads/4x4-AWD-Desk-linux.tar.xz" };
    let h = |a: &[&str]| -> Value {
        let mut cmd: Vec<&str> = if win {
            vec!["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", hands]
        } else {
            vec!["/bin/sh", hands]
        };
        cmd.extend_from_slice(a);
        json!(cmd)
    };
    let curl = if win { "curl.exe" } else { "curl" };
    let sha = |f: &str| if win { json!(["certutil", "-hashfile", f, "SHA256"]) } else { json!(["sha256sum", f]) };
    let rm = |f: &str| if win { json!(["cmd.exe", "/c", "del", f]) } else { json!(["rm", f]) };
    let (menu, unmenu, place) = if win { ("shortcut", "unshortcut", "the Start menu") } else { ("menu", "unmenu", "your app menu") };
    let (closed, opened, fits, app_words, open_say);
    if win {
        closed = json!({"command": h(&["closed"]), "exits": 0});
        opened = json!({"command": h(&["opened"]), "exits": 0});
        fits = json!([{"fact": "os", "is": "windows", "yes": "This is a Windows PC.",
                       "no": "This one is for Windows; 4x4 AWD Desk has its own for a Mac and for Linux."},
                      {"fact": "arch", "is": "x64", "yes": "Its Intel or AMD chip runs 4x4 AWD Desk.",
                       "no": "This PC has an ARM chip; 4x4 AWD Desk for it isn't made yet."}]);
        app_words = "your own Programs folder (no administrator rights, and Windows doesn't warn: it's the copy your AI downloaded and checked)";
        open_say = "Open 4x4 AWD Desk from the Start menu (type 4x4). The desk opens with Welcome in the middle.";
    } else {
        closed = json!({"command": ["pgrep", "-x", "4x4desk"], "exits": 1});
        opened = json!({"command": ["pgrep", "-x", "4x4desk"], "exits": 0});
        fits = json!([{"fact": "os", "is": "linux", "yes": "This is Linux.",
                       "no": "This one is for Linux; 4x4 AWD Desk has its own for a Mac and for Windows."},
                      {"fact": "arch", "is": "x64", "yes": "Its Intel or AMD chip runs 4x4 AWD Desk.",
                       "no": "This computer has an ARM chip; 4x4 AWD Desk for it isn't made yet."}]);
        app_words = "~/.local/opt/4x4desk, in your home folder (nothing system-wide, no password)";
        open_say = "Open 4x4 AWD Desk from your app menu (on 4x4 OS and Omarchy: Super + Space, type 4x4). The desk opens with Welcome in the middle.";
    }
    json!({
        "level": 0, "id": level, "version": "2026.11.07-1", "owner": "awd-builds",
        "title": format!("4x4 AWD Desk for your {}", if win { "Windows PC" } else { "Linux computer" }), "for": FOR,
        "size_mb": if win { 400 } else { 300 }, "needs": ["ai"], "runners": ["agent"],
        "done": [{"command": h(&["installed"]), "exits": 0}, {"command": h(&["listed"]), "exits": 0}],
        "artifacts": arts,
        "fits": fits,
        "steps": [
            {"id": "download", "title": "Download 4x4 AWD Desk",
             "say": format!("Downloads 4x4 AWD Desk (about {} MB) into your Downloads folder. Nothing is opened or installed yet.", size),
             "who": "run",
             "run": {"command": [curl, "-fL", "--retry", "3", "--create-dirs", "-o", dl, "<artifacts.desk.url>"], "plan": null,
                     "noPlan": "A download with the system's own curl; the next step checks what arrived."},
             "changes": "one file in Downloads",
             "check": {"command": sha(dl), "prints": "<artifacts.desk.sha256>",
                       "no": "The download doesn't match 4x4's release: it may be damaged or not ours. Delete it and try again."},
             "undo": {"command": rm(dl)}, "ask": "once"},
            {"id": "download-hands", "title": "Download 4x4's installer helper",
             "say": "Downloads the small script that does the moves in the next steps, into 4x4's own folder, and checks it the same way. Each of its steps can show what it would do first.",
             "who": "run",
             "run": {"command": [curl, "-fL", "--retry", "3", "--create-dirs", "-o", hands, "<artifacts.hands.url>"],
                     "plan": null, "noPlan": "A download; its check is the next line."},
             "changes": "one small file in 4x4's folder",
             "check": {"command": sha(hands), "prints": "<artifacts.hands.sha256>",
                       "no": "The helper doesn't match 4x4's release. Stop here."},
             "undo": {"command": rm(hands)}, "ask": "once"},
            {"id": "quit-old", "title": "Quit 4x4 AWD Desk if it's open",
             "say": "4x4 AWD Desk is open. Quit it so the new one can take its place; your desks and sign-ins stay, they're kept outside the app.",
             "who": "person", "check": with(&closed, json!({"no": "4x4 AWD Desk is still open."})),
             "undo": {"none": "Nothing changed."}, "ask": "once", "when": closed},
            {"id": "clear-aside", "title": "Clear an earlier set-aside copy",
             "say": "An older 4x4 AWD Desk set aside by an earlier install is still in 4x4's folder. It's deleted first, so this install's set-aside has an empty place.",
             "who": "run", "when": {"command": h(&["aside"]), "exits": 1},
             "run": {"command": h(&["tidy"]), "plan": [p]},
             "changes": "an earlier set-aside copy deleted",
             "check": {"command": h(&["aside"]), "exits": 1, "no": "The old set-aside copy is still there."},
             "undo": {"none": "It was an older copy, kept from a previous install."}, "ask": "once"},
            {"id": "set-aside", "title": "Set the old 4x4 AWD Desk aside",
             "say": "Moves the 4x4 AWD Desk you have now into 4x4's own folder, so the new one goes into an empty place and the old one can come back if anything goes wrong.",
             "who": "run", "when": {"command": h(&["installed"]), "exits": 1},
             "run": {"command": h(&["set-aside"]), "plan": [p]},
             "changes": "the old app moved into 4x4's folder",
             "check": [{"command": h(&["aside"]), "exits": 0, "no": "The old 4x4 AWD Desk wasn't set aside."},
                       {"command": h(&["installed"]), "exits": 1, "no": "The old 4x4 AWD Desk is still in place."}],
             "undo": {"command": h(&["put-back"])}, "ask": "once"},
            {"id": "install", "title": "Put 4x4 AWD Desk in place",
             "say": format!("Unpacks the checked download into {}. Your desks and sign-ins are kept outside the app, so they stay.", app_words),
             "who": "run",
             "run": {"command": if win { h(&["unpack", "-File", dl]) } else { h(&["unpack", dl]) },
                     "plan": [p]},
             "changes": "the app in your own folder",
             "check": {"command": h(&["installed"]), "exits": 0, "no": "4x4 AWD Desk isn't in place."},
             "undo": {"command": h(&["remove"])}, "ask": "each"},
            {"id": "menu", "title": format!("Add 4x4 AWD Desk to {}", place),
             "say": format!("Adds 4x4 AWD Desk to {}, so you can open it like any app.", place),
             "who": "run",
             "run": {"command": h(&[menu]), "plan": [p]},
             "changes": format!("one entry in {} (one already there is kept, and its undo puts it back)", place),
             "check": {"command": h(&["listed"]), "exits": 0, "no": format!("4x4 AWD Desk isn't in {}.", place)},
             "undo": {"command": h(&[unmenu])}, "ask": "once"},
            {"id": "first-start", "title": "Open 4x4 AWD Desk", "say": open_say, "who": "person",
             "check": with(&opened, json!({"no": "4x4 AWD Desk isn't open yet."})),
             "undo": {"say": "Close it. The steps' undos, last first, remove it again."}, "ask": "once"},
            {"id": "tidy", "title": "Remove the old 4x4 AWD Desk",
             "say": "Now that the new one has opened, deletes the old one that was set aside.",
             "who": "run", "when": {"command": h(&["aside"]), "exits": 1},
             "run": {"command": h(&["tidy"]), "plan": [p]},
             "changes": "the old copy deleted",
             "check": {"command": h(&["aside"]), "exits": 1, "no": "The old copy is still there."},
             "undo": {"none": "The new one is open and working; the old copy isn't needed."}, "ask": "once"}]})
}

fn write(levels: &Path, level: &str, data: &Value) {
    let path = levels.join(format!("{}.json", level));
    if let Err(e) = std::fs::write(&path, format!("{}\n", dumps(data, Style::indent(2).utf8()))) {
        eprintln!("make-levels: {}: {}", path.display(), e);
        std::process::exit(1);
    }
}

fn build_all(levels: &Path) {
    write(levels, "desk-mac", &mac(levels, "desk-mac", "arm64", "Its Apple chip runs this build.",
        "This Mac has an Intel chip: 4x4 AWD Desk for Intel Macs is its own download."));
    write(levels, "desk-mac-intel", &mac(levels, "desk-mac-intel", "x64", "This Mac has an Intel chip; this build is for it.",
        "This Mac has an Apple chip: 4x4 AWD Desk for it is its own download."));
    write(levels, "desk-windows", &pc(levels, "desk-windows", "windows"));
    write(levels, "desk-linux", &pc(levels, "desk-linux", "linux"));
}

pub fn main(mut args: Vec<String>) -> i32 {
    let mut levels = PathBuf::from("levels");
    if args.first().map(String::as_str) == Some("--levels") && args.len() >= 2 {
        levels = PathBuf::from(&args[1]);
        args.drain(0..2);
    }
    if args.first().map(String::as_str) == Some("--artifact") {
        if args.len() < 6 {
            eprintln!("make-levels: --artifact <level> <name> <url> <sha256> <bytes> [<version>]");
            return 2;
        }
        let (level, name, url, sha, size) = (&args[1], &args[2], &args[3], &args[4], &args[5]);
        let Ok(bytes) = size.trim().parse::<i64>() else {
            eprintln!("make-levels: {} is not a number of bytes", size);
            return 1;
        };
        let mut data = load(&levels, level);
        let arts = data.entry("artifacts").or_insert_with(|| json!({}));
        let Some(arts) = arts.as_object_mut() else {
            eprintln!("make-levels: {}.json: artifacts is not an object", level);
            return 1;
        };
        let art = arts.entry(name.as_str()).or_insert_with(|| json!({}));
        let Some(art) = art.as_object_mut() else {
            eprintln!("make-levels: {}.json: artifacts.{} is not an object", level, name);
            return 1;
        };
        art.shift_remove("note"); // the first desk-mac.json's "not published yet"
        art.insert("url".into(), json!(url));
        art.insert("sha256".into(), json!(sha));
        art.insert("size_mb".into(), if bytes != 0 { json!(round_half_even(bytes as f64 / 1e6)) } else { Value::Null });
        if args.len() > 6 {
            art.insert("version".into(), json!(args[6]));
        }
        write(&levels, level, &Value::Object(data));
    }
    build_all(&levels);
    0
}
