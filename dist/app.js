// SPDX-License-Identifier: GPL-3.0-only
import { suits, cards, papers, makeSheets, artworkPath } from './deck.js';
const $ = selector => document.querySelector(selector);
let activeSuit = 'all', activeRank = 'all', pageIndex = 0, pages = [];
const path = (id, mono = false) => artworkPath(id, $('#art-set').value, mono);
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
    button.className = 'card-tile'; button.setAttribute('aria-label', `Inspect ${card.suit.name} ${card.rank}, ${card.copies} ${card.copies === 1 ? 'copy' : 'copies'}`);
    button.innerHTML = `<span class="card-mat"><img src="${path(card.id, $('#ink').value === 'mono')}" alt="${card.suit.name} ${card.rank}" loading="lazy" width="630" height="880"></span><span class="card-label"><span>${card.suit.name} / ${String(card.rank).padStart(2,'0')}</span><small>${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} ↗</small></span>`;
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
  $('#detail-image').src = path(id, $('#ink').value === 'mono'); $('#detail-image').alt = back ? 'Shared card back' : `${card.suit.name} ${card.rank}`;
  $('#dialog-title').textContent = back ? 'Shared card back' : `${card.suit.name} ${card.rank}`;
  $('#detail-description').textContent = back ? 'Identical back for every card. 63 × 88 mm.' : `${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} in the full deck. 63 × 88 mm.`;
  $('#download-card').href = path(id, $('#ink').value === 'mono'); $('#download-card').download = `hanabi-${id}${$('#ink').value === 'mono' ? '-mono' : ''}.svg`;
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
  el.innerHTML = `<h2>Hanabi tokens</h2><p>8 clue markers + 3 fuse markers · 22 mm diameter<br>Print one-sided at 100% scale. Cut around the dotted circles.</p><h3>Clues</h3><div class="token-row">${Array.from({length:8},()=>'<div class="token"><span>✦</span><small>CLUE</small></div>').join('')}</div><h3>Fuses</h3><div class="token-row">${Array.from({length:3},()=>'<div class="token fuse"><span>✳</span><small>FUSE</small></div>').join('')}</div><div class="page-label">HANABI · TOKEN SHEET · SINGLE-SIDED · ACTUAL SIZE</div>`;
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
  const scale = Math.min(590 / (papers[opt.paper].height * 96 / 25.4), ($('#preview-window').clientWidth-12) / (papers[opt.paper].width*96/25.4));
  el.style.transform = `scale(${scale})`;
  $('#preview-holder').style.width = `${papers[opt.paper].width*96/25.4*scale}px`;
  $('#page-indicator').textContent = `Page ${pageIndex+1} of ${pages.length}`;
  $('#preview-description').textContent = pages[pageIndex].side === 'tokens' ? 'TOKENS · SINGLE SIDE' : `${opt.paper==='a4'?'A4':'LETTER'} · ${pages[pageIndex].side.toUpperCase()}S`;
  $('#previous').disabled = pageIndex === 0; $('#next').disabled = pageIndex === pages.length-1;
}
$('#art-set').addEventListener('change', () => { gallery(); updatePrint(); });
$('#ink').addEventListener('change', () => { gallery(); updatePrint(); });
for (const selector of ['#paper','#quantity','#side','#offset-x','#offset-y']) $(selector).addEventListener('change',updatePrint);
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
$('#mpc-export').onclick = async () => {
  const button=$('#mpc-export');button.disabled=true;$('#mpc-error').textContent='';
  const set=$('#art-set').value,mono=$('#ink').value==='mono';
  try {
    const { exportMpcZip }=await import('./mpc.js');
    const { blob,filename }=await exportMpcZip({set,mono,onProgress:message=>$('#mpc-status').textContent=message});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('#mpc-status').textContent='ZIP ready: 50 fronts, one shared back, and upload instructions.';
  } catch(error) { $('#mpc-status').textContent='';$('#mpc-error').textContent='Could not prepare the MPC ZIP. Check your connection and try again.'; }
  finally {button.disabled=false;}
};
gallery();updatePrint();
