// SPDX-License-Identifier: GPL-3.0-only
// The painting is unchanged. This alternate frame places readable ranks/icons on diagonal black fields.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cards } from '../dist/deck.js';
const out=new URL('../dist/assets/diagonal/',import.meta.url);mkdirSync(out,{recursive:true});
const icons={
 red:'<circle r="12" fill="none" stroke="currentColor" stroke-width="4"/>'+Array.from({length:12},(_,i)=>`<path d="M0-20v-8" transform="rotate(${i*30})" stroke="currentColor" stroke-width="3"/>`).join(''),
 yellow:'<path d="M0-30 8-10 30-9 13 5 19 28 0 15-19 28-13 5-30-9-8-10Z" fill="currentColor"/>',
 green:'<path d="M-21 23C-36-5-2-33 27-28 32 4 5 34-21 23Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="m-23 27 38-41M-9 9-14-6M1 0h15" fill="none" stroke="currentColor" stroke-width="3"/>',
 blue:'<path d="M-30-16Q-15-30 0-16T30-16M-30 1Q-15-13 0 1T30 1M-30 18Q-15 4 0 18T30 18" fill="none" stroke="currentColor" stroke-width="4"/>',
 white:'<path d="M0-30 23 0 0 30-23 0Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M0-15 11 0 0 15-11 0Z" fill="currentColor"/>'
};
const accents={red:'#ff8b75',yellow:'#f4d36b',green:'#93dcb0',blue:'#9fd4ff',white:'#eeeae4'};
const wrap=(title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 630 880" role="img" aria-labelledby="title"><title id="title">${title} · diagonal painted frame</title><defs><filter id="mono"><feColorMatrix type="saturate" values="0"/></filter></defs>${body}</svg>`;
for(const card of cards){
 const image=readFileSync(new URL(`../dist/assets/painted/${card.id}.jpg`,import.meta.url)).toString('base64');
 for(const mono of [false,true]){
  const accent=mono?'#eeeae4':accents[card.suit.id];
  const field=`<g class="number-field"><path d="M0 0H280L0 380Z" fill="#080d12"/><path d="M280 0 0 380" fill="none" stroke="${accent}" stroke-width="5"/><path d="M259 0 0 351" fill="none" stroke="${accent}" stroke-width="1" opacity=".4"/><text class="rank" x="54" y="151" fill="#fff9ed" font-family="Arial,Helvetica,sans-serif" font-size="122" font-weight="700">${card.rank}</text><g class="suit-icon" aria-label="${card.suit.motif}" transform="translate(79 215) scale(.77)" color="${accent}">${icons[card.suit.id]}</g></g>`;
  writeFileSync(new URL(`${card.id}${mono?'-mono':''}.svg`,out),wrap(`${card.suit.name} ${card.rank} · ${card.suit.motif}`,`<image href="data:image/jpeg;base64,${image}" width="630" height="880" preserveAspectRatio="xMidYMid slice"${mono?' filter="url(#mono)"':''}/>${field}<g transform="translate(630 880) rotate(180)">${field}</g><rect x="7" y="7" width="616" height="866" rx="6" fill="none" stroke="#080d12" stroke-width="14"/><path d="M28 305V28H220M410 852H602V575" fill="none" stroke="${accent}" stroke-width="1.6" opacity=".65"/>`));
 }
}
const back=readFileSync(new URL('../dist/assets/painted/back.jpg',import.meta.url)).toString('base64');
for(const mono of [false,true])writeFileSync(new URL(`back${mono?'-mono':''}.svg`,out),wrap('Shared back',`<g${mono?' filter="url(#mono)"':''}><image href="data:image/jpeg;base64,${back}" width="630" height="880" preserveAspectRatio="xMidYMid slice"/><image href="data:image/jpeg;base64,${back}" width="630" height="880" preserveAspectRatio="xMidYMid slice" transform="translate(630 880) rotate(180)" opacity=".5"/></g><rect x="7" y="7" width="616" height="866" fill="none" stroke="#080d12" stroke-width="14"/><rect x="24" y="24" width="582" height="832" fill="none" stroke="#e9dec2" stroke-width="1.7" opacity=".8"/>`));
console.log('Generated diagonal painted cards with black number fields and five suit icons.');
