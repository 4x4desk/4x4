//! check: this repository's own check, the one every pull request runs (.github/workflows/check.yml).
//!   x4h check [<folder>]      the repository's root; the current folder when none is given
//! From a clone it is run as tools/check, which names the root itself.
//!
//! All of these must pass:
//!   1. every relative link, src and href in Markdown and HTML (and every import in JS and CSS, every icon and
//!      start_url in a manifest.json) resolves to a file in the repository;
//!   2. no file over 1 MB, no .DS_Store;
//!   3. every .js and .mjs file parses (node --check), when node is installed;
//!   4. the labels the issue forms and the triage workflow use are all in .github/labels.yml.
//! Prints PASS or FAIL with one line per problem; exit 1 on FAIL.
//!
//! Not looked at: .git, node_modules, and a Rust build folder (a `target` beside a Cargo.toml: building these
//! helpers makes one, and git ignores it).
//!
//! The links are found by reading the text the way a careful person would, with no pattern library, so this adds
//! no crate: each finder below says the shape it looks for.
use std::path::Path;
use std::process::Command;
use x4_helpers::util;

const MAX_BYTES: u64 = 1024 * 1024;
const SKIP_DIRS: &[&str] = &[".git", "node_modules"];
/// Folders made to be copied elsewhere: their links are checked from where a copy goes (a new folder inside the one named).
pub const TEMPLATES: &[(&str, &str)] = &[("apps/parts/starter", "apps")];

// ---- paths as text, parts joined by "/" ----

pub fn normpath(path: &str) -> String {
    let lead = if path.starts_with("//") && !path.starts_with("///") { 2 } else if path.starts_with('/') { 1 } else { 0 };
    let mut parts: Vec<&str> = Vec::new();
    for part in path.split('/') {
        if part.is_empty() || part == "." {
            continue;
        }
        if part != ".." || (lead == 0 && parts.is_empty()) || parts.last() == Some(&"..") {
            parts.push(part);
        } else if !parts.is_empty() {
            parts.pop();
        }
    }
    let out = format!("{}{}", "/".repeat(lead), parts.join("/"));
    if out.is_empty() { ".".to_string() } else { out }
}

pub fn join(a: &str, b: &str) -> String {
    if b.starts_with('/') {
        b.to_string()
    } else if a.is_empty() || a.ends_with('/') {
        format!("{}{}", a, b)
    } else {
        format!("{}/{}", a, b)
    }
}

pub fn dirname(p: &str) -> &str {
    let head = &p[..p.rfind('/').map_or(0, |i| i + 1)];
    if !head.is_empty() && head.bytes().any(|b| b != b'/') { head.trim_end_matches('/') } else { head }
}

pub fn basename(p: &str) -> &str {
    &p[p.rfind('/').map_or(0, |i| i + 1)..]
}

/// A file name's ending in small letters, with its dot (".md"); "" when it has none (".gitignore" has none).
pub fn ending(p: &str) -> String {
    let name = basename(p);
    let first = name.len() - name.trim_start_matches('.').len();
    match name.rfind('.') {
        Some(dot) if dot >= first && first < name.len() => name[dot..].to_lowercase(),
        _ => String::new(),
    }
}

/// `path` as seen from the folder `start`, when `path` is that folder or inside it.
fn inside(path: &str, start: &str) -> String {
    let rest = path.strip_prefix(start).unwrap_or(path).trim_start_matches('/');
    if rest.is_empty() { ".".to_string() } else { rest.to_string() }
}

/// A folder as an absolute path in this form.
pub fn root_text(folder: &Path) -> String {
    let full = util::absolute(folder).to_string_lossy().into_owned();
    normpath(&if cfg!(windows) { full.replace('\\', "/") } else { full })
}

// ---- reading ----

/// A file's text with every line end as "\n"; None when it can't be read or isn't UTF-8.
pub fn read_text(path: &Path) -> Option<String> {
    let text = String::from_utf8(std::fs::read(path).ok()?).ok()?;
    Some(if text.contains('\r') { text.replace("\r\n", "\n").replace('\r', "\n") } else { text })
}

pub fn is_space(c: char) -> bool {
    c.is_whitespace() || ('\x1c'..='\x1f').contains(&c)
}

fn is_word(c: char) -> bool {
    c.is_alphanumeric() || c == '_'
}

