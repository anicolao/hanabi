import test from 'node:test';
import assert from 'node:assert/strict';
import { cards, papers, makeSheets, suits } from '../dist/deck.js';
test('base deck has the correct 50-card distribution',()=>{
  assert.equal(cards.length,25);
  for(const suit of suits) assert.deepEqual(cards.filter(c=>c.suit===suit).flatMap(c=>Array(c.copies).fill(c.rank)),[1,1,1,2,2,3,3,4,4,5]);
  assert.equal(cards.reduce((sum,c)=>sum+c.copies,0),50);
});
for(const paper of ['a4','letter']) {
  test(`${paper}: six pairs, all 50 copies, mirrored partial-sheet slots`,()=>{
    const pages=makeSheets(cards,{paper}); assert.equal(pages.length,12);
    assert.equal(pages.filter(p=>p.side==='front').flatMap(p=>p.items).length,50);
    assert.equal(pages[10].items.length,5);
    for(let i=0;i<12;i+=2) {
      const front=pages[i],back=pages[i+1];
      for(let j=0;j<front.items.length;j++) {
        const a=front.items[j],b=back.items[j];
        assert.equal(a.card.id,b.card.id);
        assert.ok(Math.abs(a.x+b.x+63-papers[paper].width)<1e-9);
        assert.equal(a.y,b.y);
        assert.ok(a.x>=4&&a.y>=4&&a.x+63<=papers[paper].width-4&&a.y+88<=papers[paper].height-4);
      }
    }
  });
}
test('separate front and back jobs retain all sheets in matching order',()=>{
  const front=makeSheets(cards,{side:'front'}),back=makeSheets(cards,{side:'back'});
  assert.equal(front.length,6);assert.equal(back.length,6);
  assert.deepEqual(front.map(p=>p.items.map(i=>i.card.id)),back.map(p=>p.items.map(i=>i.card.id)));
});
test('back calibration applies in paper coordinates without moving fronts',()=>{
  const zero=makeSheets(),offset=makeSheets(cards,{x:1.25,y:-2.5});
  assert.deepEqual(zero[0],offset[0]);
  for(let i=1;i<zero.length;i+=2) for(let j=0;j<zero[i].items.length;j++) {
    assert.equal(offset[i].items[j].x,zero[i].items[j].x+1.25);
    assert.equal(offset[i].items[j].y,zero[i].items[j].y-2.5);
  }
});
test('sampler and filtered selections preserve selected cards and multiplicities',()=>{
  const sample=makeSheets(cards,{quantity:'catalog',side:'front'});assert.equal(sample.length,3);assert.equal(sample.flatMap(p=>p.items).length,25);
  const filtered=makeSheets(cards.filter(c=>c.suit.id==='blue'&&c.rank===5));
  assert.equal(filtered.length,2);assert.equal(filtered[0].items.length,1);
});
