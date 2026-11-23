#!/usr/bin/env node
// Holds recipes to recipe.schema.json beside this file, with no packages: node check-recipe.mjs <recipe folder>…
// (in the 4x4 repository, with no folder: every one of ours; contracts/recipe/check.mjs runs this). Also: the folder's name is its id, every style and script it
// names is there, nothing in the folder but what the contract lists (and tools/, drive.json, which are never laid).
// Prints one line per fault and exits 1 when there is any.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '..', '..', '..', '..');
const schema = JSON.parse(readFileSync(join(HERE, 'recipe.schema.json'), 'utf8'));
const KEPT = new Set(['recipe.json', 'style', 'script', 'AGENTS.md', 'README.md', 'tools', 'drive.json', 'tpa.json', 'yours.json', 'icon.png', 'icon.svg']);   // the last two: the desk's, in a person's folder
const folders = process.argv.length > 2 ? process.argv.slice(2) : !existsSync(join(ROOT, 'recipes')) ? (console.error('Say which recipe folder: node check-recipe.mjs <folder>'), process.exit(2)) : readdirSync(join(ROOT, 'recipes')).map(n => join(ROOT, 'recipes', n)).filter(p => statSync(p).isDirectory());

function fits(v, s, at, out) {
  const type = Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
  if (s.type && s.type !== type) return out.push(`${at}: should be ${s.type}, is ${type}`);
  if (s.pattern && !new RegExp(s.pattern).test(v)) out.push(`${at}: "${v}" is not of the form ${s.pattern}`);
  if (s.minLength && v.length < s.minLength) out.push(`${at}: empty`);
  if (type === 'array' && s.items) v.forEach((x, i) => fits(x, s.items, `${at}[${i}]`, out));
  if (type === 'object') {
    for (const k of s.required ?? []) if (!(k in v)) out.push(`${at}: needs "${k}"`);
    for (const [k, x] of Object.entries(v)) {
      if (s.properties?.[k]) fits(x, s.properties[k], at ? `${at}.${k}` : k, out);
      else if (s.additionalProperties === false) out.push(`${at || 'recipe'}: "${k}" is not a recipe key (contracts/recipe › recipe.json)`);
    }
  }
}

let faults = 0;
for (const dir of folders) {
  const out = [], name = basename(dir);
  let r;
  try { r = JSON.parse(readFileSync(join(dir, 'recipe.json'), 'utf8')); } catch (e) { out.push(`recipe.json: ${e.message}`); }
  if (r) {
    fits(r, schema, '', out);
    if (r.id && r.id !== name && !existsSync(join(dir, 'tpa.json'))) out.push(`id "${r.id}" is not the folder's name "${name}"`);
    for (const f of [...(r.style ?? []), ...(r.script ?? [])]) if (!existsSync(join(dir, f))) out.push(`${f}: named, not there`);
  }
  for (const f of readdirSync(dir)) if (!KEPT.has(f) && !f.startsWith('.')) out.push(`${f}: not part of a recipe (contracts/recipe › The folder)`);
  for (const line of out) console.log(`${name}: ${line}`);
  faults += out.length;
  if (!out.length) console.log(`${name}: fits`);
}
process.exit(faults ? 1 : 0);
