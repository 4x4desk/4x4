// Calculator: one of our own apps, the same files on 4x4desk.app and in 4x4 Desk. Sums are worked in the order a
// person reads them, × and ÷ before + and −. % of a number after + or − is that share of what came before it
// (200 + 5% is 210); anywhere else it divides by 100. Finished sums go on the tape, and pressing one brings its
// answer back. Keys work too: digits, . + - * / x, Enter or =, Backspace, Escape, %.
//
// The look is the parts' (../parts/parts.js): it says { x4: 'ready' } to the host, sets the host's look on :root and
// tells the document `look`, when the answer is fitted again. Opened on its own, the look file's values. This file
// stays a classic script at the end of the page, so it is listening for the host's share and press before parts.js
// (a module, run after the page is parsed) says ready.

const screen = document.querySelector('output');
const sumLine = document.querySelector('sum-line');
const clearKey = document.querySelector('[data-key="clear"]');
const tape = document.querySelector('paper-tape ol');
const tapeEmpty = document.querySelector('paper-tape .empty');

const SIGN = { '+': '+', '-': '−', '*': '×', '/': '÷' };
const RANK = { '+': 1, '-': 1, '*': 2, '/': 2 };
const MAX_DIGITS = 15;
const local = new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 });
const point = local.formatToParts(1.5).find(p => p.type === 'decimal')?.value || '.';

let parts = [];        // numbers (as numbers) and operators, the sum so far
let entry = '0';       // the number being typed, as typed; null just after an operator
let done = false;      // the last key was =: a digit starts afresh, an operator carries the answer on
let error = '';

// ---- arithmetic ----
const tidy = n => Number(n.toPrecision(12));   // 0.1 + 0.2 is 0.3
function work(list) {
  const nums = [], ops = [];
  const apply = () => {
    const b = nums.pop(), a = nums.pop(), op = ops.pop();
    if (op === '/' && b === 0) throw new Error('Can’t divide by 0');
    nums.push(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
  };
  for (const p of list) {
    if (typeof p === 'number') { nums.push(p); continue; }
    while (ops.length && RANK[ops.at(-1)] >= RANK[p]) apply();
    ops.push(p);
  }
  while (ops.length) apply();
  return tidy(nums[0] ?? 0);
}

// ---- how numbers read ----
function show(n) {
  if (!Number.isFinite(n)) return 'Too big';
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e15 || a < 1e-9)) return n.toExponential(8).replace(/\.?0+e/, 'e');
  return local.format(n);
}
// a number as it's being typed: grouped, with the point and any zeros after it kept
function typed(s) {
  const [whole, frac] = s.split('.');
  const neg = whole.startsWith('-');
  const w = local.format(Number(whole.replace('-', '')) || 0);
  return (neg ? '−' : '') + w + (frac !== undefined ? point + frac : '');
}
const sumText = list => list.map(p => typeof p === 'number' ? show(p) : ` ${SIGN[p]} `).join('');

// ---- the keys ----
function press(key) {
  if (error) { error = ''; parts = []; entry = '0'; done = false; }
  if (/^[0-9]$/.test(key)) {
    if (done) { parts = []; entry = null; done = false; }
    if (entry === null || entry === '0') entry = key;
    else if (entry === '-0') entry = '-' + key;
    else if (entry.replace(/[-.]/g, '').length < MAX_DIGITS) entry += key;
  } else if (key === '.') {
    if (done) { parts = []; entry = null; done = false; }
    if (entry === null) entry = '0';
    if (!entry.includes('.')) entry += '.';
  } else if (key in RANK) {
    if (done) { done = false; }
    if (entry === null) parts[parts.length - 1] = key;   // a second operator replaces the first
    else { parts.push(Number(entry)); parts.push(key); entry = null; }
  } else if (key === '=') {
    if (entry === null && !parts.length) return;
    const list = entry === null ? parts.slice(0, -1) : [...parts, Number(entry)];
    if (list.length < 3 && done) return;
    try {
      const answer = work(list);
      if (list.length >= 3) note(list, answer);
      parts = [];
      entry = String(answer);
      done = true;
    } catch (err) { error = err.message; }
  } else if (key === 'clear') {
    if (entry !== null && entry !== '0' && !done) entry = '0';   // C: the number only
    else { parts = []; entry = '0'; done = false; }              // AC: everything
  } else if (key === 'negate') {
    if (entry === null) entry = '0';
    entry = entry.startsWith('-') ? entry.slice(1) : '-' + entry;
    done = false;
  } else if (key === 'percent') {
    if (entry === null) return;
    const op = parts.at(-1);
    const share = Number(entry) / 100;
    entry = String(tidy((op === '+' || op === '-') && parts.length >= 2 ? work(parts.slice(0, -1)) * share : share));
    done = false;
  } else if (key === 'back') {
    if (done || entry === null) return;
    entry = entry.length > 1 && entry !== '-0' ? entry.slice(0, -1) : '0';
    if (entry === '-') entry = '0';
  } else if (key.startsWith('recall:')) {
    // an answer from the tape: after an operator, or partway through a sum, it goes into it; otherwise it starts anew
    const into = entry === null || (!done && parts.length > 0);
    if (!into) parts = [];
    entry = key.slice(7);
    done = !into;
  }
  draw();
}

