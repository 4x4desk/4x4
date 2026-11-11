# The look

4x4 has one look for the website, the desk and every app: warm sand, burnt orange, sage and ink, with a golden-hour light theme and a last-light dark one. Calm and capable, with clear hierarchy and room to breathe. A new app doesn't get a theme of its own.

## The rules a builder needs

- **Use the look's variables, not colours.** Surfaces `--bg`, `--panel`, `--line`; text `--ink`, `--muted`; actions `--accent`. `--ok`, `--warn`, `--bad` and `--info` mean a state, never decoration. They come from [`apps/parts/look.css`](../apps/parts/look.css), which is generated: don't edit it.
- **Light and dark come free.** The same names change with the computer's setting or the person's pick. Check every screen in both.
- **Sizes follow the person.** Lengths are `calc(N * var(--u))` and text `calc(N * var(--t))`, so the person's size settings scale your app with the desk.
- **No text under 16px**, captions and badges included. Reading text is 18 to 20px. If it doesn't fit, cut words or give it room. Secondary text is softer, not smaller.
- **Big monitors first.** Readable at a distance, with resizable panels and visible splitters, and still working in a small window.
- **Native controls stay native.** Style `button`, `input` and `select`; don't replace them. No framework, no build step.
- **Every press is answered** on screen, so nothing looks stalled.
- **Reuse a part before making one.** They're all in [`apps/parts/`](../apps/parts/), shown on one page.

Next: [how we work](how-we-work.md).