fn is_quote(c: char) -> bool {
    c == '"' || c == '\''
}

/// The first place at or after `i` where `keep` stops being true.
fn skip(t: &[char], mut i: usize, keep: impl Fn(char) -> bool) -> usize {
    while i < t.len() && keep(t[i]) {
        i += 1;
    }
    i
}

fn at(t: &[char], i: usize, word: &str) -> bool {
    word.chars().enumerate().all(|(k, c)| t.get(i + k) == Some(&c))
}

fn text_of(t: &[char]) -> String {
    t.iter().collect()
}

/// Tries `find` at the start of each line in turn. It answers what it found and where that ended; the search goes on
/// from the next line that starts at or after there.
fn each_line(t: &[char], mut find: impl FnMut(usize) -> Option<(String, usize)>) -> Vec<String> {
    let (mut found, mut p) = (Vec::new(), 0);
    loop {
        let mut from = p;
        if let Some((said, end)) = find(p) {
            found.push(said);
            if end > p && (end == 0 || t.get(end - 1) == Some(&'\n')) {
                p = end;
                continue;
            }
            from = end.max(p);
        }
        match (from..t.len()).find(|&i| t[i] == '\n') {
            Some(i) => p = i + 1,
            None => return found,
        }
    }
}

/// The text without what sits between `open` and the first `close` after it (the two included).
fn without(t: &[char], open: &str, close: &str) -> Vec<char> {
    let (mut out, mut i, n) = (Vec::with_capacity(t.len()), 0, open.chars().count());
    while i < t.len() {
        if at(t, i, open) {
            if let Some(j) = (i + n..t.len()).find(|&j| at(t, j, close)) {
                i = j + close.chars().count();
                continue;
            }
        }
        out.push(t[i]);
        i += 1;
    }
    out
}

// ---- Markdown ----

/// Markdown without its code: fenced blocks (a line that starts ``` or ~~~, up to the end of the next line that
/// starts the same way), then `inline code` on one line.
fn strip_md_code(t: &[char]) -> Vec<char> {
    let (mut out, mut i) = (Vec::with_capacity(t.len()), 0);
    while i < t.len() {
        if (i == 0 || t[i - 1] == '\n') && (at(t, i, "```") || at(t, i, "~~~")) {
            let fence = text_of(&t[i..i + 3]);
            if let Some(j) = (i + 3..t.len()).find(|&j| t[j - 1] == '\n' && at(t, j, &fence)) {
                i = skip(t, j + 3, |c| c != '\n');
                continue;
            }
        }
        out.push(t[i]);
        i += 1;
    }
    let (t, mut out, mut i) = (out, Vec::new(), 0);
    while i < t.len() {
        if t[i] == '`' {
            let j = skip(&t, i + 1, |c| c != '`' && c != '\n');
            if t.get(j) == Some(&'`') {
                i = j + 1;
                continue;
            }
        }
        out.push(t[i]);
        i += 1;
    }
    out
}

/// A link or picture that starts with the "[" at `i`: [words](target), [words](<target>), [words](target "title").
fn md_link_at(t: &[char], i: usize) -> Option<(String, usize)> {
    let close = skip(t, i + 1, |c| c != ']');
    if t.get(close) != Some(&']') || t.get(close + 1) != Some(&'(') {
        return None;
    }
    let a = skip(t, close + 2, is_space);
    // the target may sit in <…>; when that reading fails, the "<" is read as the target's first character
    let starts = [if t.get(a) == Some(&'<') { Some(a + 1) } else { None }, Some(a)];
    for start in starts.into_iter().flatten() {
        let end = skip(t, start, |c| c != ')' && c != '>' && !is_space(c));
        if end == start {
            continue;
        }
        let after = if t.get(end) == Some(&'>') { end + 1 } else { end };
        let mut z = skip(t, after, is_space);
        if z > after && t.get(z) == Some(&'"') {
            let q = skip(t, z + 1, |c| c != '"');
            if q >= t.len() {
                continue;
            }
            z = skip(t, q + 1, is_space);
        }
        if t.get(z) == Some(&')') {
            return Some((text_of(&t[start..end]), z + 1));
        }
    }
    None
}

