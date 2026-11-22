//! A small HTTP server for local tools: one thread per connection, one request per connection. Enough for a
//! preview, a test page or a tool's own page on 127.0.0.1; not a server for the internet.
//!
//!   let listener = httpd::bind("127.0.0.1", 8047)?;
//!   httpd::serve(listener, |req| httpd::file_response(Path::new("site"), &req.path, &[]));
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{SocketAddr, TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::Arc;

pub struct Request {
    pub method: String,
    /// The path as sent, percent-decoded, without the query ("/a b/c.html").
    pub path: String,
    /// What followed "?", as sent ("" when none).
    pub query: String,
    /// Header names in lower case.
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
    pub peer: Option<SocketAddr>,
}

impl Request {
    pub fn header(&self, name: &str) -> Option<&str> {
        let name = name.to_ascii_lowercase();
        self.headers.iter().find(|(k, _)| *k == name).map(|(_, v)| v.as_str())
    }
    /// The query's pairs, decoded, in order.
    pub fn params(&self) -> Vec<(String, String)> {
        parse_query(&self.query)
    }
    pub fn param(&self, name: &str) -> Option<String> {
        self.params().into_iter().find(|(k, _)| k == name).map(|(_, v)| v)
    }
}

pub struct Response {
    pub status: u16,
    pub headers: Vec<(String, String)>,
    pub body: Body,
}

pub enum Body {
    Bytes(Vec<u8>),
    /// Written by the tool itself after the head has gone (an event stream): the connection closes when it returns.
    Stream(Box<dyn FnOnce(&mut TcpStream) + Send>),
}

impl Response {
    pub fn new(status: u16, content_type: &str, body: impl Into<Vec<u8>>) -> Response {
        Response { status, headers: vec![("Content-Type".into(), content_type.into())], body: Body::Bytes(body.into()) }
    }
    pub fn text(status: u16, body: impl Into<String>) -> Response {
        Response::new(status, "text/plain; charset=utf-8", body.into().into_bytes())
    }
    pub fn html(body: impl Into<String>) -> Response {
        Response::new(200, "text/html; charset=utf-8", body.into().into_bytes())
    }
    pub fn json(body: impl Into<String>) -> Response {
        Response::new(200, "application/json", body.into().into_bytes())
    }
    pub fn redirect(to: &str) -> Response {
        Response { status: 302, headers: vec![("Location".into(), to.into())], body: Body::Bytes(Vec::new()) }
    }
    pub fn stream(content_type: &str, write: impl FnOnce(&mut TcpStream) + Send + 'static) -> Response {
        Response { status: 200, headers: vec![("Content-Type".into(), content_type.into())], body: Body::Stream(Box::new(write)) }
    }
    pub fn with(mut self, name: &str, value: &str) -> Response {
        self.headers.push((name.into(), value.into()));
        self
    }
}

pub fn bind(host: &str, port: u16) -> std::io::Result<TcpListener> {
    TcpListener::bind((host, port))
}

/// Answers every connection on the listener with the handler, for ever.
pub fn serve<F>(listener: TcpListener, handler: F) -> !
where
    F: Fn(&Request) -> Response + Send + Sync + 'static,
{
    let handler = Arc::new(handler);
    loop {
        if let Ok((stream, peer)) = listener.accept() {
            let handler = Arc::clone(&handler);
            std::thread::spawn(move || {
                let _ = answer(stream, Some(peer), &*handler);
            });
        }
    }
}

fn answer(mut stream: TcpStream, peer: Option<SocketAddr>, handler: &dyn Fn(&Request) -> Response) -> std::io::Result<()> {
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut line = String::new();
    reader.read_line(&mut line)?;
    let mut parts = line.split_whitespace();
    let (Some(method), Some(target)) = (parts.next(), parts.next()) else { return Ok(()) };
    let (raw_path, query) = target.split_once('?').unwrap_or((target, ""));
    let mut headers = Vec::new();
    loop {
        let mut h = String::new();
        if reader.read_line(&mut h)? == 0 || h.trim_end().is_empty() {
            break;
        }
        if let Some((k, v)) = h.split_once(':') {
            headers.push((k.trim().to_ascii_lowercase(), v.trim().to_string()));
        }
    }
    let length = headers.iter().find(|(k, _)| k == "content-length").and_then(|(_, v)| v.parse::<usize>().ok()).unwrap_or(0);
    let mut body = vec![0u8; length];
    reader.read_exact(&mut body)?;
    let req = Request { method: method.to_string(), path: percent_decode(raw_path), query: query.to_string(), headers, body, peer };
    let res = handler(&req);
    let mut head = format!("HTTP/1.1 {} {}\r\n", res.status, reason(res.status));
    for (k, v) in &res.headers {
        head.push_str(&format!("{}: {}\r\n", k, v));
    }
    head.push_str("Connection: close\r\n");
    match res.body {
        Body::Bytes(bytes) => {
            head.push_str(&format!("Content-Length: {}\r\n\r\n", bytes.len()));
            stream.write_all(head.as_bytes())?;
            if req.method != "HEAD" {
                stream.write_all(&bytes)?;
            }
        }
        Body::Stream(write) => {
            head.push_str("\r\n");
            stream.write_all(head.as_bytes())?;
            stream.flush()?;
            write(&mut stream);
        }
    }
    stream.flush()
}

fn reason(status: u16) -> &'static str {
    match status {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
        301 => "Moved Permanently",
        302 => "Found",
        304 => "Not Modified",
        400 => "Bad Request",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        413 => "Payload Too Large",
        500 => "Internal Server Error",
        501 => "Not Implemented",
        503 => "Service Unavailable",
        _ => "",
    }
}

