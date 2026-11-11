// My app: what it does, in a line or two. Its parts and its look come from ../parts (apps/parts/README.md).
// What it keeps stays on the person's computer (localStorage here; the app's own container in 4x4 AWD Desk).
import { el, say } from '../parts/parts.js';

const KEY = 'my-app.things';
let things = [];
try { things = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { things = []; }
const list = document.getElementById('things'), empty = document.getElementById('empty');

function draw() {
  list.hidden = !things.length;
  empty.hidden = !!things.length;
  list.replaceChildren(...things.map((t, i) => el('app-row', {},
    el('row-text', {}, el('strong', { text: t.name }), el('span', { quiet: '', text: t.made })),
    el('row-end', {}, el('button', { danger: '', text: 'Remove', onclick: () => { things.splice(i, 1); keep(); say('Removed'); } })))));
}
function keep() {
  try { localStorage.setItem(KEY, JSON.stringify(things)); } catch { /* this visit only */ }
  draw();
}
document.getElementById('add').addEventListener('click', () => {
  things.push({ name: `Thing ${things.length + 1}`, made: new Date().toLocaleString() });
  keep();
  say('Added');
});
draw();