fn md_links(t: &[char]) -> Vec<String> {
    let (mut found, mut i) = (Vec::new(), 0);
    while i < t.len() {
        match if t[i] == '[' { md_link_at(t, i) } else { None } {
            Some((said, end)) => {
                found.push(said);
                i = end;
            }
            None => i += 1,
        }
    }
    found
}

/// Reference definitions: a line that reads `[name]: target`.
fn md_definitions(t: &[char]) -> Vec<String> {
    each_line(t, |p| {
        let a = skip(t, p, is_space);
        if t.get(a) != Some(&'[') {
            return None;
        }
        let close = skip(t, a + 1, |c| c != ']');
        if close == a + 1 || t.get(close) != Some(&']') || t.get(close + 1) != Some(&':') {
            return None;
        }
        let start = skip(t, close + 2, is_space);
        let end = skip(t, start, |c| !is_space(c));
        (end > start).then(|| (text_of(&t[start..end]), end))
    })
}

/// src="…" and href="…" (either quote), where the word starts on its own.
fn src_href(t: &[char]) -> Vec<String> {
    let (mut found, mut i) = (Vec::new(), 0);
    while i < t.len() {
        let word = if i > 0 && is_word(t[i - 1]) { 0 } else if at(t, i, "src") { 3 } else if at(t, i, "href") { 4 } else { 0 };
        if word > 0 {
            let eq = skip(t, i + word, is_space);
            if t.get(eq) == Some(&'=') {
                let q = skip(t, eq + 1, is_space);
                if t.get(q).copied().is_some_and(is_quote) {
                    let end = skip(t, q + 1, |c| !is_quote(c));
                    if end > q + 1 && end < t.len() {
                        found.push(text_of(&t[q + 1..end]));
                        i = end + 1;
                        continue;
                    }
                }
            }
        }
        i += 1;
    }
    found
}

// ---- JavaScript ----

/// A quoted name at `q`: where its text starts and ends.
fn quoted(t: &[char], q: usize) -> Option<(usize, usize)> {
    if !t.get(q).copied().is_some_and(is_quote) {
        return None;
    }
    let end = skip(t, q + 1, |c| !is_quote(c));
    (end > q + 1 && end < t.len()).then_some((q + 1, end))
}

/// `import … from "x"` and then `import "x"`, each where a line starts with it.
fn js_imports(t: &[char]) -> Vec<String> {
    let mut found = each_line(t, |p| {
        let a = skip(t, p, is_space);
        if !at(t, a, "import") || !t.get(a + 6).copied().is_some_and(is_space) {
            return None;
        }
        // the nearest `from "x"` with no quote before it
        let mut q = a + 7;
        loop {
            if at(t, q, "from") {
                if let Some((start, end)) = quoted(t, skip(t, q + 4, is_space)) {
                    return Some((text_of(&t[start..end]), end + 1));
                }
            }
            if q >= t.len() || is_quote(t[q]) {
                return None;
            }
            q += 1;
        }
    });
    found.extend(each_line(t, |p| {
        let a = skip(t, p, is_space);
        if !at(t, a, "import") {
            return None;
        }
        let (start, end) = quoted(t, skip(t, a + 6, is_space))?;
        Some((text_of(&t[start..end]), end + 1))
    }));
    found
}

// ---- CSS ----

/// `@import "x"` and `@import url(x)`, then every `url(x)`.
fn css_refs(t: &[char]) -> Vec<String> {
    let name = |c: char| !is_quote(c) && c != ')' && c != ';' && !is_space(c);
    // a name at `pos`, after spaces and one quote if there is one
    let named = |pos: usize| -> Option<(usize, usize)> {
        let a = skip(t, pos, is_space);
        let start = if t.get(a).copied().is_some_and(is_quote) { a + 1 } else { a };
        let end = skip(t, start, name);
        (end > start).then_some((start, end))
    };
    let (mut found, mut i) = (Vec::new(), 0);
    while i < t.len() {
        if at(t, i, "@import") {
            let x = skip(t, i + 7, is_space);
            let hit = if x == i + 7 {
                None
            } else if at(t, x, "url(") {
                named(x + 4).or_else(|| named(x))
            } else {
                named(x)
            };
            if let Some((start, end)) = hit {
                found.push(text_of(&t[start..end]));
                i = end;
                continue;
            }
        }
        i += 1;
    }
    i = 0;
    while i < t.len() {
        match if at(t, i, "url(") { css_url_at(t, i + 4) } else { None } {
            Some((said, end)) => {
                found.push(said);
                i = end;
            }
            None => i += 1,
        }
    }
    found
}

