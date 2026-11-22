// Part: talking to this computer's x4-p2p, for any page it serves (Video chat, and Phone and Text chat to come).
// No screen of its own. x4-p2p carries a small JSON note to one of the person's own devices (POST /api/vcall, ALPN
// 4x4/vcall/1, own devices only: services/p2p/src/serve.rs › video calls) and tells the page what arrives (/events).
// The page must be served by x4-p2p itself (http://127.0.0.1:47321/…, 41321 on TP): these are same-origin calls.

// One note to one of the person's devices (`to`: its id, or its name). Throws with x4-p2p's reason when it can't.
export async function send(to, msg) {
  const r = await fetch('/api/vcall', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, msg }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `x4-p2p said ${r.status}`);
}

// Something the person here does about a visitor (host.rs › act): { do: 'answer' | 'signal' | 'hangup' | 'say', guest, … }
export async function act(m) {
  const r = await fetch('/do', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `x4-p2p said ${r.status}`);
}

// The same, for a page that is closing: the browser keeps the request going after the page has gone
export function sendAsLeaving(to, msg) {
  const body = JSON.stringify({ to, msg });
  fetch('/api/vcall', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(() => navigator.sendBeacon?.('/api/vcall', body));
}

// Who this computer is and the person's other devices: { me: name, build, devices: [{ id, name, kind, online,
// path: { via, addr }, build }] }. `build`: which x4-p2p it runs, "2026-11-17 df6a3135", or "older" (from before
// introductions), or null (not said yet).
export async function state() {
  const s = await (await fetch('/api/state')).json();
  return { me: s.me?.name ?? '', meId: s.me?.id ?? '', build: s.me?.build ?? '', devices: s.devices ?? [] };
}

// Where WebRTC looks for a way through: this computer's own servers (X4_P2P_ICE), else one public STUN, which finds
// the IPv4 address the internet sees (computers with public IPv6 addresses connect without it). No TURN yet.
export async function ice() {
  let r;
  try { r = await (await fetch('/api/ice')).json(); } catch { r = { servers: [] }; }
  if (!r.servers?.length) r.servers = [{ urls: 'stun:stun.cloudflare.com:3478' }];
  return r;
}

// What arrives: `onNote(from id, from name, msg)` for each note from another device; `onGuest(ev)` for what a visitor
// does (host.rs: 'now' with who is here, 'guest', 'ring', 'signal', 'hangup', 'left', 'proposed'); `onChange()` when a
// device comes or goes or a talk changes (x4-p2p rings /api/talk-events); `onUp()` / `onDown()` as x4-p2p answers or stops.
//
// One pair of streams for every P2P page open in this browser. Each stream holds a connection open, and a browser
// allows only six to one address: Video chat, Text chat and Phone open together, two streams each, used all six,
// and every other request from them waited for ever (seen on BK, 2026-11-17). So one page holds the streams (a
// browser lock picks it; when it closes, the lock passes to another) and hands every event to the others over a
// BroadcastChannel. Where there are no locks, each page opens its own.
const CHANNEL = 'x4-p2p streams';
export function listen({ onNote, onGuest, onChange, onUp, onDown } = {}) {
  const handle = m => {
    if (m.kind === 'note') {
      let n; try { n = JSON.parse(m.data); } catch { return; }
      if (n.ev === 'vcall') onNote?.(n.from, n.name, n.msg ?? {});
      else if (['now', 'guest', 'ring', 'signal', 'hangup', 'left', 'proposed'].includes(n.ev)) onGuest?.(n);
    } else if (m.kind === 'change') onChange?.();
    else if (m.kind === 'up') onUp?.();
    else if (m.kind === 'down') onDown?.();
  };
  // The two streams, each event to `out`; gives back how to close them
  const open = out => {
    const notes = new EventSource('/events'), talks = new EventSource('/api/talk-events');
    notes.onmessage = e => out({ kind: 'note', data: e.data });
    notes.onopen = () => out({ kind: 'up' });
    notes.onerror = () => out({ kind: 'down' });
    talks.onmessage = () => out({ kind: 'change' });
    return () => { notes.close(); talks.close(); };
  };
  let ch = null;
  try { ch = new BroadcastChannel(CHANNEL); } catch { /* none */ }
  if (!ch || !navigator.locks) return void open(handle);

  // The holder should be a page that is drawn. 4x4 AWD Desk pauses the page of a window it doesn't draw
  // (desk.mjs › docShellIsActive), and when that page held the streams, a line written on a call reached the
  // conversation but not the call screen in another zone, 40 s later (tools/call-test, 2026-11-19). So the holder says
  // every BEAT that it is there and whether it is seen; a page that is seen takes the streams over (a lock may be
  // taken, `steal`) when the holder is unseen or hasn't been heard for STALE. Still two streams in all. What a holder
  // that was taken from sends when it wakes is old: only the holder of the latest beat is listened to.
  const BEAT = 1500, STALE = 4500, me = crypto.randomUUID?.() ?? String(Math.random());
  let holder = '', since = 0, heard = Date.now(), holderSeen = true, holding = false, queued = false, taking = false, stop = null, beats = 0;
  // A beat carries when its page took the streams: a later holder wins over one that was paused and still beats on waking
  const beat = () => holding && ch.postMessage({ kind: 'beat', from: me, since, seen: !document.hidden });
  ch.onmessage = ({ data: m }) => {
    if (holding) return;
    if (m?.kind === 'beat') { if (m.since < since) return; holder = m.from; since = m.since; heard = Date.now(); holderSeen = !!m.seen; return; }
    if (!holding && (!holder || m?.from === holder)) handle(m);
  };
  const take = steal => {
    if (steal) taking = true; else queued = true;
    navigator.locks.request(CHANNEL, steal ? { steal: true } : {}, () => new Promise(() => {
      if (steal) taking = false; else queued = false;
      holding = true; holder = me; since = Date.now();
      beat();
      stop = open(m => { if (!holding) return; handle(m); ch.postMessage({ ...m, from: me }); });
      beats = setInterval(beat, BEAT);
    })).catch(() => {
      // Taken over by a page that is seen: let the streams go, and wait in line again (unless already waiting)
      if (steal) taking = false; else queued = false;
      holding = false; stop?.(); stop = null; clearInterval(beats);
      heard = Date.now(); holderSeen = true;
      if (!queued) take(false);
    });
  };
  const check = () => {
    if (holding || taking || document.hidden) return;
    if (!holderSeen || Date.now() - heard > STALE) take(true);
  };
  take(false);   // held until this page goes; then the browser gives it to the next page waiting
  setInterval(check, BEAT);
  document.addEventListener('visibilitychange', () => (holding ? beat() : check()));
}
