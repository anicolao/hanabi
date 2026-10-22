// SPDX-License-Identifier: GPL-3.0-only
import { suits, cards, papers, makeSheets } from './deck.js';
const $ = selector => document.querySelector(selector);
let activeSuit = 'all', activeRank = 'all', pageIndex = 0, pages = [];
const path = (id, mono = false) => `assets/cards/${id}${mono ? '-mono' : ''}.svg`;
const visibleCards = () => cards.filter(card => (activeSuit === 'all' || card.suit.id === activeSuit) && (activeRank === 'all' || card.rank === Number(activeRank)));
for (const suit of suits) {
  const button = document.createElement('button');
  button.className = 'chip'; button.dataset.suit = suit.id; button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<span class="suit-dot" style="--suit-color:${suit.color}" aria-hidden="true"></span>${suit.name}`;
  $('.suit-filters').append(button);
}
function gallery() {
  const visible = visibleCards();
  const copies = visible.reduce((sum, c) => sum + c.copies, 0);
  $('#gallery-count').textContent = `${visible.length} unique ${visible.length === 1 ? 'front' : 'fronts'} · ${copies} playing ${copies === 1 ? 'card' : 'cards'}`;
  $('#card-grid').replaceChildren(...visible.map(card => {
    const button = document.createElement('button');
    button.className = 'card-tile'; button.setAttribute('aria-label', `Inspect ${card.suit.name} ${card.rank}, ${card.suit.motif}, ${card.copies} ${card.copies === 1 ? 'copy' : 'copies'}`);
    button.innerHTML = `<span class="card-mat"><img src="${path(card.id)}" alt="${card.suit.name} ${card.rank} · ${card.suit.motif}" loading="lazy" width="630" height="880"></span><span class="card-label"><span>${card.suit.name} / ${String(card.rank).padStart(2,'0')}</span><small>${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} ↗</small></span>`;
    button.onclick = () => detail(card);
    return button;
  }));
  if ($('#quantity').value === 'filtered') updatePrint();
}
$('.suit-filters').onclick = event => {
  const button = event.target.closest('button'); if (!button) return;
  activeSuit = button.dataset.suit;
  for (const chip of document.querySelectorAll('.chip')) { const active = chip === button; chip.classList.toggle('active', active); chip.setAttribute('aria-pressed', String(active)); }
  gallery();
};
$('#rank').onchange = event => { activeRank = event.target.value; gallery(); };
function detail(card) {
  const back = !card, id = back ? 'back' : card.id;
  $('#detail-image').src = path(id); $('#detail-image').alt = back ? 'Shared two-way firework card back' : `${card.suit.name} ${card.rank}, ${card.suit.motif}`;
  $('#dialog-title').textContent = back ? 'One shared sky.' : `${card.suit.name} ${card.rank}`;
  $('#detail-description').textContent = back ? 'One identical, rotationally symmetric back for every card. Use opaque stock or sleeves to keep every hand hidden. 63 × 88 mm, editable SVG.' : `${card.suit.motif} suit · ${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} in the deck. The colour, written suit name, symbol, and rank work together so you can read this card in more than one way. 63 × 88 mm, editable SVG.`;
  $('#download-card').href = path(id); $('#download-card').download = `hanabi-${id}.svg`;
  $('#card-dialog').showModal();
}
$('#view-back').onclick = () => detail(null);
$('#close-dialog').onclick = () => $('#card-dialog').close();
$('#card-dialog').onclick = event => { if (event.target === $('#card-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } };
function options() {
  const clamp = value => Math.max(-5, Math.min(5, Number(value) || 0));
  return { paper: $('#paper').value, quantity: $('#quantity').value, side: $('#side').value, x: clamp($('#offset-x').value), y: clamp($('#offset-y').value), mono: $('#ink').value === 'mono' };
}
function marks(page, paper, opt) {
  const { width, height } = papers[paper];
  const x = (width-189)/2 + (page.side === 'back' ? opt.x : 0), y = (height-264)/2 + (page.side === 'back' ? opt.y : 0);
  let lines = '';
  const line = (x1,y1,x2,y2) => { lines += `<path d="M${x1} ${y1}L${x2} ${y2}"/>`; };
  for (let col=0; col<=3; col++) { const xx=x+col*63; line(xx,y-3.5,xx,y-1.5); line(xx,y+265.5,xx,y+267.5); }
  for (let row=0; row<=3; row++) { const yy=y+row*88; line(x-3.5,yy,x-1.5,yy); line(x+190.5,yy,x+192.5,yy); }
  // Small white diamonds provide front/back alignment targets at every grid intersection.
  let diamonds = '';
  for (let col=0;col<=3;col++) for (let row=0;row<=3;row++) diamonds += `<path d="m${x+col*63} ${y+row*88-0.65} .65 .65 -.65 .65 -.65 -.65Z" fill="white" stroke="#333" stroke-width=".1"/>`;
  return `<svg class="crop-marks" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="black" stroke-width=".15">${lines}</g>${diamonds}</svg>`;
}
function tokenPage(opt) {
  const el = document.createElement('section'); el.className = `print-page token-page${opt.mono ? ' mono' : ''}`;
  el.innerHTML = `<h2>A few little sparks.</h2><p>HANABI · 8 clue markers + 3 fuse markers · 22 mm diameter<br>Print one-sided at 100% scale. Cut around the dotted circles.</p><h3>Clues / available ↔ spent</h3><p>Move clue tokens between an “available” and a “spent” area of the table.</p><div class="token-row">${Array.from({length:8},()=>'<div class="token"><span>✦</span><small>CLUE</small></div>').join('')}</div><h3>Fuses / three chances</h3><p>Set these aside. Move one to the centre after each unsuccessful play.</p><div class="token-row">${Array.from({length:3},()=>'<div class="token fuse"><span>✳</span><small>FUSE</small></div>').join('')}</div><hr><h3>Before the show</h3><p>50 cards: five colours, each with 1 · 1 · 1 · 2 · 2 · 3 · 3 · 4 · 4 · 5.<br>For 2–3 players: five cards each. For 4–5 players: four cards each.<br>Keep your own cards facing away from you.</p><p>Make five ascending fireworks, one per colour. Give a clue, discard to restore a clue, or try to play. After the last draw, everyone gets one more turn. Three failed plays end the show.</p><p>Original artwork & print studio: GPL-3.0-only.<br>Hanabi is a game by Antoine Bauza. Independent fan project.</p><div class="page-label">HANABI · TOKEN SHEET · SINGLE-SIDED · ACTUAL SIZE</div>`;
  return el;
}
function renderPage(page, opt) {
  if (page.side === 'tokens') return tokenPage(opt);
  const el = document.createElement('section'); el.className = 'print-page'; el.dataset.side = page.side; el.dataset.sheet = page.sheet;
  for (const item of page.items) {
    const bleed = document.createElement('div'); bleed.className = 'bleed';
    bleed.style.cssText = `left:${item.x-1}mm;top:${item.y-1}mm;width:65mm;height:90mm;background:${opt.mono?'#fffdf7':'#142a36'}`;
    const card = document.createElement('div'); card.className = 'printed-card'; card.dataset.card = item.card.id;
    card.style.cssText = `left:${item.x}mm;top:${item.y}mm`;
    const img = document.createElement('img'); img.src = path(page.side === 'back' ? 'back' : item.card.id, opt.mono); img.alt = '';
    card.append(img); el.append(bleed,card);
  }
  el.insertAdjacentHTML('beforeend', marks(page,opt.paper,opt));
  el.insertAdjacentHTML('beforeend', `<div class="page-label">HANABI · SHEET ${page.sheet} · ${page.side.toUpperCase()}S · 100% SCALE · LONG-EDGE DUPLEX</div>`);
  return el;
}
function updatePrint() {
  const opt = options(), tokens = opt.quantity === 'tokens';
  $('#side').disabled = tokens;
  const selection = opt.quantity === 'filtered' ? visibleCards() : opt.quantity === 'test' ? cards.slice(0,4) : cards;
  pages = tokens ? [{side:'tokens'}] : makeSheets(selection,{...opt,quantity:opt.quantity==='catalog'?'catalog':'deck'});
  const count = opt.quantity === 'catalog' ? selection.length : selection.reduce((sum,c)=>sum+c.copies,0);
  $('#print-total').textContent = tokens ? '11 tokens · 1 sheet · 1 PDF page' : `${count} ${count===1?'card':'cards'} · ${Math.ceil(count/9)} ${count<=9?'sheet':'sheets'} · ${pages.length} PDF ${pages.length===1?'page':'pages'}`;
  $('#print-pages').dataset.paper = opt.paper;
  document.documentElement.style.setProperty('--page-width',`${papers[opt.paper].width}mm`);
  document.documentElement.style.setProperty('--page-height',`${papers[opt.paper].height}mm`);
  $('#print-pages').replaceChildren(...pages.map(page => renderPage(page,opt)));
  pageIndex = 0; preview();
}
function preview() {
  const opt=options();
  const el=renderPage(pages[pageIndex],opt); el.classList.add('preview-page'); el.setAttribute('aria-hidden','true');
  $('#preview-holder').replaceChildren(el);
  const scale = Math.min(395 / (papers[opt.paper].height * 96 / 25.4), ($('#preview-window').clientWidth-12) / (papers[opt.paper].width*96/25.4));
  el.style.transform = `scale(${scale})`;
  $('#preview-holder').style.width = `${papers[opt.paper].width*96/25.4*scale}px`;
  $('#page-indicator').textContent = `Page ${pageIndex+1} of ${pages.length}`;
  $('#preview-description').textContent = pages[pageIndex].side === 'tokens' ? 'TOKENS · SINGLE SIDE' : `${opt.paper==='a4'?'A4':'LETTER'} · ${pages[pageIndex].side.toUpperCase()}S`;
  $('#previous').disabled = pageIndex === 0; $('#next').disabled = pageIndex === pages.length-1;
}
for (const selector of ['#paper','#ink','#quantity','#side','#offset-x','#offset-y']) $(selector).addEventListener('change',updatePrint);
$('#previous').onclick = () => { if(pageIndex>0) {pageIndex--;preview();} };
$('#next').onclick = () => { if(pageIndex<pages.length-1) {pageIndex++;preview();} };
new ResizeObserver(() => { if(pages.length) preview(); }).observe($('#preview-window'));
$('#print').onclick = async () => {
  const button=$('#print'); button.disabled=true; $('#print-error').textContent='';
  try {
    await document.fonts.ready;
    // Hidden print pages also need their assets fully decoded before printing.
    const urls=[...new Set([...$('#print-pages').querySelectorAll('img')].map(img=>img.src))];
    await Promise.all(urls.map(async src=>{const img=new Image();img.src=src;await img.decode();}));
    window.print();
  } catch { $('#print-error').textContent='Some artwork could not load. Refresh the page and try again.'; }
  finally { button.disabled=false; }
};
gallery();updatePrint();
