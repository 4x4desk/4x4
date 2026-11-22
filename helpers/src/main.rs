//! x4h: 4x4's build helpers, one subcommand per tool. `x4h` alone lists them; README.md says what each is for.
mod json_tool;
mod make_levels;
mod profile_icon;
mod public_check;
mod release_file;
mod serve;
mod ui_lay;

type Tool = (&'static str, fn(Vec<String>) -> i32, &'static str);

const TOOLS: &[Tool] = &[
    ("check", public_check::main, "check a repository's files: links, sizes, scripts, labels"),
    ("json", json_tool::main, "read one value from a JSON file, for shell scripts"),
    ("latest-install", release_file::latest_install, "name a Mac installer package in a release's latest.json"),
    ("latest-json", release_file::latest_json, "print a release's latest.json for a file whose versions are given"),
    ("make-levels", make_levels::main, "write the AWD install level files, or set one artifact in them"),
    ("profile-icon", profile_icon::main, "tint an app's icon and write a name on it (Mac)"),
    ("release-file-pc", release_file::release_file_pc, "write latest.json beside a Windows installer or Linux tarball"),
    ("serve", serve::main, "serve a folder on a local port"),
    ("ui-lay", ui_lay::main, "lay a UI channel's files into an unpacked app"),
];

fn main() {
    let mut args: Vec<String> = std::env::args().skip(1).collect();
    if args.is_empty() || args[0] == "--help" || args[0] == "-h" {
        println!("x4h <tool> [arguments]");
        for (name, _, what) in TOOLS {
            println!("  {:<18} {}", name, what);
        }
        std::process::exit(if args.is_empty() { 2 } else { 0 });
    }
    let name = args.remove(0);
    match TOOLS.iter().find(|t| t.0 == name) {
        Some((_, run, _)) => std::process::exit(run(args)),
        None => {
            eprintln!("x4h: no tool {} (x4h alone lists them)", name);
            std::process::exit(2);
        }
    }
}
