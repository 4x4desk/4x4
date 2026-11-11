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
//                with the arrow keys; kept for the next visit when the split has an id.
// And to import:  say(text)   a line over the app for a moment, so every press is answered on screen
//                 el(tag, attrs, ...kids)   an element in one line
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
let said = null;
export function say(text, kind = '') {
  said?.remove();
  said = el('app-said', { role: 'status', text });
  if (kind) said.style.setProperty('--said', `var(--${kind})`);
  document.body.append(said);
  said.addEventListener('animationend', () => said?.remove(), { once: true });
  return said;
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
// what's on the page as it loads: tabs' roles, splitters' kept places and focus
function dress(scope = document) {
  for (const tabs of scope.querySelectorAll('app-tabs')) {
    tabs.setAttribute('role', 'tablist');
    for (const b of tabs.querySelectorAll(':scope > button[tab]')) { b.setAttribute('role', 'tab'); b.tabIndex = b.hasAttribute('current') ? 0 : -1; }
  }
  for (const bar of scope.querySelectorAll('app-split > split-bar')) {
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
export { dress };   // for parts an app adds after it loads
