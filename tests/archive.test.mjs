import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { makeZip, crc32, setPngDpi } from '../dist/archive.js';
import { mpcDeck, mpcSpec } from '../dist/mpc.js';
test('ZIP output is readable by Python standard zipfile with valid contents and CRCs',async()=>{
 const binary=Uint8Array.from([0,1,2,255,128]);
 const zip=makeZip([{name:'fronts/001-red-1.png',data:binary},{name:'README.txt',data:'Hanabi — 50 cards'}]);
 const result=spawnSync('python3',['-c',`import io,sys,zipfile,json
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as z:
 assert z.testzip() is None
 assert z.namelist()==['fronts/001-red-1.png','README.txt']
 assert z.read('fronts/001-red-1.png')==bytes([0,1,2,255,128])
 assert z.read('README.txt').decode()=='Hanabi — 50 cards'
print('valid')`],{input:Buffer.from(await zip.arrayBuffer()),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'valid');
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
});
test('MPC deck expands the full 50-card multiset into stable one-file-per-slot names',()=>{
 const deck=mpcDeck();assert.equal(deck.length,50);assert.equal(new Set(deck.map(c=>c.file)).size,50);
 for(const suit of ['red','yellow','green','blue','white']){
  const suitCards=deck.filter(c=>c.card.suit.id===suit);assert.deepEqual(suitCards.map(c=>c.card.rank),[1,1,1,2,2,3,3,4,4,5]);
 }
 assert.equal(deck[0].file,'fronts/001-red-1-copy-1.png');assert.equal(deck[49].file,'fronts/050-white-5-copy-1.png');
});
test('MPC uses the 63 x 88 template with centred trim, bleed and conservative safe area',()=>{
 assert.equal(mpcSpec.width,816);assert.equal(mpcSpec.height,1110);assert.equal(mpcSpec.dpi,300);
 assert.equal(mpcSpec.trimWidth+2*mpcSpec.bleed,mpcSpec.width);assert.equal(mpcSpec.trimHeight+2*mpcSpec.bleed,mpcSpec.height);
 assert.equal(mpcSpec.safeInset,2*mpcSpec.bleed);
});
test('PNG physical resolution is replaced by one valid 300 dpi chunk',()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC2kAAAAASUVORK5CYII=','base64');
 const once=setPngDpi(png),twice=setPngDpi(once);assert.deepEqual(once,twice);
 let found=0;
 for(let at=8;at<twice.length;){const view=new DataView(twice.buffer),len=view.getUint32(at),name=String.fromCharCode(...twice.subarray(at+4,at+8));if(name==='pHYs'){found++;assert.equal(view.getUint32(at+8),11811);assert.equal(view.getUint32(at+12),11811);assert.equal(twice[at+16],1);assert.equal(view.getUint32(at+17),crc32(twice.subarray(at+4,at+17)));}at+=len+12;}
 assert.equal(found,1);
});

test('Minh MPC distribution replaces grey with five unique multicolour cards',()=>{
 const deck=mpcDeck('minh');assert.equal(deck.length,55);
 assert.deepEqual(deck.filter(c=>c.card.suit.id==='multicolour').map(c=>c.card.rank),[1,2,3,4,5]);
 assert.equal(deck.filter(c=>c.card.suit.id==='white').length,0);
 for(const suit of ['red','yellow','green','blue','black'])assert.deepEqual(deck.filter(c=>c.card.suit.id===suit).map(c=>c.card.rank),[1,1,1,2,2,3,3,4,4,5]);
});
