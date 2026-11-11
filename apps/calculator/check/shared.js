// Stands in for the call's host (the desk's call): every press from either frame comes here, goes in one list, and
// goes back to every frame in that order; a frame that says it's ready is told to share and given the list so far.
const pair = document.querySelector('check-pair');
const log = document.querySelector('#log');
const presses = [];
const frames = [];

function add() {
  const f = document.createElement('iframe');
  f.src = '../index.html';
  f.title = `Calculator ${frames.length + 1}`;
  f.setAttribute('sandbox', 'allow-scripts allow-forms');
  pair.append(f);
  frames.push(f);
}
addEventListener('message', e => {
  const f = frames.find(x => x.contentWindow === e.source);
  if (!f || !e.data) return;
  if (e.data.x4 === 'ready') {
    f.contentWindow.postMessage({ x4: 'share' }, '*');
    for (const key of presses) f.contentWindow.postMessage({ x4: 'press', key }, '*');
  }
  if (e.data.x4 === 'press' && typeof e.data.key === 'string') {
    presses.push(e.data.key);
    log.textContent = presses.join(' ');
    for (const x of frames) x.contentWindow.postMessage({ x4: 'press', key: e.data.key }, '*');
  }
});
document.querySelector('#join').addEventListener('click', add);
add(); add();
window.check = { frames, presses };
