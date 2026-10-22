// SPDX-License-Identifier: GPL-3.0-only
// Original vector art. All coordinates are in a 630 × 880 design space.
import { suits, cards } from '../dist/deck.js';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = new URL('../dist/assets/cards/', import.meta.url);
mkdirSync(out, { recursive: true });
const f = n => Number(n.toFixed(2));
function motif(suit, cx, cy, scale = 1, fill = 'currentColor') {
  const shapes = {
    red: `<circle r="13" fill="none" stroke="${fill}" stroke-width="5"/>${Array.from({length: 12}, (_,i) => `<path d="M0 -21v-9" transform="rotate(${i*30})" stroke="${fill}" stroke-width="4"/>`).join('')}`,
    yellow: `<path d="M0 -32 9 -10 33 -10 14 5 21 29 0 15 -21 29 -14 5 -33 -10 -9 -10Z" fill="${fill}"/>`,
    green: `<path d="M-22 24C-38 -7 -2 -35 29 -30 35 5 6 36-22 24Z" fill="none" stroke="${fill}" stroke-width="5"/><path d="m-24 29 40-43M-9 10-14-6M1 0h16" fill="none" stroke="${fill}" stroke-width="4"/>`,
    blue: `<path d="M-34-16Q-17-32 0-16T34-16M-34 2Q-17-14 0 2T34 2M-34 20Q-17 4 0 20T34 20" fill="none" stroke="${fill}" stroke-width="5"/>`,
    white: `<path d="M0-34 25 0 0 34-25 0Z" fill="none" stroke="${fill}" stroke-width="5"/><path d="M0-19 14 0 0 19-14 0Z" fill="${fill}"/>`
  };
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">${shapes[suit.id]}</g>`;
}
function burst(cx, cy, radius, rank, color) {
  return Array.from({ length: 32 + rank * 8 }, (_, i) => {
    const angle = i * Math.PI * 2 / (32 + rank * 8);
    const r1 = radius * (.29 + (i % 3) * .07), r2 = radius * (.78 + (i % 4) * .07);
    const point = r => `${f(cx+Math.cos(angle)*r)} ${f(cy+Math.sin(angle)*r)}`;
    return `<path d="M${point(r1)}L${point(r2)}" stroke="${color}" stroke-width="${i%3===0?4:2}" opacity="${i%3===0?1:.65}"/><circle cx="${f(cx+Math.cos(angle)*radius*1.06)}" cy="${f(cy+Math.sin(angle)*radius*1.06)}" r="${i%2?2:3}" fill="${color}"/>`;
  }).join('');
}
function face(card, mono = false) {
  const { suit, rank } = card, ink = mono ? '#20232b' : suit.color, glow = mono ? '#52555c' : suit.light;
  const sky = mono ? '#fffdf7' : '#152733', cream = '#fff7e6';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 630 880" role="img" aria-labelledby="title"><title id="title">${suit.name} ${rank} · ${suit.motif}</title>
  <rect width="630" height="880" fill="${mono?'#fffdf7':'#13242e'}"/>
  <rect x="10" y="10" width="610" height="860" rx="20" fill="${mono?'#fffdf7':'#f5eddb'}"/>
  <rect x="93" y="135" width="444" height="610" rx="220" fill="${sky}"/>
  <path d="M104 557Q315 615 526 557M98 580Q315 638 532 580" fill="none" stroke="${glow}" opacity=".2"/>
  ${Array.from({length: 28},(_,i)=>`<circle cx="${120+(i*71)%392}" cy="${190+(i*47)%480}" r="${i%3===0?2:1}" fill="${glow}" opacity=".4"/>`).join('')}
  <path d="M315 699Q274 620 315 499" fill="none" stroke="${glow}" stroke-width="2" stroke-dasharray="4 9"/>
  ${burst(315,365,156,rank,glow)}${rank>=3?burst(178,542,65,rank,glow):''}${rank>=4?burst(449,500,59,rank,glow):''}
  ${motif(suit,315,365,1.45,glow)}
  <g fill="${ink}" font-family="Georgia,serif" text-anchor="middle"><text x="54" y="94" font-size="83">${rank}</text><g transform="translate(630 880) rotate(180)"><text x="54" y="94" font-size="83">${rank}</text></g></g>
  ${motif(suit,54,134,.5,ink)}${motif(suit,576,746,.5,ink)}
  <rect x="245" y="658" width="140" height="105" rx="52" fill="${mono?'#fffdf7':cream}"/>
  <text x="315" y="740" font-family="Georgia,serif" font-size="95" text-anchor="middle" fill="${ink}">${rank}</text>
  <text x="315" y="800" font-family="Arial,sans-serif" font-size="20" letter-spacing="5" text-anchor="middle" fill="${ink}">${suit.name.toUpperCase()} · ${suit.motif.toUpperCase()}</text>
  <g fill="${ink}">${Array.from({length:rank},(_,i)=>`<circle cx="${315+(i-(rank-1)/2)*17}" cy="829" r="4"/>`).join('')}</g></svg>`;
}
function back(mono = false) {
  const ink=mono?'#fffdf7':'#142a36', paper=mono?'#292d32':'#eadbb9';
  const half=`<g>${burst(315,440,181,5,paper)}<circle cx="315" cy="440" r="208" fill="none" stroke="${paper}"/><circle cx="315" cy="440" r="217" fill="none" stroke="${paper}" opacity=".35"/>${Array.from({length:7},(_,i)=>`<path d="M65 ${100+i*32}Q180 ${32+i*32} 315 ${100+i*32}T565 ${100+i*32}" fill="none" stroke="${paper}" opacity=".12"/>`).join('')}<path d="m315 395 31 45-31 45-31-45Z" fill="${ink}" stroke="${paper}" stroke-width="3"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="63mm" height="88mm" viewBox="0 0 630 880" role="img" aria-labelledby="title"><title id="title">Shared card back · two-way firework</title><rect width="630" height="880" fill="${ink}"/><rect x="14" y="14" width="602" height="852" rx="20" fill="none" stroke="${paper}" stroke-width="3"/><rect x="29" y="29" width="572" height="822" rx="12" fill="none" stroke="${paper}" opacity=".35"/>${half}<g transform="translate(630 880) rotate(180)">${half}</g></svg>`;
}
for (const card of cards) for (const mono of [false,true]) writeFileSync(new URL(`${card.id}${mono?'-mono':''}.svg`,out),face(card,mono));
for (const mono of [false,true]) writeFileSync(new URL(`back${mono?'-mono':''}.svg`,out),back(mono));
console.log('Generated 50 front SVGs and 2 shared backs.');
