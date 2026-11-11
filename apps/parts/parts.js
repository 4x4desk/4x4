// The parts every 4x4 app is built from: what parts.css can't do alone (apps/parts/README.md). An app loads it once:
//   <script type="module" src="../parts/parts.js"></script>
// and gets, with no code of its own:
//   - the host's look: the app says { x4: 'ready' }, the host (the desk's zone, on the web or in AWD) posts
//     { x4: 'look', vars }, and its colours and sizes become this page's; the document then hears a `look` event.
//     Opened on its own (no host), the app draws with look.css's values and <html> gets `alone`. Until either, the
//     page isn't shown (parts.css, html:not([looked])), so it never flashes other colours first;
//   - switches:  <button role="switch" aria-checked="false">Label</button> flips on a press and says `change`;
//   - tabs:      <app-tabs><button tab="a" current>A</button>…</app-tabs> with <app-pane name="a" current>…: a press
//                or the arrow keys show the pane, and the tabs say `change` ({ detail: name });
//   - splitters: <app-split><aside>…</aside><split-bar></split-bar><main>…</main></app-split>: dragged, or moved
//                with the arrow keys; kept for the next visit when the split has an id. <app-split turns>: when
//                narrow, the two parts take turns (at="main" shows the main one), as a list and the thing opened;
//   - rows:      <app-row press> is pressed with Enter or Space too, and the arrow keys move between a list's rows.
// And to import:  say(text, kind, act)   a line over the app for a moment, so every press is answered on screen;
//                                        act { text: 'Undo', run } puts one button on it and keeps it up longer
//                 el(tag, attrs, ...kids)   an element in one line
//                 data(id)   what the app keeps on this computer (below, "what an app keeps")
// Everything is wired on the document, so parts added later work without being started.
const root = document.documentElement;

// ---- the host's look ----
const hosted = parent !== window;
const shown = () => requestAnimationFrame(() => root.setAttribute('looked', ''));
addEventListener('message', e => {
  const m = e.data;
  if (e.source !== parent || m?.x4 !== 'look' || typeof m.vars !== 'object') return;
  for (const [k, v] of Object.entries(m.vars)) if (k.startsWith('--') && typeof v === 'string') root.style.setProperty(k, v);
  document.dispatchEvent(new CustomEvent('look', { detail: m.vars }));
  shown();
});
if (hosted) parent.postMessage({ x4: 'ready' }, '*'); else root.setAttribute('alone', '');
setTimeout(shown, hosted ? 500 : 0);   // a host that never answers: the app shows with its own values

// ---- an element in one line: el('button', { primary: '', text: 'Save', onclick: save }) ----
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids.flat().filter(k => k != null && k !== false));
  return e;
}

// ---- a line said over the app for a moment; kind: 'ok' | 'warn' | 'bad' colours it by meaning ----
// act { text, run } adds one button (Undo after a delete): the line then stays longer, and holds while pointed at
// or focused, so the person has time to change their mind.
let said = null;
export function say(text, kind = '', act = null) {
  said?.remove();
  const line = said = el('app-said', { role: 'status' }, el('span', { text }));
  const gone = () => { line.remove(); if (said === line) said = null; };
  if (kind) line.style.setProperty('--said', `var(--${kind})`);
  if (act?.text) {
    line.setAttribute('act', '');
    line.append(el('button', { type: 'button', text: act.text, onclick: () => { gone(); act.run?.(); } }));
  }
  document.body.append(line);
  line.addEventListener('animationend', e => { if (e.target === line) gone(); });
  return line;
}