pub fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 3 <= bytes.len() {
            if let Some(b) = std::str::from_utf8(&bytes[i + 1..i + 3]).ok().and_then(|h| u8::from_str_radix(h, 16).ok()) {
                out.push(b);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

pub fn parse_query(query: &str) -> Vec<(String, String)> {
    query.split('&').filter(|p| !p.is_empty()).map(|pair| {
        let (k, v) = pair.split_once('=').unwrap_or((pair, ""));
        (percent_decode(&k.replace('+', " ")), percent_decode(&v.replace('+', " ")))
    }).collect()
}

pub fn content_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).unwrap_or("").to_ascii_lowercase().as_str() {
        "html" | "htm" => "text/html; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "json" | "map" | "webmanifest" => "application/json",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "ico" => "image/x-icon",
        "txt" => "text/plain; charset=utf-8",
        "md" => "text/markdown; charset=utf-8",
        "xml" => "application/xml",
        "wasm" => "application/wasm",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "pdf" => "application/pdf",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
}

/// The file under `root` that a request path names, or None when the path would leave `root`.
/// A folder gives its index.html.
pub fn resolve(root: &Path, path: &str) -> Option<PathBuf> {
    let mut at = root.to_path_buf();
    for part in path.split('/') {
        match part {
            "" | "." => {}
            ".." => return None,
            p if p.contains('\\') || p.contains('\0') => return None,
            p => at.push(p),
        }
    }
    if at.is_dir() {
        at.push("index.html");
    }
    Some(at)
}

/// A file under `root` as a response (404 when it isn't there, 301 to add a folder's "/"), with the extra headers.
pub fn file_response(root: &Path, path: &str, extra: &[(&str, &str)]) -> Response {
    let Some(file) = resolve(root, path) else { return Response::text(404, "not found\n") };
    if !path.ends_with('/') && file.file_name().and_then(|n| n.to_str()) == Some("index.html") && !path.ends_with("index.html") {
        return Response { status: 301, headers: vec![("Location".into(), format!("{}/", path))], body: Body::Bytes(Vec::new()) };
    }
    match std::fs::File::open(&file).and_then(|mut f| {
        let mut bytes = Vec::new();
        f.read_to_end(&mut bytes).map(|_| bytes)
    }) {
        Ok(bytes) => {
            let mut res = Response::new(200, content_type(&file), bytes);
            for (k, v) in extra {
                res.headers.push((k.to_string(), v.to_string()));
            }
            res
        }
        Err(_) => Response::text(404, "not found\n"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decoding() {
        assert_eq!(percent_decode("/a%20b/c%2Fd"), "/a b/c/d");
        assert_eq!(percent_decode("%"), "%");
        assert_eq!(percent_decode("a%2"), "a%2");
        assert_eq!(percent_decode("%41"), "A");
        assert_eq!(parse_query("a=1&b=x+y&c"), vec![("a".into(), "1".into()), ("b".into(), "x y".into()), ("c".into(), "".into())]);
        assert!(resolve(Path::new("/tmp"), "/../etc/passwd").is_none());
    }
}
