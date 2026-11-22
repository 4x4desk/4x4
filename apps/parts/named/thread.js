// A thread: a conversation on screen, yours on the right, and the box to write in (../README.md › The parts).
// Any element whose last word is `thread` is one (chat-thread, group-chat-thread). The page writes its inside;
// the thread fills the log and sends what is written:
//
//   <chat-thread>
//     <thread-log empty="Nothing written yet."></thread-log>
//     <form>
//       <button type="button" name="add">Add</button>          (only where a file can be sent)
//       <input type="file" name="files" multiple hidden>
//       <textarea name="text" rows="1" placeholder="Write…" aria-label="Write"></textarea>
//       <button primary>Send</button>
//     </form>
//     <output></output>
//   </chat-thread>
//
//   thread.send = async text => …    what to do with a line; if it throws, the line stays in the box and the
//                                    output says why
//   thread.file = async file => …    what to do with a file the person chose with Add, dropped on the thread or
//                                    pasted into the box; if it throws, the output says why. Without it, and
//                                    without an Add button, a thread carries words only
//   thread.show(lines)               lines as a talks.js conversation gives them: { key, from, at, text, mine };
//                                    call again with the whole list on every change. A line with `file`
//                                    ({ hash, name, size, files }) shows the picture, the video, or a link to it
//                                    (/api/file/HASH: x4-p2p fetches it from the person's devices if it isn't here)
//   thread.say(text)                 the quiet line under the box; '' clears it
//   thread.focus()
//
// Enter sends; Shift+Enter makes a new line. A screen reader hears the log, each new line as it arrives.
import { kind, el } from './named.js';

const when = ms => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const sizeOf = n => (n < 1e3 ? `${n} bytes` : n < 1e6 ? `${(n / 1e3).toFixed(0)} KB` : n < 1e9 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e9).toFixed(2)} GB`);
const sortOf = name => { const x = name.split('.').pop().toLowerCase(); return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(x) ? 'image' : ['mp4', 'webm', 'mov'].includes(x) ? 'video' : ['mp3', 'm4a', 'wav', 'ogg'].includes(x) ? 'audio' : 'file'; };
// A file in a line: the picture, the video or the sound itself, then its name as a link that saves it
function fileOf(f) {
  const url = `/api/file/${f.hash}`, sort = f.files > 1 ? 'folder' : sortOf(f.name);
  const label = f.files > 1 ? `${f.name}, ${f.files} files, ${sizeOf(f.size)}` : `${f.name}, ${sizeOf(f.size)}`;
  return el('line-file', {},
    sort === 'image' ? el('a', { href: url, target: '_blank' }, el('img', { src: url, alt: f.name, loading: 'lazy' })) : '',
    sort === 'video' ? el('video', { src: url, controls: true, preload: 'metadata' }) : '',
    sort === 'audio' ? el('audio', { src: url, controls: true, preload: 'none' }) : '',
    sort === 'folder' ? el('span', { text: `${label} (x4-p2p get ${f.hash.slice(0, 12)}…)` }) : el('a', { href: url, download: f.name, text: label }));
}

kind('thread', { life: {
  connected() {
    const form = this.querySelector(':scope > form'), box = form?.elements.text, why = this.querySelector(':scope > output');
    if (!box || this.shown !== undefined) return;
    this.shown = '';
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const text = box.value.trim(), keys = [box, ...form.querySelectorAll('button')];
      if (!text) return;
      for (const k of keys) k.disabled = true;
      try { await this.send?.(text); box.value = ''; why.value = ''; }
      catch (err) { why.value = `Not sent: ${err.message}`; }
      finally { for (const k of keys) k.disabled = false; box.focus(); }
    });
    // Files: the Add button, a drop on the thread, a picture pasted into the box
    const files = async list => {
      for (const f of list) {
        why.value = `Sending ${f.name} (${sizeOf(f.size)})…`;
        try { if (!this.file) throw new Error('this conversation carries words only'); await this.file(f); why.value = ''; }
        catch (err) { why.value = `${f.name} not sent: ${err.message}`; return; }
      }
    };
    const add = form.elements.add, pick = form.elements.files;
    if (add && pick) { add.addEventListener('click', () => pick.click()); pick.addEventListener('change', () => { files([...pick.files]); pick.value = ''; }); }
    this.addEventListener('dragover', e => { if (this.file && e.dataTransfer?.types.includes('Files')) { e.preventDefault(); this.setAttribute('dropping', ''); } });
    this.addEventListener('dragleave', e => { if (!this.contains(e.relatedTarget)) this.removeAttribute('dropping'); });
    this.addEventListener('drop', e => { this.removeAttribute('dropping'); if (this.file && e.dataTransfer?.files.length) { e.preventDefault(); files([...e.dataTransfer.files]); } });
    box.addEventListener('paste', e => { const fs = [...(e.clipboardData?.files ?? [])]; if (this.file && fs.length) { e.preventDefault(); files(fs); } });
  },
  say(text) { const why = this.querySelector(':scope > output'); if (why) why.value = text; },
  show(lines) {
    const key = lines.map(l => l.key).join('\n'), log = this.querySelector(':scope > thread-log');
    if (key === this.shown && log.childElementCount === lines.length) return;
    const atEnd = !this.shown || log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    this.shown = key;
    log.replaceChildren(...lines.map(l => el('log-line', { mine: !!l.mine }, el('b', {}, l.from, el('time', { text: when(l.at) })), l.file ? fileOf(l.file) : '', l.text ?? '')));
    if (atEnd) log.scrollTop = log.scrollHeight;
  },
  focus() { this.querySelector('textarea')?.focus(); },
} });
