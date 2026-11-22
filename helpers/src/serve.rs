//! serve: a folder on a local port, for looking at a built site or an app before it is published.
//!   x4h serve <folder> [<port>] [--host <address>] [--cors]     default port 8000, host 127.0.0.1
//! Every answer says Cache-Control: no-store, so a reload always shows the file on disk. A folder with no
//! index.html answers with a list of what is in it. --cors adds Access-Control-Allow-Origin: * (files any page
//! may read, as an apps origin of its own gives them). Stop it with Ctrl-C.
use std::path::{Path, PathBuf};
use x4_helpers::httpd::{self, Response};

/// A folder's entries as a page of links, folders first marked with a "/".
fn listing(dir: &Path, path: &str) -> Response {
    let mut names: Vec<String> = match std::fs::read_dir(dir) {
        Ok(entries) => entries.flatten().map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            if e.path().is_dir() { format!("{}/", name) } else { name }
        }).collect(),
        Err(_) => return Response::text(404, "not found\n"),
    };
    names.sort_by_key(|n| n.to_lowercase());
    let esc = |s: &str| s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;");
    let mut html = format!("<!doctype html>\n<meta charset=\"utf-8\">\n<title>{0}</title>\n<h1>{0}</h1>\n<ul>\n", esc(path));
    for n in names {
        let href: String = n.bytes().map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' | b'/' => (b as char).to_string(),
            _ => format!("%{:02X}", b),
        }).collect();
        html.push_str(&format!("<li><a href=\"{}\">{}</a></li>\n", href, esc(&n)));
    }
    html.push_str("</ul>\n");
    Response::html(html)
}

pub fn main(args: Vec<String>) -> i32 {
    let (mut host, mut cors, mut rest) = ("127.0.0.1".to_string(), false, Vec::new());
    let mut it = args.into_iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--host" | "--bind" => host = it.next().unwrap_or(host),
            "--cors" => cors = true,
            _ => rest.push(a),
        }
    }
    let Some(folder) = rest.first().map(PathBuf::from) else {
        eprintln!("serve: x4h serve <folder> [<port>] [--host <address>] [--cors]");
        return 2;
    };
    if !folder.is_dir() {
        eprintln!("serve: {} is not a folder", folder.display());
        return 1;
    }
    let port = match rest.get(1).map(|p| p.parse::<u16>()) {
        None => 8000,
        Some(Ok(p)) => p,
        Some(Err(_)) => {
            eprintln!("serve: {} is not a port", rest[1]);
            return 2;
        }
    };
    let listener = match httpd::bind(&host, port) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("serve: {}:{}: {}", host, port, e);
            return 1;
        }
    };
    println!("serve: {} on http://{}:{}/", folder.display(), host, port);
    httpd::serve(listener, move |req| {
        if req.method != "GET" && req.method != "HEAD" {
            return Response::text(405, "GET only\n");
        }
        let mut extra = vec![("Cache-Control", "no-store")];
        if cors {
            extra.push(("Access-Control-Allow-Origin", "*"));
        }
        // a folder with no index.html: its list (asked with the "/" at its end, so the links in it resolve)
        if let Some(at) = httpd::resolve(&folder, &req.path) {
            if at.file_name().and_then(|n| n.to_str()) == Some("index.html") && !at.is_file() {
                if let Some(dir) = at.parent().filter(|d| d.is_dir() && !req.path.ends_with("index.html")) {
                    if !req.path.ends_with('/') {
                        return Response::redirect(&format!("{}/", req.path));
                    }
                    let mut res = listing(dir, &req.path);
                    for (k, v) in &extra {
                        res.headers.push((k.to_string(), v.to_string()));
                    }
                    return res;
                }
            }
        }
        httpd::file_response(&folder, &req.path, &extra)
    })
}
