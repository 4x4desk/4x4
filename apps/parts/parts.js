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
//                 kind(word, …), ready()   the kinds (below, "the kinds"): how a page written in the agreed names
//                                          (README.md › The parts) gets its look, roles and life from this file
// The earlier parts (app-tabs, app-split, app-row) are wired on the document, so parts added later work without
// being started; a kind is defined as it appears.
const root = document.documentElement;

// ---- the host's look ----
const hosted = parent !== window;
let heard = false;
const shown = () => requestAnimationFrame(() => root.setAttribute('looked', ''));
addEventListener('message', e => {
  const m = e.data;
  if (e.source !== parent || m?.x4 !== 'look' || typeof m.vars !== 'object') return;
  for (const [k, v] of Object.entries(m.vars)) if (k.startsWith('--') && typeof v === 'string') root.style.setProperty(k, v);
  document.dispatchEvent(new CustomEvent('look', { detail: m.vars }));
  root.removeAttribute('alone');   // a host answered after all: its surface, not ours
  heard = true;
  shown();
});
if (hosted) parent.postMessage({ x4: 'ready' }, '*'); else root.setAttribute('alone', '');
// a host that never answers (a frame inside a page that isn't a desk): the app shows with its own values and its own
// background, as when opened alone, so its ink is never left on someone else's colour
setTimeout(() => { if (hosted && !heard) root.setAttribute('alone', ''); shown(); }, hosted ? 500 : 0);

