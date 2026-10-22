// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync, writeFileSync } from 'node:fs';
import { cards } from '../dist/deck.js';
const out=new URL('../dist/assets/painted/',import.meta.url);
const wrap=(id,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 630 880" role="img" aria-labelledby="title"><title id="title">${id} · painted artwork</title><defs><filter id="mono"><feColorMatrix type="saturate" values="0"/></filter></defs>${body}</svg>`;
for(const card of cards){
 const image=readFileSync(new URL(`${card.id}.jpg`,out)).toString('base64');
 for(const mono of [false,true]){
 const ink=mono?'#111':card.suit.color;
 const badge=`<rect x="22" y="22" width="126" height="164" rx="12" fill="#fffdf7"/><text x="85" y="139" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="124" font-weight="700" fill="${ink}">${card.rank}</text><text x="85" y="166" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" font-weight="700" fill="#111">${card.suit.name.toUpperCase()}</text>`;
 writeFileSync(new URL(`${card.id}${mono?'-mono':''}.svg`,out),wrap(`${card.suit.name} ${card.rank}`,`<image href="data:image/jpeg;base64,${image}" width="630" height="880" preserveAspectRatio="xMidYMid slice"${mono?' filter="url(#mono)"':''}/><rect x="5" y="5" width="620" height="870" fill="none" stroke="#111" stroke-width="10"/>${badge}<g transform="translate(630 880) rotate(180)">${badge}</g>`));
 }
}
const back=readFileSync(new URL('back.jpg',out)).toString('base64');
for(const mono of [false,true])writeFileSync(new URL(`back${mono?'-mono':''}.svg`,out),wrap('Shared back',`<g${mono?' filter="url(#mono)"':''}><image href="data:image/jpeg;base64,${back}" width="630" height="880" preserveAspectRatio="xMidYMid slice"/><image href="data:image/jpeg;base64,${back}" width="630" height="880" preserveAspectRatio="xMidYMid slice" transform="translate(630 880) rotate(180)" opacity=".5"/></g><rect x="5" y="5" width="620" height="870" fill="none" stroke="#111" stroke-width="10"/>`));
console.log('Framed 25 distinct generated paintings and a common back.');
