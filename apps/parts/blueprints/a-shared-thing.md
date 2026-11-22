# Blueprint: one thing on several computers, and between people

Written from the shared list (`tools/parts-test`'s kept app, made by a fresh agent from the parts README, 2026-11-19), used on two test computers and between two people's computers.

## Choose this when
The person wants the same thing on their other computers, or with someone they let in: a shopping list, a board, a plan, a game. For what stays on this computer alone, `data-on-this-computer.md` is simpler.

## The shape
- The app is in the person's apps folder like any other, with `"reach": ["127.0.0.1"]` in `manifest.json` and `import { shared } from '../parts/shared.js'`. In a zone, `shared()` puts the copy served by 4x4's peer-to-peer service in front by itself.
- **A shared thing is a conversation of its own.** `s.start(name, [computers and people])` makes one; `s.all()` lists this app's; `s.open(id)` gives one.
- **Every change is a line, and lines are never changed.** `t.say('Milk', 'add')`, then `t.say(key, 'done')`, `t.say(key, 'remove')`: the second word is the app's own name for what the line is. The screen is worked out by reading all the lines in order.
- **Draw on every change:** `s.on('change', draw)`, and `draw` reads `t.lines()` again. A line from another computer arrives the same way as one from here.
- **Talk beside it:** a `<…-thread>` shows the lines with `what === 'say'`; `thread.send = text => t.say(text)`.
- **People:** `s.people()` beside `s.devices()`. On their side nothing shows until they say yes: show `s.asks()` as a notice with Allow and No.
- **Present or work together:** two keys, `t.choose('present')` and `t.choose('together')`; `t.how(lines)` says which is in force. While someone else presents, draw the thing read-only and say who.

## Watch for
- A line written while a computer is off reaches it when it is back: never assume the other side has seen it.
- Two people can tick the same thing at once: both lines are kept, and the last one read wins. Make each line mean one thing ("done", "undone"), never "toggle".
- Opened while the peer-to-peer service is down, the page says so and tries again by itself; `s.on('down')` and `s.on('up')` for a page already open.

## Instead
- Nothing to share: `data()`.
- One big text typed by several at once (a note): Shared notes, which merges letters, not lines.
