//! ui-lay: a UI channel's files laid into an unpacked app's content folder, and boot/builtin.json saying the number.
//!   x4h ui-lay <channel folder> <content folder>
//! <channel folder> holds channel.json ({ ui, label, files: { "<part>/<path>": "<sha256>" } }) and files/<sha256>.
//! Parts go where the app's jar puts them: content → 4x4desk, sitecore → sitecore, sitecore-content →
//! sitecore-content, apps → 4x4desk-apps. The content folder's 4x4desk-boot/builtin.json gets {"ui": <n>}.
use serde_json::{json, Value};
use std::path::Path;
use x4_helpers::pyjson::{dumps, print_form, Style};
use x4_helpers::util::read_json;

pub fn main(args: Vec<String>) -> i32 {
    const T: &str = "ui-lay";
    if args.len() != 2 {
        eprintln!("{}: x4h {} <channel folder> <content folder>", T, T);
        return 2;
    }
    let (ch, c) = (Path::new(&args[0]), Path::new(&args[1]));
    let list = match read_json(&ch.join("channel.json")) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("{}: {}", T, e);
            return 1;
        }
    };
    let Some(files) = list.get("files").and_then(Value::as_object) else {
        eprintln!("{}: channel.json has no files", T);
        return 1;
    };
    for (path, sha) in files {
        let Some((part, rest)) = path.split_once('/') else {
            eprintln!("{}: {}: no part before a /", T, path);
            return 1;
        };
        let folder = match part {
            "content" => "4x4desk",
            "sitecore" => "sitecore",
            "sitecore-content" => "sitecore-content",
            "apps" => "4x4desk-apps",
            _ => {
                eprintln!("{}: {}: a part the app has no place for", T, path);
                return 1;
            }
        };
        let to = c.join(folder).join(rest);
        let from = ch.join("files").join(sha.as_str().unwrap_or(""));
        let laid = to.parent().map(std::fs::create_dir_all).unwrap_or(Ok(())).and_then(|_| std::fs::copy(&from, &to).map(|_| ()));
        if let Err(e) = laid {
            eprintln!("{}: {} → {}: {}", T, from.display(), to.display(), e);
            return 1;
        }
    }
    let ui = list.get("ui").cloned().unwrap_or(Value::Null);
    let builtin = c.join("4x4desk-boot").join("builtin.json");
    if let Err(e) = std::fs::write(&builtin, dumps(&json!({"ui": ui}), Style::LINE)) {
        eprintln!("{}: {}: {}", T, builtin.display(), e);
        return 1;
    }
    println!("ui-into-package: {}, {} files laid, builtin.json says {}",
        list.get("label").map(print_form).unwrap_or_default(), files.len(), print_form(&ui));
    0
}
