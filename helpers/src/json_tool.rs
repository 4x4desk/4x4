//! json: one value out of a JSON file, for a shell script that needs a field.
//!   x4h json get <file|-> <key> [<key>…]      the value at that path; a string bare, anything else as JSON
//!   x4h json get --or <text> <file|-> <key>…  <text> when the path isn't there (instead of failing)
//! A key that is a whole number indexes a list. Exit 1 when the file isn't JSON or the path isn't there.
use serde_json::Value;
use std::io::Read;
use x4_helpers::pyjson;

pub fn main(mut args: Vec<String>) -> i32 {
    if args.first().map(String::as_str) != Some("get") {
        eprintln!("json: x4h json get [--or <text>] <file|-> <key> [<key>…]");
        return 2;
    }
    args.remove(0);
    let mut or: Option<String> = None;
    if args.first().map(String::as_str) == Some("--or") && args.len() >= 2 {
        or = Some(args[1].clone());
        args.drain(0..2);
    }
    if args.is_empty() {
        eprintln!("json: no file");
        return 2;
    }
    let file = args.remove(0);
    let mut text = String::new();
    let read = if file == "-" {
        std::io::stdin().read_to_string(&mut text).map(|_| ())
    } else {
        std::fs::read_to_string(&file).map(|t| text = t)
    };
    if let Err(e) = read {
        eprintln!("json: {}: {}", file, e);
        return 1;
    }
    let root: Value = match serde_json::from_str(&text) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("json: {}: {}", file, e);
            return 1;
        }
    };
    let mut at = &root;
    for key in &args {
        let next = match at {
            Value::Object(o) => o.get(key),
            Value::Array(a) => key.parse::<usize>().ok().and_then(|i| a.get(i)),
            _ => None,
        };
        match next {
            Some(v) => at = v,
            None => {
                if let Some(text) = or {
                    println!("{}", text);
                    return 0;
                }
                eprintln!("json: {}: no {}", file, args.join("."));
                return 1;
            }
        }
    }
    println!("{}", pyjson::print_form(at));
    0
}
