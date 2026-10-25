import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cards, minhCards } from '../dist/deck.js';
const root=new URL('../dist/assets/',import.meta.url);
test('every artwork set has all 25 faces, common backs, and monochrome variants',()=>{
 for(const directory of ['cards','live','painted','diagonal'])for(const id of [...cards.map(c=>c.id),'back'])for(const suffix of ['','-mono']){
  const url=new URL(`${directory}/${id}${suffix}.svg`,root);assert.ok(existsSync(url),url.pathname);
  const svg=readFileSync(url,'utf8');assert.match(svg,/<svg/);assert.match(svg,/width="63mm" height="88mm"/);assert.match(svg,/<title/);
  if(directory==='painted'||directory==='diagonal'){assert.match(svg,/data:image\/jpeg;base64,/);assert.doesNotMatch(svg,/<image href="(?!data:)/);}
 }
});
test('painted set contains 25 independent images and recorded generation prompts',()=>{
 const hashes=cards.map(card=>createHash('sha256').update(readFileSync(new URL(`painted/${card.id}.jpg`,root))).digest('hex'));
 assert.equal(new Set(hashes).size,25);
 const manifest=JSON.parse(readFileSync(new URL('../artwork/prompts.json',import.meta.url),'utf8'));
 assert.equal(manifest.images.length,26);assert.equal(manifest.tool,'Built-in image_gen.imagegen');
 for(const card of cards){const prompt=manifest.images.find(i=>i.id===card.id);assert.ok(prompt?.prompt);assert.match(prompt.prompt,new RegExp(card.id==='red-1'?'red colour, value 1':card.id));}
});

test('diagonal cards retain each painting and add two black rank fields and suit icons',()=>{
 for(const card of cards){
  const svg=readFileSync(new URL(`diagonal/${card.id}.svg`,root),'utf8');
  assert.equal((svg.match(/class="number-field"/g)||[]).length,2);
  assert.equal((svg.match(/class="suit-icon"/g)||[]).length,2);
  assert.match(svg,/fill="#080d12"/);assert.match(svg,/translate\(630 880\) rotate\(180\)/);
  const embedded=svg.match(/data:image\/jpeg;base64,([^" ]+)/)[1];
  assert.deepEqual(Buffer.from(embedded,'base64'),readFileSync(new URL(`painted/${card.id}.jpg`,root)));
 }
});

test('Minh artwork has rainbow pips, rainbow numbers, and monochrome counterparts',()=>{
 for(const card of minhCards)for(const suffix of ['','-mono'])assert.ok(existsSync(new URL(`minh/${card.id}${suffix}.svg`,root)));
 for(let rank=1;rank<=5;rank++){
  const svg=readFileSync(new URL(`minh/multicolour-${rank}.svg`,root),'utf8');
  assert.match(svg,/linearGradient id="rainbow"/);assert.match(svg,/fill="url\(#rainbow\)"/);assert.match(svg,/<text[^>]*fill="url\(#rainbow-number\)"/);
 }
});

test('Minh faces have reversible corner suit icons and six distinct silhouettes',()=>{
 const shapes=new Set();
 for(const card of minhCards){
  const svg=readFileSync(new URL(`minh/${card.id}.svg`,root),'utf8');
  assert.equal((svg.match(/class="corner-suit-icon"/g)||[]).length,2);
  if(card.rank===1)shapes.add(svg.match(/class="corner-suit-icon".*?<path d="([^"]+)"/)[1]);
 }
 assert.equal(shapes.size,6);
});