// ---- switches and tabs ----
function showTab(tab) {
  const tabs = tab.closest('app-tabs'), name = tab.getAttribute('tab');
  for (const b of tabs.querySelectorAll(':scope > button[tab]')) {
    b.toggleAttribute('current', b === tab);
    b.setAttribute('aria-selected', b === tab);
    b.tabIndex = b === tab ? 0 : -1;
  }
  // its panes: the ones beside the tabs, or anywhere in the page when the tabs name a group (for="…")
  const scope = tabs.getAttribute('for') ? document : tabs.parentElement;
  const group = tabs.getAttribute('for');
  for (const p of scope.querySelectorAll(group ? `app-pane[of="${CSS.escape(group)}"]` : ':scope > app-pane')) p.toggleAttribute('current', p.getAttribute('name') === name);
  tabs.dispatchEvent(new CustomEvent('change', { detail: name, bubbles: true }));
}
document.addEventListener('click', e => {
  const back = e.target.closest?.('app-split[turns] [turn-back]');
  if (back) { back.closest('app-split[turns]').removeAttribute('at'); return; }
  const sw = e.target.closest?.('button[role=switch]');
  if (sw && !sw.disabled) {
    sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
    sw.dispatchEvent(new CustomEvent('change', { detail: sw.getAttribute('aria-checked') === 'true', bubbles: true }));
    return;
  }
  const tab = e.target.closest?.('app-tabs > button[tab]');
  if (tab) showTab(tab);
});
document.addEventListener('keydown', e => {
  const row = e.target.closest?.('app-row[press]');
  if (row && e.target === row) {
    if (e.key === 'Enter' || e.key === ' ') { row.click(); e.preventDefault(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const rows = [...row.parentElement.querySelectorAll(':scope > app-row[press]')].filter(r => !r.hidden);
      rows[rows.indexOf(row) + (e.key === 'ArrowDown' ? 1 : -1)]?.focus();
      e.preventDefault();
      return;
    }
  }
  const tab = e.target.closest?.('app-tabs > button[tab]');
  if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const all = [...tab.parentElement.querySelectorAll(':scope > button[tab]')];
    const next = all[(all.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    next.focus();
    showTab(next);
    e.preventDefault();
    return;
  }
  const bar = e.target.closest?.('app-split > split-bar');
  if (bar && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
    const split = bar.parentElement, now = parseFloat(getComputedStyle(split).getPropertyValue('--split')) || 34;
    setSplit(split, now + (e.key === 'ArrowRight' ? 3 : -3));
    e.preventDefault();
  }
});

// ---- splitters ----
const KEPT = id => `4x4.split.${location.pathname}.${id}`;
function setSplit(split, percent) {
  const p = Math.max(15, Math.min(75, percent));
  split.style.setProperty('--split', `${p}%`);
  if (split.id) try { localStorage.setItem(KEPT(split.id), String(p)); } catch { /* this visit only */ }
}
document.addEventListener('pointerdown', e => {
  const bar = e.target.closest?.('app-split > split-bar');
  if (!bar) return;
  const split = bar.parentElement, box = split.getBoundingClientRect();
  bar.setPointerCapture(e.pointerId);
  bar.setAttribute('dragging', '');
  const move = m => setSplit(split, (m.clientX - box.left) / box.width * 100);
  const done = () => { bar.removeAttribute('dragging'); bar.removeEventListener('pointermove', move); };
  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', done, { once: true });
  bar.addEventListener('pointercancel', done, { once: true });
  e.preventDefault();
});
// what's on the page: tabs' roles, splitters' kept places and focus, rows a key can press. Run as it loads and for
// every part added after (the watcher below), so an app that draws its rows itself needn't call it.
const within = (scope, sel) => [...(scope.matches?.(sel) ? [scope] : []), ...scope.querySelectorAll(sel)];
function dress(scope = document) {
  for (const row of within(scope, 'app-row[press]')) {
    if (!row.hasAttribute('tabindex')) row.tabIndex = 0;
    if (!row.hasAttribute('role')) row.setAttribute('role', 'button');
  }
  for (const tabs of within(scope, 'app-tabs')) {
    tabs.setAttribute('role', 'tablist');
    for (const b of tabs.querySelectorAll(':scope > button[tab]')) { b.setAttribute('role', 'tab'); b.tabIndex = b.hasAttribute('current') ? 0 : -1; }
  }
  for (const bar of within(scope, 'app-split > split-bar')) {
    if (bar.hasAttribute('role')) continue;   // dressed already: a redraw shouldn't move the line back
    bar.tabIndex = 0;
    bar.setAttribute('role', 'separator');
    bar.setAttribute('aria-label', 'Resize');
    const split = bar.parentElement;
    let kept = null;
    if (split.id) try { kept = localStorage.getItem(KEPT(split.id)); } catch { /* none */ }
    if (kept) split.style.setProperty('--split', `${kept}%`);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => dress()); else dress();
new MutationObserver(changes => { for (const c of changes) for (const n of c.addedNodes) if (n.nodeType === 1) dress(n); })
  .observe(root, { childList: true, subtree: true });
export { dress };   // still here for apps that called it; the watcher does it now

// ---- what an app keeps: const box = data() ----
// One small box per app, in this browser's storage on this computer. Every app the person makes shares one web
// origin (resource://4x4desk-own/, contracts/app/README.md › Your own apps), so plain localStorage keys would
// collide: each box keeps its keys under 4x4.data.<id>. and the id is the app's folder name unless one is given.
//   box.get(key, fallback)  box.set(key, value)  box.remove(key)  box.all()   values are anything JSON can hold
//   box.on('change', e => e.detail)   { key, value, elsewhere }: elsewhere when another open copy of the app
//                                      changed it; key is null when many changed at once (a copy brought in)
//   box.export()  one plain object with everything;  box.import(copy, { merge })  takes one back in
//   box.saveCopy()  downloads that object as a .json file;  box.bringCopy()  asks for one and takes it in
//   box.kept        false when this browser won't keep anything (then it lasts this visit only, and the app says so)
// It isn't synced, isn't shared between computers, and goes when the person clears this browser's site data.
const appId = () => {
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length && parts.at(-1).includes('.')) parts.pop();   // index.html: the folder is the one before it
  return decodeURIComponent(parts.at(-1) || 'app');
};
let store = null;
try { store = localStorage; store.getItem('4x4'); } catch { store = null; }   // a frame without its own storage
let warned = false;
export function data(id = appId()) {
  const prefix = `4x4.data.${id}.`, memory = new Map(), box = new EventTarget();
  const parse = raw => { try { return JSON.parse(raw); } catch { return undefined; } };
  const read = key => store ? store.getItem(prefix + key) : memory.get(key) ?? null;
  const told = (key, value, elsewhere = false) => box.dispatchEvent(new CustomEvent('change', { detail: { key, value, elsewhere } }));
  const keys = () => {
    if (!store) return [...memory.keys()];
    const out = [];
    for (let i = 0; i < store.length; i++) { const k = store.key(i); if (k?.startsWith(prefix)) out.push(k.slice(prefix.length)); }
    return out;
  };
  const put = (key, value) => {
    if (value === undefined) { store ? store.removeItem(prefix + key) : memory.delete(key); return true; }
    const raw = JSON.stringify(value);
    if (!store) { memory.set(key, raw); return true; }
    try { store.setItem(prefix + key, raw); return true; } catch {
      // full: say so once, rather than lose work quietly
      if (!warned) { warned = true; say("This couldn't be kept: this computer's space for apps is full", 'bad'); }
      return false;
    }
  };
  Object.assign(box, {
    id, kept: !!store,
    get: (key, fallback) => { const raw = read(key); const v = raw == null ? undefined : parse(raw); return v === undefined ? fallback : v; },
    set: (key, value) => { const ok = put(key, value); if (ok) told(key, value); return ok; },
    remove: key => { put(key, undefined); told(key, undefined); },
    all: () => Object.fromEntries(keys().map(k => [k, box.get(k)]).filter(([, v]) => v !== undefined)),
    on: (type, fn) => { box.addEventListener(type, fn); return box; },
    export: () => ({ kind: '4x4 app data', app: id, saved: new Date().toISOString(), data: box.all() }),
    // merge(key, here, there) picks what to keep when both have a key (default: the copy's); returns the keys that changed
    import(copy, { merge = (key, here, there) => there } = {}) {
      if (copy?.kind !== '4x4 app data' || typeof copy.data !== 'object' || !copy.data) throw new Error("This file isn't a copy saved by an app");
      if (copy.app !== id) throw new Error(`This is a copy of ${copy.app}, not of this app`);
      const taken = [];
      for (const [k, there] of Object.entries(copy.data)) {
        const here = box.get(k), v = here === undefined ? there : merge(k, here, there);
        if (JSON.stringify(v) === JSON.stringify(here)) continue;   // kept as it was: nothing came in
        if (put(k, v)) taken.push(k);
      }
      told(null, undefined);
      return taken;
    },
    saveCopy(name = id) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(box.export(), null, 2)], { type: 'application/json' }));
      const d = new Date(), day = [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(n => String(n).padStart(2, '0')).join('-');   // the person's own day
      const a = el('a', { href: url, download: `${name} ${day}.json` });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say('Copy saved to your downloads', 'ok');
    },
    // words(keys) says what came in, in the app's own words; the promise gives the keys (none if the person didn't pick one)
    bringCopy({ merge, words = () => 'Copy brought in' } = {}) {
      return new Promise(done => {
        const pick = el('input', { type: 'file', accept: '.json,application/json', hidden: true });
        pick.addEventListener('change', async () => {
          pick.remove();
          const file = pick.files[0];
          if (!file) return done([]);
          try {
            const taken = box.import(JSON.parse(await file.text()), { merge });
            say(words(taken), 'ok');
            done(taken);
          } catch (err) {
            say(err instanceof SyntaxError ? "This file isn't a copy saved by an app" : err.message, 'bad');
            done([]);
          }
        });
        pick.addEventListener('cancel', () => { pick.remove(); done([]); });
        document.body.append(pick);
        pick.click();
      });
    },
  });
  // another open copy of this app (another zone, another window) changed something
  addEventListener('storage', e => {
    if (e.storageArea !== store) return;
    if (e.key === null) return told(null, undefined, true);
    if (e.key.startsWith(prefix)) told(e.key.slice(prefix.length), e.newValue == null ? undefined : parse(e.newValue), true);
  });
  return box;
}
