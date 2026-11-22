//! JSON written the way these tools always wrote it, byte for byte, so a file made by a helper is the same file the
//! older script made: the indent, ", " and ": " between items, non-ASCII either kept or written as \uXXXX, and
//! numbers in the same form. Reading is serde_json's, with keys kept in file order.
use serde_json::Value;

#[derive(Clone, Copy)]
pub struct Style {
    /// None: one line. Some(n): a line per item, n spaces per level.
    pub indent: Option<usize>,
    /// true: every character above "~" as \uXXXX (U+007F too; surrogate pairs above U+FFFF).
    pub ensure_ascii: bool,
    pub sort_keys: bool,
    /// Between items and between key and value when on one line: (", ", ": ") unless a tool asks for compact.
    pub item_sep: &'static str,
    pub key_sep: &'static str,
}

impl Style {
    /// One line: {"a": 1, "b": [1, 2]}
    pub const LINE: Style = Style { indent: None, ensure_ascii: true, sort_keys: false, item_sep: ", ", key_sep: ": " };
    /// One line, no spaces: {"a":1,"b":[1,2]}
    pub const COMPACT: Style = Style { indent: None, ensure_ascii: true, sort_keys: false, item_sep: ",", key_sep: ":" };
    pub const fn indent(n: usize) -> Style {
        Style { indent: Some(n), ensure_ascii: true, sort_keys: false, item_sep: ",", key_sep: ": " }
    }
    pub const fn utf8(mut self) -> Style {
        self.ensure_ascii = false;
        self
    }
    pub const fn sorted(mut self) -> Style {
        self.sort_keys = true;
        self
    }
}

pub fn dumps(v: &Value, style: Style) -> String {
    let mut out = String::new();
    write(&mut out, v, style, 0);
    out
}

fn newline(out: &mut String, style: Style, level: usize) {
    if let Some(n) = style.indent {
        out.push('\n');
        for _ in 0..n * level {
            out.push(' ');
        }
    }
}

fn write(out: &mut String, v: &Value, style: Style, level: usize) {
    match v {
        Value::Null => out.push_str("null"),
        Value::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
        Value::Number(n) => out.push_str(&number(n)),
        Value::String(s) => string(out, s, style.ensure_ascii),
        Value::Array(a) => {
            if a.is_empty() {
                out.push_str("[]");
                return;
            }
            out.push('[');
            for (i, item) in a.iter().enumerate() {
                if i > 0 {
                    out.push_str(style.item_sep);
                }
                newline(out, style, level + 1);
                write(out, item, style, level + 1);
            }
            newline(out, style, level);
            out.push(']');
        }
        Value::Object(o) => {
            if o.is_empty() {
                out.push_str("{}");
                return;
            }
            out.push('{');
            let mut keys: Vec<&String> = o.keys().collect();
            if style.sort_keys {
                keys.sort();
            }
            for (i, k) in keys.iter().enumerate() {
                if i > 0 {
                    out.push_str(style.item_sep);
                }
                newline(out, style, level + 1);
                string(out, k, style.ensure_ascii);
                out.push_str(style.key_sep);
                write(out, &o[k.as_str()], style, level + 1);
            }
            newline(out, style, level);
            out.push('}');
        }
    }
}

fn string(out: &mut String, s: &str, ensure_ascii: bool) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{8}' => out.push_str("\\b"),
            '\u{c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c if ensure_ascii && (c as u32) > 0x7e => {
                let mut units = [0u16; 2];
                for u in c.encode_utf16(&mut units) {
                    out.push_str(&format!("\\u{:04x}", u));
                }
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

/// A number as the older scripts printed it: whole numbers plain; others the shortest digits that read back the
/// same, with an exponent only below 1e-4 or from 1e16 up ("1e+16", "1.5e-05").
pub fn number(n: &serde_json::Number) -> String {
    if let Some(i) = n.as_i64() {
        return i.to_string();
    }
    if let Some(u) = n.as_u64() {
        return u.to_string();
    }
    float(n.as_f64().unwrap_or(0.0))
}

pub fn float(f: f64) -> String {
    if f.is_nan() {
        return "NaN".into();
    }
    if f.is_infinite() {
        return if f > 0.0 { "Infinity".into() } else { "-Infinity".into() };
    }
    if f == 0.0 {
        return if f.is_sign_negative() { "-0.0".into() } else { "0.0".into() };
    }
    // shortest round-trip digits and the decimal exponent, from Rust's own {:e} ("1.2345e-7")
    let e = format!("{:e}", f);
    let (mantissa, exp) = e.split_once('e').unwrap();
    let exp: i32 = exp.parse().unwrap();
    let neg = mantissa.starts_with('-');
    let digits: String = mantissa.chars().filter(|c| c.is_ascii_digit()).collect();
    let mut s = String::new();
    if neg {
        s.push('-');
    }
    if (-4..16).contains(&exp) {
        if exp < 0 {
            s.push_str("0.");
            for _ in 0..(-exp - 1) {
                s.push('0');
            }
            s.push_str(&digits);
        } else {
            let point = exp as usize + 1;
            if digits.len() <= point {
                s.push_str(&digits);
                for _ in digits.len()..point {
                    s.push('0');
                }
                s.push_str(".0");
            } else {
                s.push_str(&digits[..point]);
                s.push('.');
                s.push_str(&digits[point..]);
            }
        }
    } else {
        s.push_str(&digits[..1]);
        if digits.len() > 1 {
            s.push('.');
            s.push_str(&digits[1..]);
        }
        s.push('e');
        s.push(if exp < 0 { '-' } else { '+' });
        s.push_str(&format!("{:02}", exp.abs()));
    }
    s
}

/// Half to even, as the older scripts rounded (2.5 → 2, 3.5 → 4).
pub fn round_half_even(f: f64) -> i64 {
    let floor = f.floor();
    let diff = f - floor;
    let r = if diff > 0.5 {
        floor + 1.0
    } else if diff < 0.5 {
        floor
    } else if (floor as i64) % 2 == 0 {
        floor
    } else {
        floor + 1.0
    };
    r as i64
}

/// What printing a value gave: a string bare, true/false/None capitalised, a list or object in one-line form.
pub fn print_form(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Bool(true) => "True".into(),
        Value::Bool(false) => "False".into(),
        Value::Null => "None".into(),
        Value::Number(n) => number(n),
        other => dumps(other, Style::LINE.utf8()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn forms() {
        let v = json!({"a": 1, "b": [1, 2.5, "é\n"], "c": {}, "d": []});
        assert_eq!(dumps(&v, Style::LINE), ["{\"a\": 1, \"b\": [1, 2.5, \"", "\\", "u00e9", "\\", "n\"], \"c\": {}, \"d\": []}"].concat());
        assert_eq!(dumps(&v, Style::indent(1).utf8()), "{\n \"a\": 1,\n \"b\": [\n  1,\n  2.5,\n  \"é\\n\"\n ],\n \"c\": {},\n \"d\": []\n}");
        assert_eq!(dumps(&json!("😀"), Style::LINE), "\"\\ud83d\\ude00\"");
    }

    #[test]
    fn floats() {
        for (f, s) in [(1.0, "1.0"), (0.1, "0.1"), (1e16, "1e+16"), (1.5e-5, "1.5e-05"), (123456789.125, "123456789.125"),
            (0.0001, "0.0001"), (1e15, "1000000000000000.0"), (-2.5e20, "-2.5e+20")] {
            assert_eq!(float(f), s);
        }
        assert_eq!(round_half_even(2.5), 2);
        assert_eq!(round_half_even(3.5), 4);
        assert_eq!(round_half_even(140.4), 140);
    }
}
