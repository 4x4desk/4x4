// What an app shares: const s = await shared()
// The other half of data() (parts.js): data() is what an app keeps on this computer, shared() is what it keeps with
// the person's other computers. A shared thing (a list, a board, a game) is a conversation of its own, kept on every
// computer in it by x4-p2p: every change is one line, signed, in order, and a line written while another computer
// is off reaches it when it is back (apps/parts/p2p/README.md › talks.js; services/p2p README › Talks). So the app
// never sends or merges anything: it says a line, and draws from the lines.
//
// These are same-origin calls to this computer's x4-p2p; below, "where the app lives", is how an app gets there.
//
//   const s = await shared('lists')      the app's own word, so its things are told from other apps'; default: the
//                                        folder's name.
//   s.me                                 this computer's name
//   await s.devices()                    the person's other computers: [{ id, name, online, path }] (named/people.js
//                                        fill() draws them)
//   await s.all()                        this app's shared things, newest first: [{ id, name, members, unread, last }]
//   await s.start('Groceries', devices)  a new one with those computers → its id. The others have it at once (its
//                                        first line, what: 'start', is said for the app; skip it when drawing)
//   const t = s.open(id)
//   await t.lines()                      [{ key, from, mine, at, text, what }], oldest first. `what` is the app's own
//                                        word for the line ('add', 'done', 'say'…); '' for a line some other page
//                                        wrote there (Text chat shows every conversation, this one too)
//   await t.say(text, what = 'say')      one line, kept and sent. A line is never changed or taken back: to tick or
//                                        remove a thing, say another line about it (what: 'done', text: its key)
//   await t.file(file, what = 'file')    a File as a line: kept by its hash, its picture at `/api/file/<hash>`; a line's
//                                        `file` is { hash, name, size } (blueprints/files.md)
//   t.read()                             the person has seen it: its unread count goes
//   s.on('change', fn)                   something changed somewhere (a line arrived, a computer came or went):
//                                        read all() and lines() again. Returns s.
//   s.on('down', fn), s.on('up', fn)     x4-p2p stopped answering, and answers again: say so on the page, then read
//                                        again. (x4-p2p serves the page itself, so a page opened while it is down
//                                        does not load at all; these are for a page already open.)
//
// With other people (a person in the Circle: _talk/2026-11-20-people-reach.md). A person is not one of your computers:
// they reach a thing only when you put them in it, and only once they allow your app.
//   await s.people()                     people in the Circle: [{ id, name, kind, online }]; start() takes them
//                                        beside devices (start('Groceries', [ada, bosComputer]))
//   await s.asks()                       what people offered this app and is waiting for a yes: [{ from, name, what }]
//                                        (what: the thing's name); nothing of it is kept or shown until then
//   await s.allow(from), s.deny(from)    yes to that person for this app (every waiting thing and later ones), or no
//
// Present or work together, the person's choice, for each shared thing (way: Alone, Show, Work together; Text chat's
// and Shared notes' Present, f07692a5). The choice is a line in the thing, so everyone in it has the same, and the
// latest wins:
//   t.how(lines)                         { mode: 'together' | 'present', by (a name), mine (I am presenting) }
//   await t.choose('present' | 'together')   say the choice; anyone in the thing may change it back
//   While someone else presents, t.say() refuses every line but talk ('say'): the watcher writes in the thread and
//   changes nothing, and the page shows the thing as it is, read-only. Draw with `t.how(lines)` each time.
//
// A thread on screen (named/thread.js) shows the lines an app chooses: thread.show(lines.filter(l => l.what === 'say')),
// thread.send = text => t.say(text).
//
// Where the app lives: where every app of the person's does, in their apps folder (contracts/app › Your own apps),
// with `"reach": ["127.0.0.1"]` in its manifest.json, which is the door's word for "talks to x4-p2p on this computer".
// x4-p2p serves that folder too, as /own/<app>/, and that copy is the one that can talk to it. So when the app is
// opened from the folder itself (in a desk's zone, where a page has no way to x4-p2p), shared() puts x4-p2p's copy of
// the same page in a frame over this one and hands it the desk's look; the app's code after `await shared()` then
// runs only in that copy. The app writes nothing for this. One of our own apps is served as /apps/<app>/ instead.
import { listen } from './p2p/p2p.js';