function draw() {
  if (error) {
    screen.textContent = error;
    sumLine.textContent = '';
    screen.toggleAttribute('error', true);
    fit();
    return;
  }
  screen.removeAttribute('error');
  const now = entry === null ? show(parts.filter(p => typeof p === 'number').at(-1) ?? 0) : done ? show(Number(entry)) : typed(entry);
  screen.textContent = now;
  sumLine.textContent = parts.length ? sumText(parts) : ' ';
  clearKey.textContent = entry !== null && entry !== '0' && !done ? 'C' : 'AC';
  clearKey.setAttribute('aria-label', clearKey.textContent === 'C' ? 'Clear the number' : 'Clear all');
  for (const b of document.querySelectorAll('key-pad .op')) b.toggleAttribute('on', entry === null && parts.at(-1) === b.dataset.key);
  fit();
}

// the answer shrinks to fit its line rather than run off it
function fit() {
  screen.style.removeProperty('--fit');
  const room = screen.clientWidth, need = screen.scrollWidth;
  if (need > room) screen.style.setProperty('--fit', String(Math.max(0.35, room / need)));
}

function note(list, answer) {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.dataset.answer = String(answer);
  b.append(Object.assign(document.createElement('span'), { textContent: sumText(list) + ' =' }), Object.assign(document.createElement('strong'), { textContent: show(answer) }));
  li.append(b);
  tape.prepend(li);
  while (tape.children.length > 40) tape.lastElementChild.remove();
  tapeEmpty.hidden = true;
}
tape.addEventListener('click', e => {
  const b = e.target.closest('button[data-answer]');
  if (b) key('recall:' + b.dataset.answer);
});

// ---- shared with someone: the host says { x4: 'share' }. From then on a press goes out to the host as
// { x4: 'press', key }, and only the presses the host sends back are worked, in the host's order, so two people's
// calculators show the same sum (the desk's call). Alone, or until the host says so, a press is worked at once.
let shared = false;
function key(k) {
  if (shared) parent.postMessage({ x4: 'press', key: k }, '*');
  else press(k);
}

// ---- pointer and keyboard ----
document.querySelector('key-pad').addEventListener('click', e => {
  const b = e.target.closest('button[data-key]');
  if (b) key(b.dataset.key);
});
const KEYS = { Enter: '=', '=': '=', Escape: 'clear', Delete: 'clear', Backspace: 'back', x: '*', X: '*', ',': '.' };
addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = KEYS[e.key] || (/^[0-9.+\-*/%]$/.test(e.key) ? (e.key === '%' ? 'percent' : e.key) : null);
  if (!k) return;
  e.preventDefault();
  key(k);
  const b = document.querySelector(`key-pad [data-key="${CSS.escape(k)}"]`);
  if (b) { b.setAttribute('down', ''); setTimeout(() => b.removeAttribute('down'), 110); }
});

// ---- the host's messages: share and press are the calculator's own; the look is the parts' ----
addEventListener('message', e => {
  const m = e.data;
  if (e.source !== parent || !m) return;
  if (m.x4 === 'share') { shared = true; return; }
  if (m.x4 === 'press' && shared && typeof m.key === 'string') press(m.key);
});
document.addEventListener('look', () => fit());
new ResizeObserver(() => fit()).observe(screen);

draw();
