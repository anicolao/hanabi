// SPDX-License-Identifier: GPL-3.0-only
import { cardsForSet, artworkPath } from './deck.js';
const liveColours={red:'#ff0000',yellow:'#ffdf00',green:'#02ca00',blue:'#0037ff',white:'#d9d9d9',black:'#111111'};
export function colourCalibration(set) {
 const suits=[...new Map(cardsForSet(set).map(card=>[card.suit.id,card.suit])).values()];
 const samples=suits.map(suit=>({id:`${suit.id}-5`,label:suit.name}));
 if(samples.length<6)samples.push({id:'back',label:'Shared back'});
 const swatches=suits.map(suit=>{
  const rainbow=suit.id==='multicolour',colour=(set==='live'||set==='minh'?liveColours[suit.id]:suit.color);
  return `<div class="colour-swatch"><span style="background:${rainbow?'linear-gradient(90deg,#ff2424,#ffd500,#00c83c,#087bff,#a52fe3)':colour}"></span><small>${suit.name}${rainbow?'':` · ${colour.toUpperCase()}`}</small></div>`;
 }).join('');
 const gray=Array.from({length:11},(_,i)=>{const value=Math.round(255*i/10);return `<div class="gray-swatch"><span style="background:rgb(${value},${value},${value})"></span><small>${i*10}%</small></div>`;}).join('');
 const el=document.createElement('section');el.className='print-page calibration-page';el.dataset.side='calibration';
 el.innerHTML=`<h2>Hanabi · Colour calibration</h2><p>Print one-sided at 100% / actual size, with background graphics on. Use the same paper, ink and printer settings as the deck; compare after laminating if applicable.</p><div class="calibration-samples">${samples.map(sample=>`<figure><img src="${artworkPath(sample.id,set)}" alt="${sample.label} calibration sample" width="630" height="880"><figcaption>${sample.label} · 63 × 88 mm</figcaption></figure>`).join('')}</div><h3>Source RGB colour swatches</h3><div class="colour-swatches">${swatches}</div><h3>Neutral greys · black to paper white</h3><div class="gray-swatches">${gray}</div><div class="scale-check">100 mm · measure between the end ticks</div><p class="calibration-note">Check that the suits stay distinct, rainbow numbers are readable, and grey steps remain neutral and distinguishable. Adjust the printer settings and reprint to compare. This is a visual test sheet, not a measured printer colour profile.</p><div class="page-label">HANABI · COLOUR CALIBRATION · SINGLE-SIDED · 100% SCALE</div>`;
 return el;
}