/// What a `url(` holds, from just after the bracket: everything up to the closing quote or bracket. Spaces before
/// it and one opening quote are left out when the rest still reads as a whole url(…); if not, they count as part of it.
fn css_url_at(t: &[char], x: usize) -> Option<(String, usize)> {
    let spaces = skip(t, x, is_space);
    for a in (x..=spaces).rev() {
        let starts = [if t.get(a).copied().is_some_and(is_quote) { Some(a + 1) } else { None }, Some(a)];
        for start in starts.into_iter().flatten() {
            let end = skip(t, start, |c| !is_quote(c) && c != ')');
            if end == start {
                continue;
            }
            let after = if t.get(end).copied().is_some_and(is_quote) { skip(t, end + 1, is_space) } else { end };
            if t.get(after) == Some(&')') {
                return Some((text_of(&t[start..end]), after + 1));
            }
        }
    }
    None
}

// ---- what a file points at ----

/// A full address (scheme:), an anchor on the page (#…) or a //host address: not a file here.
fn elsewhere(r: &str) -> bool {
    if r.starts_with('#') || r.starts_with("//") {
        return true;
    }
    let mut chars = r.chars();
    if !chars.next().is_some_and(|c| c.is_ascii_alphabetic()) {
        return false;
    }
    chars.find(|c| !(c.is_ascii_alphanumeric() || "+.-".contains(*c))) == Some(':')
}

/// The relative references a file makes: (what it says, the file it must be). `root` is the tree's root and `path`
/// the file's place in it, both as text with "/" between parts. The file is None when the reference can't be read
/// at all (a manifest.json that isn't JSON). `templates` are (folder, where its copies go).
pub fn refs(root: &str, path: &str, text: &str, templates: &[(String, String)]) -> Vec<(String, Option<String>)> {
    let ext = ending(path);
    let t: Vec<char> = text.chars().collect();
    let mut found: Vec<String> = Vec::new();
    match ext.as_str() {
        ".md" => {
            let body = strip_md_code(&t);
            found.extend(md_links(&body));
            found.extend(md_definitions(&body));
            found.extend(src_href(&body));
        }
        ".html" | ".htm" => found.extend(src_href(&without(&t, "<!--", "-->"))),
        ".js" | ".mjs" => found.extend(js_imports(&t)),
        ".css" => found.extend(css_refs(&without(&t, "/*", "*/"))),
        _ if basename(path) == "manifest.json" => {
            let Ok(data) = serde_json::from_str::<serde_json::Value>(text) else {
                return vec![("(not valid JSON)".to_string(), None)];
            };
            for icon in data.get("icons").and_then(|i| i.as_array()).into_iter().flatten() {
                if icon.is_object() {
                    found.push(icon.get("src").and_then(|s| s.as_str()).unwrap_or("").to_string());
                }
            }
            found.extend(data.get("start_url").and_then(|s| s.as_str()).filter(|s| !s.is_empty()).map(str::to_string));
        }
        _ => {}
    }
    let mut out = Vec::new();
    for r in found {
        if elsewhere(&r) || r.contains("${") {
            continue;   // a full address, an anchor on the page, or a template filled at run time
        }
        let target = r.split('#').next().unwrap_or("").split('?').next().unwrap_or("");
        if target.is_empty() {
            continue;
        }
        if target.starts_with('/') {
            let file = normpath(&join(root, target.trim_start_matches('/')));
            out.push((r, Some(file)));
            continue;
        }
        let here = dirname(path);
        // a folder made to be copied: checked where its copies go
        let template = templates.iter().map(|(tpl, into)| (tpl.trim_end_matches('/'), into)).find(|(tpl, _)| path.starts_with(&format!("{}/", tpl)));
        let rel = match template {
            Some((tpl, into)) => {
                let copy = join(into, "a-new-app");
                let rel = normpath(&join(&join(&copy, &inside(here, tpl)), target));
                if rel == copy || rel.starts_with(&format!("{}/", copy)) {
                    join(tpl, &inside(&rel, &copy))   // inside the copy: the template's own file
                } else {
                    rel
                }
            }
            None => join(here, target),
        };
        let file = normpath(&join(root, &rel));
        out.push((r, Some(file)));
    }
    out
}

