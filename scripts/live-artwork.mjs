// SPDX-License-Identifier: GPL-3.0-only
// Print adaptation of Hanab Live's counted-pip layout. See references/hanab-live/README.md.
import { mkdirSync, writeFileSync } from 'node:fs';
import { DRAW_PIP_FUNCTIONS } from '../references/hanab-live/pips.js';
import { cards, minhCards } from '../dist/deck.js';

// Record the upstream Canvas paths as SVG paths, applying their affine transforms.
class PathRecorder {
  constructor(){this.sx=1;this.sy=1;this.tx=0;this.ty=0;this.path='';}
  beginPath(){this.path='';}
  scale(x,y){this.sx*=x;this.sy*=y;}
  translate(x,y){this.tx+=this.sx*x;this.ty+=this.sy*y;}
  point(x,y){return `${(this.sx*x+this.tx).toFixed(4)} ${(this.sy*y+this.ty).toFixed(4)}`;}
  moveTo(x,y){this.path+=`M${this.point(x,y)}`;}
  bezierCurveTo(a,b,c,d,e,f){this.path+=`C${this.point(a,b)} ${this.point(c,d)} ${this.point(e,f)}`;}
  closePath(){this.path+='Z';}
}
const names={red:'hanabiRed1',yellow:'hanabiYellow2',green:'hanabiGreen3',blue:'hanabiBlue4',white:'hanabiWhite5'};
const colors={red:'#ff0000',yellow:'#ffdf00',green:'#02ca00',blue:'#0037ff',white:'#d9d9d9'};
const paths=Object.fromEntries(Object.entries(names).map(([suit,name])=>{const ctx=new PathRecorder();DRAW_PIP_FUNCTIONS[name](ctx);return [suit,ctx.path];}));
paths.multicolour=paths.white;
colors.multicolour='url(#rainbow)';
const rainbow='<defs><linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3535"/><stop offset=".25" stop-color="#ffdf00"/><stop offset=".5" stop-color="#02ca00"/><stop offset=".75" stop-color="#1683ff"/><stop offset="1" stop-color="#ae46df"/></linearGradient></defs>';
function pip(suit,x,y,scale,flip=false,mono=false){return `<g transform="translate(${x} ${y}) rotate(${flip?180:0}) scale(${scale})"><path d="${paths[suit]}" fill="${mono?'#fff':colors[suit]}" stroke="#111" stroke-width="3" stroke-linejoin="round"/></g>`;}
for(const [set,selection] of [['live',cards],['minh',minhCards]]) {
const out=new URL(`../dist/assets/${set}/`,import.meta.url);mkdirSync(out,{recursive:true});
for(const card of selection)for(const mono of [false,true]){
 const {rank,suit}=card,color=mono?'#111':colors[suit.id];let pips='';
 if(rank===1)pips=pip(suit.id,143,203,.72,false,mono);
 if(rank===2)pips=pip(suit.id,143,113,.56,false,mono)+pip(suit.id,143,293,.56,true,mono);
 if(rank>=3)pips=pip(suit.id,143,83,.4,false,mono)+pip(suit.id,143,323,.4,true,mono);
 if(rank>=4)pips+=pip(suit.id,53,203,.4,false,mono)+pip(suit.id,233,203,.4,true,mono);
 if(rank===3||rank===5)pips+=pip(suit.id,143,203,.48,false,mono);
 const face=set==='minh'
  ? `<rect width="286" height="406" fill="#000"/><rect x="14" y="14" width="258" height="378" rx="18" fill="white"/><rect x="14" y="14" width="258" height="378" rx="18" fill="${color}" fill-opacity="${mono?0:.22}"/>`
  : `<rect width="286" height="406" fill="#151515"/><rect x="4" y="4" width="278" height="398" rx="24" fill="white"/><rect x="4" y="4" width="278" height="398" rx="24" fill="${color}" fill-opacity="${mono?0:.22}" stroke="${color}" stroke-opacity=".7" stroke-width="4"/>`;
 const label=set==='minh'?'':`<text x="143" y="389" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" fill="#111">${suit.name.toUpperCase()}</text>`;
 const numeral=`<text x="19" y="110" font-family="Arial,Helvetica,sans-serif" font-size="128" font-weight="700" fill="${suit.id==='multicolour'?'#111':color}" stroke="#111" stroke-width="2.4" paint-order="stroke fill">${rank}</text>`;
 writeFileSync(new URL(`${card.id}${mono?'-mono':''}.svg`,out),`<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 286 406" preserveAspectRatio="none" role="img" aria-labelledby="title"><title id="title">${suit.name} ${rank} · Hanab Live style</title>${suit.id==='multicolour'?rainbow:''}${face}${numeral}<g transform="translate(286 406) rotate(180)">${numeral}</g>${pips}${label}</svg>`);
}
for(const mono of [false,true]){
 let pips='';for(let i=0;i<5;i++){const angle=i*Math.PI*2/5-Math.PI/2;pips+=pip(Object.keys(names)[i],143+70*Math.cos(angle),203+70*Math.sin(angle),.35,false,true);}
 const backFace=set==='minh'
  ? `<rect width="286" height="406" fill="#000"/><rect x="14" y="14" width="258" height="378" rx="18" fill="${mono?'#fff':'#929292'}"/>`
  : `<rect width="286" height="406" fill="${mono?'#fff':'#777'}"/><rect x="5" y="5" width="276" height="396" rx="24" fill="${mono?'#fff':'#929292'}" stroke="#222" stroke-width="5"/>`;
 writeFileSync(new URL(`back${mono?'-mono':''}.svg`,out),`<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 286 406" preserveAspectRatio="none" role="img" aria-labelledby="title"><title id="title">Shared back · Hanab Live style</title>${backFace}${pips}</svg>`);
}
}
console.log('Generated Hanab Live style fronts and shared backs.');
