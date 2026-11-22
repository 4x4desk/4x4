// My app: what it does, in a line or two. Its parts and its look come from ../parts
// (../parts/README.md › The parts has every part).
// What it keeps goes through data(): this app's own box on the person's computer, kept apart from every other
// app's (../parts/blueprints/data-on-this-computer.md). The screen is drawn from the box on its `change`, so another open
// copy of the app shows the same thing at once.
// The empty-notice needs no code: it sits right after the list and shows while the list has no rows.
import { el, say, data } from '../parts/parts.js';

const box = data();
const list = document.querySelector('thing-list');
let things = box.get('things', []);

const keep = () => box.set('things', things);
const draw = () => list.replaceChildren(...things.map((thing, i) =>
  el('list-row', {},
    el('row-title', { text: thing.name }),
    el('row-note', { text: thing.made }),
    el('button', { danger: true, text: 'Remove', onclick: () => { things.splice(i, 1); keep(); say('Removed'); } }))));

box.on('change', () => { things = box.get('things', []); draw(); });
document.querySelector('button[name=add]').addEventListener('click', () => {
  things.push({ name: `Thing ${things.length + 1}`, made: new Date().toLocaleString() });
  keep();
  say('Added');
});
draw();