// ---- an element in one line: el('button', { primary: '', text: 'Save', onclick: save }) ----
export function el(tag, attrs = {}, ...kids) {
  if (tag.includes('-')) define(tag);   // one of a kind is that kind from the moment it is made
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

// ---- a line said over the app for a moment; tone: 'ok' | 'warn' | 'bad' colours it by meaning ----
// act { text, run } adds one button (Undo after a delete): the line then stays longer, and holds while pointed at
// or focused, so the person has time to change their mind. It is a toast (said-toast), heard as it appears.
let said = null;
export function say(text, tone = '', act = null) {
  said?.remove();
  define('said-toast', true);
  const line = said = el('said-toast', tone ? { [tone]: true } : {}, text);
  const gone = () => { line.remove(); if (said === line) said = null; };
  if (act?.text) line.append(el('button', { type: 'button', text: act.text, onclick: () => { gone(); act.run?.(); } }));
  line.addEventListener('animationend', e => { if (e.target === line) gone(); });
  document.body.append(line);
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

// ==== the kinds (README.md › The parts) ====
// The library gives kinds, not names. An app names each thing by what it is (device-list, recipe-card, chat-thread)
// and the LAST WORD says its kind. Any element on the page whose last word is a kind is defined on sight, in the
// page's own DOM (no shadow root, nothing to build), and gets
//   the kind's look     parts.css selects :state(list), :state(card)… so one rule dresses every list
//   the kind's role     a screen reader hears "list" for <device-list>; the page never writes role="…"
//   the kind's life     a view is dragged at its splitter, a row with `press` is pressed with the keys
// A bare word the page writes for how a thing is just now is passed on the same way: <list-row current>.
//   kind(word, { role, life })   a kind of an app's own, or more life for one here (named/thread.js adds a thread's):
//                                life's methods are every such element's, connected() runs when one appears
//   ready()                      resolves when everything on the page now is defined; wait before measuring
// A page still written in the earlier parts (app-bar, app-body, app-split, app-list…) is left as it was: its own
// names were never chosen with the kinds in mind (Search's trick-row, Maps' maps-view, Notes' keep-row), so nothing on
// it is made a kind but the toast say() shows. It joins when it is rewritten in the names; one earlier part left on
// a page keeps the whole page out.
const earlier = !!document.querySelector('app-bar, app-body, app-split, app-panel, app-list, app-row, app-cards, app-card, app-field, app-empty, app-tabs, app-pane, app-busy, app-tag');
// The kinds: the last word of a thing's name, and what a screen reader hears for it. The agreed list of
// kinds, with what each is, is kept beside the names' grammar and checked against this one.
export const ROLES = {
  page: null, view: null, bar: null, card: null, grid: null, thread: null, line: null, tag: null, badge: null,
  list: 'list', row: 'listitem', group: 'group', log: 'log', portrait: 'img', icon: 'img',
  notice: 'status', toast: 'status', splitter: 'separator',
};
// A bare word on a named element, and how a screen reader hears it
const HEARD = { current: 'ariaCurrent', busy: 'ariaBusy' };

const lastWord = tag => tag.slice(tag.lastIndexOf('-') + 1);
// A film's cast is named family first (prop-tag, paint-line) and the film engine defines those itself, so on a
// page that holds a film nothing inside a <film-movie>, and no name that starts with a cast family, is made a kind
// here: defining one first made the engine's own define throw (the Studio, 2026-11-18). The families are
// the agreed list's. A page with no film keeps those first words for itself: an app's set-list is a
// list (2026-11-19; before, the families were skipped on every page).
const CAST = ['prop', 'paint', 'char', 'fx', 'set'];
const film = () => !!document.querySelector('film-movie') || !!customElements.get('film-movie');
const family = tag => film() && CAST.includes(tag.slice(0, tag.indexOf('-')));
const cast = e => family(e.localName) || !!e.closest('film-movie');
const lives = {};   // word → the object every element of that kind inherits its life from
const lifeOf = word => lives[word] ??= Object.create(HTMLElement.prototype);

function define(tag, always = false) {
  const word = lastWord(tag);
  if (!(word in ROLES) || (earlier && !always) || customElements.get(tag) || family(tag)) return;
  const C = class extends HTMLElement {
    static observedAttributes = Object.keys(HEARD);
    #inner = this.attachInternals();
    constructor() { super(); this.#inner.states.add(word); if (ROLES[word]) this.#inner.role = ROLES[word]; }
    get heard() { return this.#inner; }   // for a kind that says more (a label, a value)
    attributeChangedCallback(name, was, now) { this.#inner[HEARD[name]] = now === null ? null : 'true'; }
    // a moment later, so the things inside it (a view's splitter) are defined too by the time it looks for them
    connectedCallback() { queueMicrotask(() => { if (this.isConnected) this.connected?.(); }); }
    disconnectedCallback() { this.gone?.(); }
  };
  Object.setPrototypeOf(C.prototype, lifeOf(word));
  customElements.define(tag, C);
}
// every named element here now, and each one added later
function scan(root) {
  if (root.localName?.includes('-') && !cast(root)) define(root.localName);
  for (const e of root.querySelectorAll?.('*') ?? []) if (e.localName.includes('-') && !cast(e)) define(e.localName);
}
export function kind(word, { role = ROLES[word] ?? null, life = {} } = {}) {
  ROLES[word] = role;
  Object.defineProperties(lifeOf(word), Object.getOwnPropertyDescriptors(life));
  scan(document);
  for (const e of document.querySelectorAll('*')) if (e.localName.includes('-') && lastWord(e.localName) === word && e.isConnected) e.connected?.();
}
export const ready = () => Promise.all([...document.querySelectorAll(':not(:defined)')]
  .filter(e => lastWord(e.localName) in ROLES).map(e => customElements.whenDefined(e.localName)));

// ---- a view: two sides, <aside> and <main>, side by side, or one under the other when narrow ----
// With a <view-splitter> between them the person drags the line, or moves it with the arrow keys; the place is
// kept for the next visit when the view has a name. <chat-view turns>: narrow, the sides take turns at the full
// height; at="main" shows the main one, a [turn-back] button the aside.
kind('view', { life: {
  connected() {
    if (this.wired) return;
    this.wired = true;
    this.addEventListener('click', e => { if (e.target.closest('[turn-back]')) this.removeAttribute('at'); });
    const bar = this.querySelector(':scope > view-splitter'), key = `4x4.split.${location.pathname}.${this.getAttribute('name')}`;
    if (!bar) return;
    const kept = this.hasAttribute('name') ? (() => { try { return localStorage.getItem(key); } catch { return null; } })() : null;
    const set = (percent, keep = true) => {
      const p = Math.max(15, Math.min(75, percent));
      this.style.setProperty('--split', `${p}%`);
      bar.heard.ariaValueNow = String(Math.round(p));
      if (keep && this.hasAttribute('name')) try { localStorage.setItem(key, String(p)); } catch { /* this visit only */ }
    };
    bar.tabIndex = 0;
    bar.heard.ariaLabel = 'Resize';
    set(parseFloat(kept) || 34, false);
    bar.addEventListener('keydown', e => {
      const step = { ArrowLeft: -3, ArrowRight: 3 }[e.key];
      if (step) { set(parseFloat(this.style.getPropertyValue('--split')) + step); e.preventDefault(); }
    });
    bar.addEventListener('pointerdown', e => {
      const box = this.getBoundingClientRect(), move = m => set((m.clientX - box.left) / box.width * 100);
      const done = () => { bar.removeAttribute('dragging'); bar.removeEventListener('pointermove', move); };
      bar.setPointerCapture(e.pointerId);
      bar.setAttribute('dragging', '');
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', done, { once: true });
      bar.addEventListener('pointercancel', done, { once: true });
      e.preventDefault();
    });
  },
} });

// ---- a group that holds tabs: <tab-group><button tab="a" current>…</button>…</tab-group>, and beside it whatever
// carries the same word, <section tab="a">: a press or the arrow keys show it ----
kind('group', { life: {
  connected() {
    const tabs = () => [...this.querySelectorAll(':scope > button[tab]')];
    if (this.wired || !tabs().length) return;
    this.wired = true;
    this.heard.role = 'tablist';
    const shown = () => this.parentElement.querySelectorAll(':scope > [tab]');
    const show = tab => {
      for (const b of tabs()) { b.toggleAttribute('current', b === tab); b.ariaSelected = String(b === tab); b.tabIndex = b === tab ? 0 : -1; }
      for (const p of shown()) p.toggleAttribute('current', p.getAttribute('tab') === tab.getAttribute('tab'));
      this.dispatchEvent(new CustomEvent('change', { detail: tab.getAttribute('tab'), bubbles: true }));
    };
    for (const b of tabs()) { b.role = 'tab'; b.tabIndex = b.hasAttribute('current') ? 0 : -1; }
    for (const p of shown()) p.role = 'tabpanel';
    this.addEventListener('click', e => { const tab = e.target.closest('button[tab]'); if (tab) show(tab); });
    this.addEventListener('keydown', e => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key], all = tabs(), at = all.indexOf(e.target);
      if (!step || at < 0) return;
      const next = all[(at + step + all.length) % all.length];
      next.focus(); show(next); e.preventDefault();
    });
  },
} });

// ---- a row: one thing in any list. <list-row press>: the whole row is pressed, with Enter or Space too, and the
// arrow keys move between rows; the list is then heard as a list of choices ----
kind('row', { life: {
  connected() {
    if (!this.hasAttribute('press') || this.wired) return;
    this.wired = true;
    this.tabIndex = 0;
    this.heard.role = 'option';
    if (this.parentElement?.heard) this.parentElement.heard.role = 'listbox';
    this.addEventListener('keydown', e => {
      if (e.target !== this) return;
      const step = { ArrowUp: -1, ArrowDown: 1 }[e.key];
      if (e.key === 'Enter' || e.key === ' ') { this.click(); e.preventDefault(); }
      else if (step) {
        const rows = [...this.parentElement.children].filter(r => r.matches(':state(row)[press]:not([hidden])'));
        rows[rows.indexOf(this) + step]?.focus();
        e.preventDefault();
      }
    });
  },
} });

scan(document);
new MutationObserver(changes => { for (const c of changes) for (const n of c.addedNodes) if (n.nodeType === 1) scan(n); })
  .observe(root, { childList: true, subtree: true });

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
