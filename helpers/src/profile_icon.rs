//! profile-icon: an app's icon with its plate tinted in a colour and a name on a band below (Mac).
//!   x4h profile-icon <the app's .icns> <name> <out .icns> [hue]
//! Each copy of AWD in the Dock says which it is: colour and words. The colour is oklch 0.62 0.14 at the hue; with
//! no hue given it comes from the name, by the same arithmetic the desk's bar uses for a profile.
//! Needs macOS's iconutil (it unpacks and packs the .icns) and a system font (SF, else Helvetica Bold).
use ab_glyph::{point, Font, FontVec, PxScale, ScaleFont, VariableFont};
use image::imageops::FilterType;
use image::{Rgba, RgbaImage};
use std::path::{Path, PathBuf};
use std::process::Command;
use x4_helpers::pyjson::round_half_even;

const T: &str = "profile-icon";

fn hue_of(name: &str) -> i64 {
    let mut h: i64 = 17;
    for c in name.chars() {
        h = (h * 31 + c as i64) % 360;
    }
    h
}

fn oklch_to_rgb(l: f64, c: f64, h: f64) -> [u8; 3] {
    let (a, b) = (c * h.to_radians().cos(), c * h.to_radians().sin());
    let l_ = (l + 0.3963377774 * a + 0.2158037573 * b).powi(3);
    let m_ = (l - 0.1055613458 * a - 0.0638541728 * b).powi(3);
    let s_ = (l - 0.0894841775 * a - 1.2914855480 * b).powi(3);
    let linear = [
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    ];
    linear.map(|x| {
        let x = x.clamp(0.0, 1.0);
        round_half_even(255.0 * if x <= 0.0031308 { 12.92 * x } else { 1.055 * x.powf(1.0 / 2.4) - 0.055 }) as u8
    })
}

fn font() -> Option<FontVec> {
    for (path, index) in [("/System/Library/Fonts/SFNS.ttf", 0u32), ("/System/Library/Fonts/Helvetica.ttc", 1)] {
        if let Ok(data) = std::fs::read(path) {
            if let Ok(mut f) = FontVec::try_from_vec_and_index(data, index) {
                f.set_variation(b"wght", 700.0); // SF is one file for every weight: Bold; no effect on Helvetica Bold
                return Some(f);
            }
        }
    }
    None
}

/// The name's width at a size, and its glyphs placed from x = 0 on the baseline y = 0.
fn layout(font: &FontVec, size: f32, name: &str) -> (f32, Vec<ab_glyph::Glyph>, f32, f32) {
    let scale = PxScale::from(size * font.height_unscaled() / font.units_per_em().unwrap_or(1000.0));
    let sf = font.as_scaled(scale);
    let (mut x, mut prev, mut glyphs) = (0.0f32, None, Vec::new());
    for c in name.chars() {
        let id = sf.glyph_id(c);
        if let Some(p) = prev {
            x += sf.kern(p, id);
        }
        glyphs.push(id.with_scale_and_position(scale, point(x, 0.0)));
        x += sf.h_advance(id);
        prev = Some(id);
    }
    (x, glyphs, sf.ascent(), -sf.descent())
}

