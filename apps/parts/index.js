// The parts page's own few lines: every press answered, as an app's would be.
import { say } from './parts.js';
const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
on('save', () => say('Saved'));
on('ok', () => say('It worked', 'ok'));
on('bad', () => say("That didn't work", 'bad'));
on('theme', () => {
  const dark = getComputedStyle(document.documentElement).getPropertyValue('--scheme').trim() === 'dark';
  document.documentElement.setAttribute('theme', dark ? 'light' : 'dark');
});
document.getElementById('list').addEventListener('click', e => {
  const row = e.target.closest('app-row');
  if (!row) return;
  for (const r of row.parentElement.children) r.toggleAttribute('current', r === row);
  say(row.querySelector('strong').textContent);
});
document.addEventListener('change', e => {
  if (e.target.matches('button[role=switch]')) say(`${e.target.textContent}: ${e.detail ? 'on' : 'off'}`);
});
document.addEventListener('click', e => {
  const card = e.target.closest('button[card]');
  if (!card) return;
  for (const c of card.parentElement.children) c.toggleAttribute('current', c === card);
});
