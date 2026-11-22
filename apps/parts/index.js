// The parts page's own few lines: every press answered, as an app's would be. Things are found by what they are
// and, among several, by their name: a button by button[name=save], the kept line by input[name=line].
import { say, data } from './parts.js';
import './named/thread.js';

const page = document.querySelector('app-page');
const press = (name, run) => page.querySelector(`button[name=${name}]`).addEventListener('click', run);
const only = one => { for (const each of one.parentElement.children) each.toggleAttribute('current', each === one); };

press('save', () => say('Saved'));
press('say-ok', () => say('It worked', 'ok'));
press('say-bad', () => say("That didn't work", 'bad'));
press('say-undo', () => say('Deleted a thing', '', { text: 'Undo', run: () => say('Brought back', 'ok') }));
const ask = page.querySelector('dialog[name=ask]');
press('ask', () => ask.showModal());
ask.addEventListener('close', () => say(ask.returnValue === 'yes' ? 'Removed' : 'Kept'));
press('light', () => {
  const dark = getComputedStyle(document.documentElement).getPropertyValue('--scheme').trim() === 'dark';
  document.documentElement.setAttribute('theme', dark ? 'light' : 'dark');
});

page.addEventListener('click', e => {
  const row = e.target.closest('list-row[press]'), card = e.target.closest('button[card]');
  if (row) { only(row); say(row.querySelector('row-title').textContent); }
  if (card) only(card);
});
page.addEventListener('change', e => {
  if (e.target.matches('button[role=switch]')) say(`${e.target.textContent}: ${e.detail ? 'on' : 'off'}`);
});

// what an app keeps: one line, kept as it's typed, followed by another open copy of this page
const box = data('parts'), line = page.querySelector('input[name=line]');
const show = () => { if (document.activeElement !== line) line.value = box.get('line', ''); };
line.addEventListener('input', () => box.set('line', line.value));
box.on('change', show);
show();
press('save-copy', () => box.saveCopy());
press('bring-copy', () => box.bringCopy());
press('forget', () => {
  const was = box.get('line');
  box.remove('line'); line.value = '';
  say('Forgotten', '', { text: 'Undo', run: () => { box.set('line', was); line.value = was ?? ''; } });
});

// a conversation: three lines to read, and what is written joins them (nothing is sent anywhere)
const thread = page.querySelector('sample-thread'), lines = [
  { key: '1', from: 'Ada', at: Date.now() - 180000, text: 'Is the bread out of the oven?', mine: false },
  { key: '2', from: 'You', at: Date.now() - 120000, text: 'Ten more minutes.', mine: true },
  { key: '3', from: 'Ada', at: Date.now() - 60000, text: 'Save me the end piece.', mine: false },
];
customElements.whenDefined('sample-thread').then(() => {
  thread.send = async text => { lines.push({ key: String(lines.length + 1), from: 'You', at: Date.now(), text, mine: true }); thread.show(lines); };
  thread.show(lines);
});