fn draw(base: &RgbaImage, name: &str, hue: i64) -> RgbaImage {
    let colour = oklch_to_rgb(0.62, 0.14, hue as f64);
    let plate = oklch_to_rgb(0.30, 0.07, hue as f64); // dark enough that the zones still stand out
    let mut im = base.clone();
    let (w, h) = im.dimensions();
    // The plate is the icon's dark, grey part: tinted, its own shading kept.
    for px in im.pixels_mut() {
        let [r, g, b, a] = px.0;
        let (max, min) = (r.max(g).max(b), r.min(g).min(b));
        if a != 0 && max < 70 && max - min < 18 {
            let k = max as f64 / 40.0;
            let t = |p: u8| round_half_even(p as f64 * k).min(255) as u8;
            *px = Rgba([t(plate[0]), t(plate[1]), t(plate[2]), a]);
        }
    }
    // The name on a band across the foot of the plate, in the colour, cut to the plate's own rounded shape.
    let (mut left, mut top, mut right, mut bottom) = (w, h, 0u32, 0u32);
    for (x, y, px) in im.enumerate_pixels() {
        if px.0[3] != 0 {
            left = left.min(x);
            top = top.min(y);
            right = right.max(x + 1);
            bottom = bottom.max(y + 1);
        }
    }
    if right == 0 {
        return im;
    }
    let band_top = top + round_half_even((bottom - top) as f64 * 0.735) as u32;
    for y in band_top..(bottom + 1).min(h) {
        for x in left..(right + 1).min(w) {
            let px = im.get_pixel_mut(x, y);
            if px.0[3] != 0 {
                *px = Rgba([colour[0], colour[1], colour[2], px.0[3]]);
            }
        }
    }
    let Some(font) = font() else { return im };
    let mut size = round_half_even((bottom - band_top) as f64 * 0.62) as f32;
    let mut set = layout(&font, size, name);
    while set.0 > (right - left) as f32 * 0.84 && size > 8.0 {
        size -= 2.0;
        set = layout(&font, size, name);
    }
    let (width, glyphs, ascent, descent) = set;
    // centred on the band, the middle of the font's height on the band's middle, a little above (size × 0.04)
    let x0 = (left + right) as f32 / 2.0 - width / 2.0;
    let baseline = (band_top + bottom) as f32 / 2.0 - size * 0.04 + (ascent - descent) / 2.0;
    for mut g in glyphs {
        g.position = point(g.position.x + x0, baseline);
        if let Some(outline) = font.outline_glyph(g) {
            let bounds = outline.px_bounds();
            outline.draw(|gx, gy, cover| {
                let (x, y) = (bounds.min.x as i64 + gx as i64, bounds.min.y as i64 + gy as i64);
                if x < 0 || y < 0 || x >= w as i64 || y >= h as i64 {
                    return;
                }
                let px = im.get_pixel_mut(x as u32, y as u32);
                let c = cover.clamp(0.0, 1.0);
                let [r, g, b, a] = px.0;
                let mix = |p: u8| (p as f32 + (255.0 - p as f32) * c).round() as u8;
                *px = Rgba([mix(r), mix(g), mix(b), (a as f32 + (255.0 - a as f32) * c).round() as u8]);
            });
        }
    }
    im
}

fn iconutil(args: &[&std::ffi::OsStr]) -> bool {
    Command::new("iconutil").args(args).status().map(|s| s.success()).unwrap_or(false)
}

pub fn main(args: Vec<String>) -> i32 {
    if args.len() < 3 {
        eprintln!("{}: x4h {} <the app's .icns> <name> <out .icns> [hue]", T, T);
        return 2;
    }
    let (icns, name, out) = (Path::new(&args[0]), &args[1], Path::new(&args[2]));
    let hue = match args.get(3) {
        Some(h) => match h.parse::<i64>() {
            Ok(h) => h,
            Err(_) => {
                eprintln!("{}: {} is not a hue", T, h);
                return 1;
            }
        },
        None => hue_of(name),
    };
    let tmp: PathBuf = std::env::temp_dir().join(format!("x4h-profile-icon-{}", std::process::id()));
    let (src, dst) = (tmp.join("in.iconset"), tmp.join("out.iconset"));
    let code = (|| {
        if std::fs::create_dir_all(&dst).is_err() {
            eprintln!("{}: no work folder in {}", T, tmp.display());
            return 1;
        }
        if !iconutil(&["-c".as_ref(), "iconset".as_ref(), "-o".as_ref(), src.as_os_str(), icns.as_os_str()]) {
            eprintln!("{}: iconutil could not unpack {}", T, icns.display());
            return 1;
        }
        let big = match image::open(src.join("icon_512x512@2x.png")) {
            Ok(i) => draw(&i.to_rgba8(), name, hue),
            Err(e) => {
                eprintln!("{}: icon_512x512@2x.png: {}", T, e);
                return 1;
            }
        };
        let Ok(entries) = std::fs::read_dir(&src) else { return 1 };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("png") {
                continue;
            }
            let Ok((w, h)) = image::image_dimensions(&path) else { continue };
            let sized = if (w, h) == big.dimensions() { big.clone() } else { image::imageops::resize(&big, w, h, FilterType::Lanczos3) };
            if let Err(e) = sized.save(dst.join(entry.file_name())) {
                eprintln!("{}: {}: {}", T, entry.file_name().to_string_lossy(), e);
                return 1;
            }
        }
        if !iconutil(&["-c".as_ref(), "icns".as_ref(), "-o".as_ref(), out.as_os_str(), dst.as_os_str()]) {
            eprintln!("{}: iconutil could not pack {}", T, out.display());
            return 1;
        }
        0
    })();
    let _ = std::fs::remove_dir_all(&tmp);
    code
}