/// True when `file` (from refs) is the root or inside it.
pub fn in_tree(root: &str, file: &str) -> bool {
    file == root || file.starts_with(&format!("{}/", root))
}

// ---- the files ----

/// Every file under `root`, as paths from it, in order. Left out: folders named in `skip`, and a Rust build folder
/// (a `target` beside a Cargo.toml).
pub fn files(root: &str, skip: &[&str]) -> Vec<String> {
    fn walk(root: &str, rel: &str, skip: &[&str], out: &mut Vec<String>) {
        let dir = if rel.is_empty() { root.to_string() } else { join(root, rel) };
        let Ok(entries) = std::fs::read_dir(&dir) else { return };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let path = if rel.is_empty() { name.clone() } else { join(rel, &name) };
            let Ok(kind) = entry.file_type() else { continue };
            if kind.is_dir() {
                let build = name == "target" && Path::new(&dir).join("Cargo.toml").is_file();
                if !skip.contains(&name.as_str()) && !build {
                    walk(root, &path, skip, out);
                }
            } else if !(kind.is_symlink() && entry.path().is_dir()) {
                out.push(path);   // a link to a folder is neither a file nor followed
            }
        }
    }
    let mut out = Vec::new();
    walk(root, "", skip, &mut out);
    out.sort();
    out
}

