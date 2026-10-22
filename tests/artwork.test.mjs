import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { cards } from '../dist/deck.js';
const root=new URL('../dist/assets/',import.meta.url);
test('every artwork set has all 25 faces, common backs, and monochrome variants',()=>{
 for(const directory of ['cards','live','painted'])for(const id of [...cards.map(c=>c.id),'back'])for(const suffix of ['','-mono']){
  const url=new URL(`${directory}/${id}${suffix}.svg`,root);assert.ok(existsSync(url),url.pathname);
  const svg=readFileSync(url,'utf8');assert.match(svg,/<svg/);assert.match(svg,/width="63mm" height="88mm"/);assert.match(svg,/<title/);
  if(directory==='painted'){assert.match(svg,/data:image\/jpeg;base64,/);assert.doesNotMatch(svg,/<image href="(?!data:)/);}
 }
});
test('painted set contains 25 independent images and recorded generation prompts',()=>{
 const hashes=cards.map(card=>createHash('sha256').update(readFileSync(new URL(`painted/${card.id}.jpg`,root))).digest('hex'));
 assert.equal(new Set(hashes).size,25);
 const manifest=JSON.parse(readFileSync(new URL('../artwork/prompts.json',import.meta.url),'utf8'));
 assert.equal(manifest.images.length,26);assert.equal(manifest.tool,'Built-in image_gen.imagegen');
 for(const card of cards){const prompt=manifest.images.find(i=>i.id===card.id);assert.ok(prompt?.prompt);assert.match(prompt.prompt,new RegExp(card.id==='red-1'?'red colour, value 1':card.id));}
});