// One of x4-p2p's actions for a page (POST /api/ask): its events come one JSON line each; the last one is the answer
async function ask(req) {
  const r = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `x4-p2p said ${r.status}`);
  let last = null;
  for (const line of (await r.text()).split('\n')) {
    if (!line.trim()) continue;
    const ev = JSON.parse(line);
    if (ev.ev === 'error') throw new Error(ev.why || 'failed');
    last = ev;
  }
  return last ?? {};
}
const TALK = new Set(['say', 'how', 'start']);   // what a watcher may still say while someone else presents

const get = async path => { const r = await fetch(path, { cache: 'no-store' }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const post = async (path, body) => {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const v = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(v.error || `x4-p2p said ${r.status}`);
  return v;
};
const appId = () => {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length && parts.at(-1).includes('.')) parts.pop();
  return decodeURIComponent(parts.at(-1) || 'app');
};

// ---- opened from the person's apps folder: x4-p2p's copy of this page, in a frame over it ----
// x4-p2p's page port is 47321, or what X4_P2P_HOST_PORT sets where that one is taken (the ThinkPad's 41321);
// ?x4-p2p=PORT in the page's address names another (tools/parts-test's devices), and so does a file parts/x4-p2p-port.
const PORTS = [Number(new URLSearchParams(location.search).get('x4-p2p')) || 0, 47321, 41321].filter(Boolean);
const here = async () => {   // is this page x4-p2p's own?
  if (!location.protocol.startsWith('http')) return false;
  try { const r = await fetch('/api/state', { cache: 'no-store' }); return r.ok && !!(await r.json()).me; } catch { return false; }
};
// a stylesheet is the one thing a page may load from another address and be told whether it was there
const has = (port, path) => new Promise(done => {
  const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `http://127.0.0.1:${port}${path}?${Date.now()}` });
  l.onload = () => { l.remove(); done(true); }; l.onerror = () => { l.remove(); done(false); };
  document.head.append(l);
});
function framed() {
  const path = `/own/${encodeURIComponent(appId())}/`;
  const note = document.createElement('p'), frame = document.createElement('iframe');
  note.textContent = 'Finding this computer\u2019s x4-p2p\u2026';
  Object.assign(note.style, { position: 'fixed', inset: '0', margin: '0', display: 'grid', placeItems: 'center', padding: '2em', textAlign: 'center', background: 'var(--surface, Canvas)', color: 'var(--ink, CanvasText)' });
  Object.assign(frame.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', border: '0', background: 'var(--surface, Canvas)' });
  frame.title = document.title; frame.hidden = true;
  const put = () => document.body.append(note, frame);
  document.body ? put() : addEventListener('DOMContentLoaded', put);
  // the desk's look reaches this page (parts.js); the real page is one frame further in, so it is passed on
  let look = null;
  addEventListener('message', e => {
    const m = e.data;
    if (e.source === frame.contentWindow) { if (m?.x4 === 'ready' && look) frame.contentWindow.postMessage(look, '*'); return; }
    if (e.source !== parent || m?.x4 !== 'look' || typeof m.vars !== 'object') return;
    look = m;
    frame.contentWindow?.postMessage(look, '*');
  });
  (async function find() {
    // a port written beside the parts (parts/x4-p2p-port, one number) is tried first: a computer whose x4-p2p is elsewhere
    const named = Number(await fetch(new URL('../parts/x4-p2p-port', location.href), { cache: 'no-store' }).then(r => (r.ok ? r.text() : ''), () => '')) || 0;
    for (const port of [named, ...PORTS].filter(Boolean)) {
      if (!(await has(port, '/own/parts/parts.css'))) continue;
      frame.src = `http://127.0.0.1:${port}${path}`; frame.hidden = false; note.hidden = true;
      return;
    }
    note.textContent = 'This app shares through x4-p2p, which isn\u2019t answering on this computer (or is from before 2026-11-19). It tries again on its own.';
    setTimeout(find, 4000);
  })();
  return new Promise(() => {});   // never: the app carries on in x4-p2p's copy, not in this one
}

// The choice in force: the last 'how' line ('present' or 'together'); none means together
function how(lines) {
  const last = [...lines].reverse().find(l => l.what === 'how');
  if (!last || last.text !== 'present') return { mode: 'together', by: '', mine: false };
  return { mode: 'present', by: last.from, mine: last.mine };
}

export async function shared(app = appId()) {
  if (!(await here())) return framed();
  const state = await get('/api/state'), me = state.me?.name ?? '';
  const mark = `${app}: `, word = `${app}.`;   // a thing's conversation is named "lists: Groceries"; a line's id starts "lists."
  const heard = new EventTarget();
  const tell = type => () => heard.dispatchEvent(new Event(type));
  listen({ onChange: tell('change'), onUp: tell('up'), onDown: tell('down') });
  const s = {
    app, me,
    async devices() { return (await get('/api/state')).devices ?? []; },
    async people() { return (await get('/api/state')).people ?? []; },
    async asks() { return ((await ask({ cmd: 'asks' })).asks ?? []).filter(x => x.app === app).map(x => ({ from: x.from, name: x.name, what: String(x.what ?? '').replace(mark, '') })); },
    allow: from => ask({ cmd: 'allow', from, app }),
    deny: from => ask({ cmd: 'deny', from, app }),
    async all() {
      return (await get('/api/talks')).talks.filter(t => !t.guest && String(t.name ?? '').startsWith(mark))
        .sort((a, b) => (b.last || 0) - (a.last || 0))
        .map(t => ({ id: t.talk, name: t.name.slice(mark.length), members: t.members.filter(n => n !== me), unread: t.unread || 0, last: t.last || 0 }));
    },
    async start(name, devices) {   // devices: your computers, people, or both
      if (!devices?.length) throw new Error('Choose who it’s with');
      const id = (await post('/api/talk-new', { name: mark + (String(name).trim() || 'Shared'), with: devices.map(d => d.id) })).talk;
      // A conversation reaches the others with its first line, so one is said now: without it the other computers
      // had no list until something was added (tools/parts-test, 2026-11-19). Its `what` is 'start'.
      await post('/api/say', { talk: id, text: `Started ${String(name).trim() || 'it'}`, id: `${word}start.${crypto.randomUUID()}` });   // a line needs words
      return id;
    },
    open(id) {
      return {
        id,
        async lines() {
          return (await get(`/api/talk/${id}`)).lines.map(l => {
            const cmd = String(l.cmd ?? ''), what = cmd.startsWith(word) ? cmd.slice(word.length, cmd.lastIndexOf('.')) : '';
            return { key: `${l.at}|${l.from}|${cmd}`, from: l.from, mine: !!l.mine, at: l.at, text: String(l.text ?? ''), what, file: l.file ?? null };
          });
        },
        // the id makes a retry land once; the word in it is how every computer knows what the line is
        async say(text, what = 'say') {
          if (!TALK.has(what)) {
            const h = how(await this.lines());
            if (h.mode === 'present' && !h.mine) throw new Error(`${h.by} is presenting: only ${h.by} changes it now`);
          }
          return post('/api/say', { talk: id, text: String(text), id: `${word}${String(what).replaceAll('.', '-')}.${crypto.randomUUID()}` });
        },
        // a file (chosen, dropped or pasted) as a line: kept here by its hash, fetched by every computer of the person's
        // in the thing (not yet by another person's: _talk/2026-11-20-people-reach.md › Not in this piece)
        async file(f, what = 'file') {
          const r = await fetch(`/api/file?name=${encodeURIComponent(f.name || 'file')}`, { method: 'POST', body: f });
          const v = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(v.error || `x4-p2p said ${r.status}`);
          return post('/api/say', { talk: id, text: f.name || 'file', file: v, id: `${word}${what}.${crypto.randomUUID()}` });
        },
        how: lines => how(lines),
        choose(mode) { return this.say(mode === 'present' ? 'present' : 'together', 'how'); },
        read() { return fetch(`/api/read/${id}`, { method: 'POST' }).catch(() => {}); },
      };
    },
    on(type, fn) { heard.addEventListener(type, fn); return s; },
  };
  return s;
}