/// A name in quotes, as the problem lines show it.
pub fn quote(s: &str) -> String {
    let q = if s.contains('\'') && !s.contains('"') { '"' } else { '\'' };
    let mut out = String::from(q);
    for c in s.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c == q => {
                out.push('\\');
                out.push(c);
            }
            c if (c as u32) < 0x20 || c as u32 == 0x7f => out.push_str(&format!("\\x{:02x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push(q);
    out
}

// ---- labels ----

/// Every `- name: "…"` in labels.yml.
fn label_names(t: &[char]) -> Vec<String> {
    each_line(t, |p| {
        let dash = skip(t, p, is_space);
        if t.get(dash) != Some(&'-') {
            return None;
        }
        let name = skip(t, dash + 1, is_space);
        if !at(t, name, "name:") {
            return None;
        }
        let q = skip(t, name + 5, is_space);
        if t.get(q) != Some(&'"') {
            return None;
        }
        let end = skip(t, q + 1, |c| c != '"');
        (end > q + 1 && end < t.len()).then(|| (text_of(&t[q + 1..end]), end + 1))
    })
}

/// Every "…" with something in it.
fn in_quotes(t: &[char]) -> Vec<String> {
    let (mut found, mut i) = (Vec::new(), 0);
    while i < t.len() {
        if t[i] == '"' {
            let end = skip(t, i + 1, |c| c != '"');
            if end > i + 1 && end < t.len() {
                found.push(text_of(&t[i + 1..end]));
                i = end + 1;
                continue;
            }
        }
        i += 1;
    }
    found
}

/// Every label an issue form or the triage workflow uses is defined in .github/labels.yml.
fn check_labels(root: &str, problems: &mut Vec<String>) {
    let chars = |path: String| read_text(Path::new(&path)).map(|s| s.chars().collect::<Vec<char>>());
    let Some(labels) = chars(join(root, ".github/labels.yml")) else { return };
    let known = label_names(&labels);
    let forms = join(root, ".github/ISSUE_TEMPLATE");
    let mut names: Vec<String> = std::fs::read_dir(&forms).into_iter().flatten().flatten().map(|e| e.file_name().to_string_lossy().into_owned()).collect();
    names.sort();
    for name in names {
        let Some(t) = chars(join(&forms, &name)) else { continue };
        // the first line that reads `labels: [ … ]`
        let list = each_line(&t, |p| {
            if !at(&t, p, "labels:") {
                return None;
            }
            let open = skip(&t, p + 7, is_space);
            if t.get(open) != Some(&'[') {
                return None;
            }
            let line_end = skip(&t, open + 1, |c| c != '\n');
            let close = (open + 1..line_end).rev().find(|&i| t[i] == ']')?;
            Some((text_of(&t[open + 1..close]), close + 1))
        });
        for label in list.first().map(|l| in_quotes(&l.chars().collect::<Vec<char>>())).unwrap_or_default() {
            if !known.contains(&label) {
                problems.push(format!(".github/ISSUE_TEMPLATE/{}: label {} is not in .github/labels.yml", name, quote(&label)));
            }
        }
    }
    let Some(t) = chars(join(root, ".github/workflows/triage.yml")) else { return };
    for key in ["AI_LABELS", "ALWAYS_LABELS"] {
        // the first line that reads `<key>: "a,b,c"`
        let list = each_line(&t, |p| {
            let a = skip(&t, p, is_space);
            if !at(&t, a, key) || t.get(a + key.len()) != Some(&':') {
                return None;
            }
            let q = skip(&t, a + key.len() + 1, is_space);
            if t.get(q) != Some(&'"') {
                return None;
            }
            let end = skip(&t, q + 1, |c| c != '"');
            (end < t.len()).then(|| (text_of(&t[q + 1..end]), end + 1))
        });
        for label in list.first().map(|l| l.split(',').map(|s| s.trim_matches(is_space).to_string()).collect::<Vec<_>>()).unwrap_or_default() {
            if !label.is_empty() && !known.contains(&label) {
                problems.push(format!(".github/workflows/triage.yml: {} label {} is not in .github/labels.yml", key, quote(&label)));
            }
        }
    }
}

// ---- the tool ----

pub fn main(args: Vec<String>) -> i32 {
    let root = root_text(Path::new(args.first().map(String::as_str).unwrap_or(".")));
    if !Path::new(&root).is_dir() {
        eprintln!("check: {} is not a folder", root);
        return 2;
    }
    let templates: Vec<(String, String)> = TEMPLATES.iter().map(|(a, b)| (a.to_string(), b.to_string())).collect();
    let files = files(&root, SKIP_DIRS);
    let node = Command::new("node").arg("--version").output().map(|o| o.status.success()).unwrap_or(false);
    let mut problems: Vec<String> = Vec::new();
    for rel in &files {
        let full = join(&root, rel);
        if basename(rel) == ".DS_Store" {
            problems.push(format!("{}: a .DS_Store", rel));
            continue;
        }
        let Ok(size) = std::fs::metadata(&full).map(|m| m.len()) else {
            problems.push(format!("{}: cannot be read (a link to a file that is not there?)", rel));
            continue;
        };
        if size > MAX_BYTES {
            problems.push(format!("{}: over 1 MB ({} bytes)", rel, size));
        }
        let ext = ending(rel);
        if node && (ext == ".js" || ext == ".mjs") {
            if let Ok(o) = Command::new("node").arg("--check").arg(&full).output() {
                if !o.status.success() {
                    let said = String::from_utf8_lossy(&o.stderr).into_owned();
                    let lines: Vec<&str> = said.trim().lines().collect();
                    let why = lines.iter().find(|l| l.contains("Error")).or(lines.first()).copied().unwrap_or("(no message)");
                    problems.push(format!("{}: does not parse ({})", rel, why.trim()));
                }
            }
        }
        if !matches!(ext.as_str(), ".md" | ".html" | ".htm" | ".js" | ".mjs" | ".css") && basename(rel) != "manifest.json" {
            continue;
        }
        let Some(text) = read_text(Path::new(&full)) else { continue };
        for (said, file) in refs(&root, rel, &text, &templates) {
            match file {
                None => problems.push(format!("{}: {}", rel, said)),
                Some(file) if !in_tree(&root, &file) => problems.push(format!("{}: {} points outside the repository", rel, said)),
                Some(file) if !Path::new(&file).exists() => problems.push(format!("{}: {} is not in the repository", rel, said)),
                Some(_) => {}
            }
        }
    }
    check_labels(&root, &mut problems);
    println!("{} files checked{}", files.len(), if node { "" } else { " (node not found: JavaScript syntax not checked)" });
    if !problems.is_empty() {
        println!("\nFAIL: {} problem{}", problems.len(), if problems.len() != 1 { "s" } else { "" });
        for p in &problems {
            println!("  {}", p);
        }
        return 1;
    }
    println!("PASS: every link resolves, no file over 1 MB, no .DS_Store{}, every label is defined", if node { ", every script parses" } else { "" });
    0
}
