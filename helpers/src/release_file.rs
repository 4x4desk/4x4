//! The release file: latest.json beside a download, which a running 4x4 AWD Desk reads to know a newer one is out.
//!   { version: AWD's, firefox, build: Gecko's build id, file, size, sha256 [, install: { file, size, sha256 }] }
use serde_json::{json, Map, Value};
use std::path::Path;
use x4_helpers::pyjson::{dumps, Style};
use x4_helpers::util::{absolute, base_name, read_json, sha256_file};

fn record(tool: &str, file: &Path, version: &str, firefox: &str, build: &str) -> Result<Value, i32> {
    let size = std::fs::metadata(file).map(|m| m.len());
    let sum = sha256_file(file);
    match (size, sum) {
        (Ok(size), Ok(sum)) => Ok(json!({"version": version, "firefox": firefox, "build": build,
            "file": base_name(file), "size": size, "sha256": sum})),
        (Err(e), _) | (_, Err(e)) => {
            eprintln!("{}: {}: {}", tool, file.display(), e);
            Err(1)
        }
    }
}

/// x4h release-file-pc <file> <application.ini> <VERSION file>   → <the file's folder>/latest.json, and prints it
/// For a Windows installer or a Linux tarball. application.ini is the built app's: its [App] Version and BuildID are
/// the ones the app reports. The VERSION file holds AWD's own version on one line.
pub fn release_file_pc(args: Vec<String>) -> i32 {
    const T: &str = "release-file-pc";
    if args.len() != 3 {
        eprintln!("{}: x4h {} <file> <application.ini> <VERSION file>", T, T);
        return 2;
    }
    let (file, ini, version_file) = (Path::new(&args[0]), Path::new(&args[1]), Path::new(&args[2]));
    let ini_text = match std::fs::read_to_string(ini) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("{}: {}: {}", T, ini.display(), e);
            return 1;
        }
    };
    let app = ini_section(&ini_text, "App");
    let (Some(firefox), Some(build)) = (app.get("version"), app.get("buildid")) else {
        eprintln!("{}: {}: no [App] Version and BuildID", T, ini.display());
        return 1;
    };
    let version = match std::fs::read_to_string(version_file) {
        Ok(t) => t.trim().to_string(),
        Err(e) => {
            eprintln!("{}: {}: {}", T, version_file.display(), e);
            return 1;
        }
    };
    let release = match record(T, file, &version, firefox.as_str().unwrap_or(""), build.as_str().unwrap_or("")) {
        Ok(r) => r,
        Err(code) => return code,
    };
    let text = dumps(&release, Style::indent(1));
    let out = absolute(file).parent().map(|d| d.join("latest.json")).unwrap_or_else(|| "latest.json".into());
    if let Err(e) = std::fs::write(&out, format!("{}\n", text)) {
        eprintln!("{}: {}: {}", T, out.display(), e);
        return 1;
    }
    println!("{}", text);
    0
}

/// x4h latest-json <file> <AWD version> <Firefox version> <build id>   prints the record; nothing is written
/// For the Mac's DMG, whose versions the calling script reads from the app inside it.
pub fn latest_json(args: Vec<String>) -> i32 {
    const T: &str = "latest-json";
    if args.len() != 4 {
        eprintln!("{}: x4h {} <file> <AWD version> <Firefox version> <build id>", T, T);
        return 2;
    }
    match record(T, Path::new(&args[0]), &args[1], &args[2], &args[3]) {
        Ok(r) => {
            println!("{}", dumps(&r, Style::indent(1)));
            0
        }
        Err(code) => code,
    }
}

/// x4h latest-install <latest.json> <package name> <bytes> <sha256>   sets "install" in the file
pub fn latest_install(args: Vec<String>) -> i32 {
    const T: &str = "latest-install";
    if args.len() != 4 {
        eprintln!("{}: x4h {} <latest.json> <package name> <bytes> <sha256>", T, T);
        return 2;
    }
    let path = Path::new(&args[0]);
    let mut latest = match read_json(path) {
        Ok(Value::Object(o)) => o,
        Ok(_) => {
            eprintln!("{}: {}: not an object", T, path.display());
            return 1;
        }
        Err(e) => {
            eprintln!("{}: {}", T, e);
            return 1;
        }
    };
    let Ok(size) = args[2].trim().parse::<i64>() else {
        eprintln!("{}: {} is not a number of bytes", T, args[2]);
        return 1;
    };
    latest.insert("install".into(), json!({"file": args[1], "size": size, "sha256": args[3]}));
    match std::fs::write(path, format!("{}\n", dumps(&Value::Object(latest), Style::indent(1)))) {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("{}: {}: {}", T, path.display(), e);
            1
        }
    }
}

/// One section of an .ini file: its keys in lower case, values trimmed. Lines starting # or ; are comments.
fn ini_section(text: &str, section: &str) -> Map<String, Value> {
    let mut found = Map::new();
    let mut inside = false;
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') || line.starts_with(';') {
            continue;
        }
        if line.starts_with('[') && line.ends_with(']') {
            inside = &line[1..line.len() - 1] == section;
            continue;
        }
        if !inside {
            continue;
        }
        if let Some(at) = line.find(|c| c == '=' || c == ':') {
            found.insert(line[..at].trim().to_lowercase(), Value::String(line[at + 1..].trim().to_string()));
        }
    }
    found
}
