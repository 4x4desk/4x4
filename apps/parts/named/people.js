// Who is around, as rows in a list, each with one thing to do (a list of rows: ../README.md › The parts). The page writes the list
// and names it for what it holds; any element whose last word is `list` will do:
//
//   <device-list picture="device-icon" action="Write" icon="mail" empty="No devices yet."></device-list>
//
// and fill() makes a row for each:
//
//   <list-row current>
//     <device-icon online>T</device-icon>
//     <row-title>TP <unread-badge>2</unread-badge></row-title>
//     <row-note>Online, direct</row-note>
//     <button primary>Write</button>
//   </list-row>
//
// `picture` is the element drawn first in a row: an icon for a thing (device-icon), a portrait for a person
// (visitor-portrait). A page whose rows differ (a second key, no key) writes its own row inside the list, in a
// <template>, and fill() makes rows like that one. Each button's `name` comes back as the action picked.
//
//   fill(list, people, { state, unread, current, can })
//       people    as p2p.state() gives devices: { name, online, path, group }
//       state     person => the line under the name (default: online direct, through a relay, or offline);
//                 or { text, tone: 'ok' | 'warn' | 'bad' }
//       unread    person => how many new lines, shown beside the name
//       current   person => true for the one open now
//       can       (person, button) => false to grey a button out
//   list.addEventListener('pick', e => e.detail)    { person, action }
//   A row written <list-row press> with no button is itself the key: a press anywhere on it picks (action '').
//   byReach          a sort: the ones that are on first, then by name
//
// The picture says whether they can be reached: [online] green, [relay] amber, neither grey; [group] several.
import { el } from './named.js';

const place = p => (p.online ? (String(p.path?.via ?? '').startsWith('relay') ? 'Online, through a relay' : 'Online, direct') : 'Offline');
// an icon from the desk's sheet (served at /frame/icons.svg), drawn in the text's colour
const sheetIcon = name => { const t = document.createElement('template'); t.innerHTML = `<svg aria-hidden="true"><use href="/frame/icons.svg#${name}"/></svg>`; return t.content.firstChild; };

// Online first, then by name: the ones that can be reached are at the top
export const byReach = (a, b) => (!!b.online - !!a.online) || String(a.name).localeCompare(String(b.name));
const keyOf = p => (p.guest ? 'guest:' : p.group ? 'talk:' : 'one:') + (p.id ?? p.note ?? p.name);   // a device or talk by its id, a note by its own

// Rows are kept from one fill to the next (found again by who they are) and only what changed is written, so a
// key the person is on with the keyboard, or is pressing, is still there after the list is filled again.
export function fill(list, people, { state = place, unread = () => 0, current = () => false, can = () => true } = {}) {
  const like = list.querySelector(':scope > template')?.content.firstElementChild;
  const action = list.getAttribute('action'), icon = list.getAttribute('icon'), picture = list.getAttribute('picture') ?? 'person-portrait';
  const had = new Map([...list.querySelectorAll(':scope > list-row')].map(r => [r.who, r]));
  const pick = (row, name) => list.dispatchEvent(new CustomEvent('pick', { detail: { person: row.person, action: name } }));
  const set = (e, text) => { if (e.textContent !== text) e.textContent = text; };
  const rows = people.map(p => {
    let row = had.get(keyOf(p));
    if (row) had.delete(keyOf(p));
    else {
      row = like?.cloneNode(true) ?? el('list-row', {}, el(picture), el('row-title'), el('row-note'), el('button', { primary: true, type: 'button' }, icon ? sheetIcon(icon) : '', action));
      row.who = keyOf(p);
      row.querySelector('row-title').replaceChildren(el('span'), el('unread-badge', { hidden: true }));
      for (const b of row.querySelectorAll('button')) b.addEventListener('click', e => { e.stopPropagation(); pick(row, b.name); });
      // <list-row press>: the whole row is the key
      if (row.hasAttribute('press')) row.addEventListener('click', () => pick(row, ''));
    }
    row.person = p;
    const face = row.firstElementChild, n = unread(p), says = state(p), title = row.querySelector('row-title'), note = row.querySelector('row-note');
    set(face, (p.name || '?')[0].toUpperCase());
    face.toggleAttribute('online', !!p.online);
    face.toggleAttribute('relay', !!p.online && String(p.path?.via ?? '').startsWith('relay'));
    face.toggleAttribute('group', !!p.group);
    row.toggleAttribute('current', !!current(p));
    set(title.firstElementChild, p.name);
    const badge = title.lastElementChild;
    badge.hidden = !n; set(badge, n ? String(n) : ''); badge.ariaLabel = n ? `${n} new` : null;
    set(note, says.text ?? says);
    for (const tone of ['ok', 'warn', 'bad']) note.toggleAttribute(tone, says.tone === tone);
    for (const b of row.querySelectorAll('button')) { const off = !can(p, b); if (b.disabled !== off) b.disabled = off; }
    return row;
  });
  for (const gone of had.values()) gone.remove();
  // put in order only where the order changed: moving a row drops the keyboard's place on it
  rows.forEach((row, i) => { const at = list.querySelectorAll(':scope > list-row')[i]; if (at !== row) list.insertBefore(row, at ?? null); });
}
