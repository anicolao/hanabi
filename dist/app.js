// SPDX-License-Identifier: GPL-3.0-only
import { cardsForSet, papers, makeSheets, artworkPath } from './deck.js';
import {artworkUrl,setArtwork} from './full-bleed.js';
import { calibrationSamples } from './calibration.js';
import {printFilters,imageLift,clampLift} from './lamination.js';
const $ = selector => document.querySelector(selector);
let activeSuit = 'all', activeRank = 'all', pageIndex = 0, pages = [];
const path = (id, mono = false) => artworkPath(id, $('#art-set').value, mono);
const selectedCards = () => cardsForSet($('#art-set').value);
if(new URLSearchParams(location.search).get('deck')==='minh') $('#art-set').value='minh';
const fullBleed=()=>$('#card-edges').value==='full-bleed';
const assignArtwork=(img,id,set=$('#art-set').value,mono=$('#ink').value==='mono',bleed=0)=>setArtwork(img,{id,set,mono,fullBleed:fullBleed(),bleed});
const chosenLift=()=>$('#ink').value==='colour'&&$('#colour-profile').value==='lamination'?clampLift($('#lamination-strength').value):0;
function sampleOptions(){
 const previous=$('#calibration-sample').value;
 const suits=[...new Map(selectedCards().map(c=>[c.suit.id,c.suit])).values()].filter(s=>s.id!=='multicolour');
 const samples=[{id:'multicolour-5',name:'Multicolour 5'},...suits.map(s=>({id:`${s.id}-5`,name:`${s.name} 5`})),{id:'back',name:'Shared back'}];
 $('#calibration-sample').replaceChildren(...samples.map(s=>new Option(s.name,s.id)));
 $('#calibration-sample').value=samples.some(s=>s.id===previous)?previous:'multicolour-5';
}
sampleOptions();
const visibleCards = () => selectedCards().filter(card => (activeSuit === 'all' || card.suit.id === activeSuit) && (activeRank === 'all' || card.rank === Number(activeRank)));
function suitFilters() {
 $('.suit-filters').querySelectorAll('[data-suit]:not([data-suit=all])').forEach(el=>el.remove());
for (const suit of [...new Map(selectedCards().map(c=>[c.suit.id,c.suit])).values()]) {
  const button = document.createElement('button');
  button.className = 'chip'; button.dataset.suit = suit.id; button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<span class="suit-dot" style="--suit-color:${suit.id==='multicolour'?'linear-gradient(135deg,#ff3535,#ffdf00,#02ca00,#1683ff,#ae46df)':suit.color}" aria-hidden="true"></span>${suit.name}`;
  $('.suit-filters').append(button);
}
}
suitFilters();
function gallery() {
  const visible = visibleCards();
  const copies = visible.reduce((sum, c) => sum + c.copies, 0);
  $('#gallery-count').textContent = `${visible.length} unique ${visible.length === 1 ? 'front' : 'fronts'} · ${copies} playing ${copies === 1 ? 'card' : 'cards'}`;
  $('#card-grid').replaceChildren(...visible.map(card => {
    const button = document.createElement('button');
    button.className = 'card-tile'; button.setAttribute('aria-label', `Inspect ${card.suit.name} ${card.rank}, ${card.copies} ${card.copies === 1 ? 'copy' : 'copies'}`);
    button.innerHTML = `<span class="card-mat"><img src="${path(card.id, $('#ink').value === 'mono')}" alt="${card.suit.name} ${card.rank}" loading="lazy" width="630" height="880"></span><span class="card-label"><span>${card.suit.name} / ${String(card.rank).padStart(2,'0')}</span><small>${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} ↗</small></span>`;
    assignArtwork(button.querySelector('img'),card.id);
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
async function detail(card) {
  const back = !card, id = back ? 'back' : card.id;
  const url=await artworkUrl(id,$('#art-set').value,$('#ink').value==='mono',fullBleed());
  $('#detail-image').src = url; $('#detail-image').alt = back ? 'Shared card back' : `${card.suit.name} ${card.rank}`;
  $('#dialog-title').textContent = back ? 'Shared card back' : `${card.suit.name} ${card.rank}`;
  $('#detail-description').textContent = back ? 'Identical back for every card. 63 × 88 mm.' : `${card.copies} ${card.copies === 1 ? 'copy' : 'copies'} in the full deck. 63 × 88 mm.`;
  $('#download-card').href = url; $('#download-card').download = `hanabi-${id}${fullBleed()?'-full-bleed':''}${$('#ink').value === 'mono' ? '-mono' : ''}.svg`;
  $('#card-dialog').showModal();
}
$('#view-back').onclick = () => detail(null);
$('#close-dialog').onclick = () => $('#card-dialog').close();
$('#card-dialog').onclick = event => { if (event.target === $('#card-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } };
function options() {
  const clamp = value => Math.max(-5, Math.min(5, Number(value) || 0));
  return { fullBleed:fullBleed(), lift:chosenLift(), paper: $('#paper').value, quantity: $('#quantity').value, side: $('#side').value, x: clamp($('#offset-x').value), y: clamp($('#offset-y').value), mono: $('#ink').value === 'mono' };
}
function marks(page, paper, opt) {
  const { width, height } = papers[paper];
  const gap=page.gap||0,bleed=1,gridWidth=189+2*gap,gridHeight=264+2*gap;
  const x = (width-gridWidth)/2 + (page.side === 'back' ? opt.x : 0), y = (height-gridHeight)/2 + (page.side === 'back' ? opt.y : 0);
  let lines = '', guides='';
  const guide=(axis,cut,offset,x1,y1,x2,y2)=>{
   // The outer half of a channel can fall in Letter's unprintable margin.
   const position=cut+offset,limit=axis==='x'?width:height;if(position<3.2||position>limit-3.2)return;
   guides+=`<path class="cutter-channel-mark" data-axis="${axis}" data-cut="${cut}" data-offset="${offset}" d="M${x1} ${y1}L${x2} ${y2}"/>`;
  };
  const line=(axis,cut,x1,y1,x2,y2)=>{lines+=`<path class="centre-crop-mark" data-axis="${axis}" data-cut="${cut}" d="M${x1} ${y1}L${x2} ${y2}"/>`;};
  const cols=gap?[0,63,65,128,130,193]:[0,63,126,189],rows=gap?[0,88,90,178,180,268]:[0,88,176,264];
  // Outer marks cross the bleed into the margin, leaving a 3.2 mm printable margin.
  const segments=(origin,span,card,limit)=>[[origin-Math.max(.95,Math.min(3.5,origin-3.2)),origin-bleed*.05],...[0,1].flatMap(i=>gap?[[origin+card+i*(card+gap)+gap*.05,origin+card+i*(card+gap)+gap*.95]]:[]),[origin+span+bleed*.05,origin+span+Math.max(.95,Math.min(3.5,limit-origin-span-3.2))]];
  for(const col of cols)for(const [from,to] of segments(y,gridHeight,88,height)){
   const cut=x+col;line('x',cut,cut,from,cut,to);
   const inset=(to-from)/6;for(const offset of [-3.5,3.5])guide('x',cut,offset,cut+offset,from+inset,cut+offset,to-inset);
  }
  for(const row of rows)for(const [from,to] of segments(x,gridWidth,63,width)){
   const cut=y+row;line('y',cut,from,cut,to,cut);
   const inset=(to-from)/6;for(const offset of [-3.5,3.5])guide('y',cut,offset,from+inset,cut+offset,to-inset,cut+offset);
  }
  // Two-millimetre white diamonds mark occupied card corners, matching the Pantheon sample.
  let diamonds = '';
  const corners=new Map();
  for(const item of page.items)for(const [cx,cy] of [[item.x,item.y],[item.x+63,item.y],[item.x,item.y+88],[item.x+63,item.y+88]])corners.set(`${cx},${cy}`,[cx,cy]);
  for(const [cx,cy] of corners.values())diamonds+=`<path class="registration-diamond" d="M ${cx} ${cy-1} l 1 1 l -1 1 l -1 -1 Z" fill="white"/>`;
  return `<svg class="crop-marks" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${diamonds}<g class="mark-halo" fill="none" stroke="white" stroke-width=".45" stroke-linecap="butt">${(lines+guides).replace(/ class=\"[^\"]*\"/g,'')}</g><g fill="none" stroke="black" stroke-width=".15">${lines}</g><g fill="none" stroke="#666" stroke-width=".12">${guides}</g></svg>`;
}
function tokenPage(opt) {
  const el = document.createElement('section'); el.className = `print-page token-page${opt.mono ? ' mono' : ''}`;
  el.innerHTML = `<h2>Hanabi tokens</h2><p>8 clue markers + 3 fuse markers · 22 mm diameter<br>Print one-sided at 100% scale. Cut around the dotted circles.</p><h3>Clues</h3><div class="token-row">${Array.from({length:8},()=>'<div class="token"><span>✦</span><small>CLUE</small></div>').join('')}</div><h3>Fuses</h3><div class="token-row">${Array.from({length:3},()=>'<div class="token fuse"><span>✳</span><small>FUSE</small></div>').join('')}</div><div class="page-label">HANABI · TOKEN SHEET · SINGLE-SIDED · ACTUAL SIZE</div>`;
  return el;
}
function renderPage(page, opt, isPreview=false) {
  if (page.side === 'tokens') return tokenPage(opt);
  const el = document.createElement('section'); el.className = 'print-page'; el.dataset.side = page.side; el.dataset.sheet = page.sheet;el.dataset.kind=page.kind||'';el.dataset.gap=page.gap||0;
  const calibration=Boolean(page.calibration);
  if(calibration)el.classList.add('lamination-page');
  for (const item of page.items) {
    const bleed = document.createElement('div'); bleed.className = 'bleed';
    const bleedSize=1;
    bleed.style.cssText = `left:${item.x-bleedSize}mm;top:${item.y-bleedSize}mm;width:${63+2*bleedSize}mm;height:${88+2*bleedSize}mm;background:${($('#art-set').value==='minh'||calibration&&page.side==='front'&&item.set==='minh')?'#000':opt.mono?'#fffdf7':'#142a36'}`;
    const card = document.createElement('div'); card.className = 'printed-card'; card.dataset.card = item.card.id;card.dataset.spare=String(Boolean(item.extra));
    card.style.cssText = `left:${item.x}mm;top:${item.y}mm`;
    const img = document.createElement('img'),id=page.side==='back'?'back':item.card.id,set=page.side==='back'?$('#art-set').value:item.set||$('#art-set').value;assignArtwork(img,id,set,opt.mono);img.alt='';img.style.filter=imageLift(opt.mono?0:item.lift??opt.lift,isPreview?'preview-lamination-':'lamination-');
    if(opt.fullBleed){const extended=document.createElement('img');extended.alt='';assignArtwork(extended,id,set,opt.mono,bleedSize);extended.style.cssText=`width:100%;height:100%;filter:${img.style.filter}`;bleed.append(extended);}
    card.append(img);
    if(calibration){const label=document.createElement('div');label.className='sample-label';label.textContent=item.label;card.append(label);card.dataset.lift=item.lift;}
    el.append(bleed,card);
  }
  el.insertAdjacentHTML('beforeend', marks(page,opt.paper,opt));
  const spares=page.items.flatMap((item,i)=>item.extra?[page.side==='back'?Math.floor(i/3)*3+3-i%3:i+1]:[]).sort((a,b)=>a-b);
  const sheetNote=page.suitName?`${page.suitName.toUpperCase()} · ${page.gap?'2 MM GUTTERS':'SHARED CUTS'} · ${spares.length?`SPARE POSITIONS ${spares.join(', ')} · `:''}`:'';
  el.insertAdjacentHTML('beforeend', `<div class="page-label">HANABI · ${calibration?`ALIGNMENT & COLOUR TEST · ${page.side.toUpperCase()}S · MIDTONE LIFT 0–50% · LONG-EDGE DUPLEX`:`SHEET ${page.sheet} · ${sheetNote}${page.side.toUpperCase()}S · ${opt.lift?`MIDTONE LIFT ${opt.lift}% · `:''}LONG-EDGE DUPLEX`} · 100% SCALE</div>`);
  return el;
}
function updatePrint() {
  const calibration=$('#quantity').value==='calibration';
  const opt = options(), tokens = opt.quantity === 'tokens';
  $('#side').disabled = tokens;
  $('#quantity option[value=calibration]').textContent='Alignment & colour test · 1 sheet pair';
  $('.print-note').innerHTML=calibration?'Print at 100% size. Use a front/back pair, flipped on the long edge, to check the diamonds against a light. In full colour, laminate the sheet and compare the labelled lift samples.':tokens?'Print one-sided at 100% size.':'63 × 88 mm cards. Print at 100% size.<br>For duplex: flip on the long edge.';
  $('#sample-control').hidden=!calibration;
  $('#lift-control').hidden=$('#colour-profile').value!=='lamination';
  $('#lamination-help').hidden=!calibration&&$('#colour-profile').value!=='lamination';
  $('#lift-value').textContent=`${$('#lamination-strength').value}%`;
  const selection = opt.quantity === 'filtered' ? visibleCards() : selectedCards();
  const samples=calibrationSamples($('#art-set').value,$('#calibration-sample').value,opt.mono);
  const calibrationPages=calibration?makeSheets(Array.from({length:9},(_,sampleIndex)=>({sampleIndex,id:$('#calibration-sample').value,copies:1})),{...opt,layout:'compact',gap:2,quantity:'catalog'}).map(page=>({...page,calibration:true,items:page.items.map(item=>({...item,...samples[item.card.sampleIndex]}))})):null;
  pages = calibration ? calibrationPages : tokens ? [{side:'tokens'}] : makeSheets(selection,{...opt,layout:'suits',quantity:opt.quantity==='catalog'?'catalog':'deck'});
  const count = opt.quantity === 'catalog' ? selection.length : selection.reduce((sum,c)=>sum+c.copies,0);
  const physical=pages.filter(page=>page.side===(opt.side==='back'?'back':'front'));
  const printed=physical.reduce((sum,page)=>sum+(page.items?.length||0),0),spares=printed-count,sheetCount=new Set(pages.map(page=>page.sheet)).size;
  $('#print-total').textContent = calibration ? `Alignment & colour test · 9 samples · 1 sheet · ${pages.length} PDF ${pages.length===1?'page':'pages'}` : tokens ? '11 tokens · 1 sheet · 1 PDF page' : `${spares>0?`${printed} printed · ${count} required + ${spares} spares`:`${count} ${count===1?'card':'cards'}`} · ${sheetCount} ${sheetCount===1?'sheet':'sheets'} · ${pages.length} PDF ${pages.length===1?'page':'pages'}`;
  $('#print-pages').dataset.paper = opt.paper;
  document.documentElement.style.setProperty('--page-width',`${papers[opt.paper].width}mm`);
  document.documentElement.style.setProperty('--page-height',`${papers[opt.paper].height}mm`);
  $('#print-pages').replaceChildren(...pages.map(page => renderPage(page,opt)));
  $('#print-pages .print-page').insertAdjacentHTML('afterbegin',printFilters(opt.lift));
  pageIndex = 0; preview();
}
function preview() {
  const opt=options();
  const el=renderPage(pages[pageIndex],opt,true);el.insertAdjacentHTML('afterbegin',printFilters(opt.lift,'preview-lamination-')); el.classList.add('preview-page'); el.setAttribute('aria-hidden','true');
  $('#preview-holder').replaceChildren(el);
  const scale = Math.min(590 / (papers[opt.paper].height * 96 / 25.4), ($('#preview-window').clientWidth-12) / (papers[opt.paper].width*96/25.4));
  el.style.transform = `scale(${scale})`;
  $('#preview-holder').style.width = `${papers[opt.paper].width*96/25.4*scale}px`;
  $('#page-indicator').textContent = `Page ${pageIndex+1} of ${pages.length}`;
  $('#preview-description').textContent = pages[pageIndex].calibration ? `ALIGNMENT & COLOUR TEST · ${pages[pageIndex].side.toUpperCase()}S` : pages[pageIndex].side === 'tokens' ? 'TOKENS · SINGLE SIDE' : `${opt.paper==='a4'?'A4':'LETTER'} · ${pages[pageIndex].suitName?pages[pageIndex].suitName.toUpperCase()+' · ':''}${pages[pageIndex].side.toUpperCase()}S`;
  $('#previous').disabled = pageIndex === 0; $('#next').disabled = pageIndex === pages.length-1;
}
function deckLabels() {
 const deck=selectedCards(),count=deck.reduce((sum,c)=>sum+c.copies,0);
 $('#quantity option[value=catalog]').textContent=`One of each · ${deck.length} cards`;
 $('#quantity option[value=deck]').textContent=`Full deck · ${count} cards`;
 $('.mpc-note').textContent=`Full ${count}-card deck + shared back. Uses the selected artwork, colour mode and adjustment.`;
 $('.gallery-note').textContent=$('#art-set').value==='minh'?'Multicolour: one copy each of 1–5. Other colours: 1 × 3, 2 × 2, 3 × 2, 4 × 2, 5 × 1.':'To print a subset, choose “Filtered cards” above. Copies per colour: 1 × 3, 2 × 2, 3 × 2, 4 × 2, 5 × 1.';
}
$('#art-set').addEventListener('change', () => {
 activeSuit='all';suitFilters();sampleOptions();
 for(const chip of document.querySelectorAll('.chip')){const active=chip.dataset.suit==='all';chip.classList.toggle('active',active);chip.setAttribute('aria-pressed',String(active));}
 $('#mpc-status').textContent='';deckLabels();gallery();updatePrint();
});
$('#card-edges').addEventListener('change',()=>{gallery();updatePrint();});
$('#ink').addEventListener('change', () => { gallery(); updatePrint(); });
for (const selector of ['#paper','#quantity','#side','#offset-x','#offset-y']) $(selector).addEventListener('change',updatePrint);
for(const id of ['#colour-profile','#calibration-sample'])$(id).addEventListener('change',updatePrint);
$('#lamination-strength').addEventListener('input',updatePrint);
$('#previous').onclick = () => { if(pageIndex>0) {pageIndex--;preview();} };
$('#next').onclick = () => { if(pageIndex<pages.length-1) {pageIndex++;preview();} };
new ResizeObserver(() => { if(pages.length) preview(); }).observe($('#preview-window'));
$('#print').onclick = async () => {
  const button=$('#print'); button.disabled=true; $('#print-error').textContent='';
  try {
    await Promise.all([...$('#print-pages').querySelectorAll('img')].map(img=>img.artworkReady));
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
  const set=$('#art-set').value,mono=$('#ink').value==='mono',lift=chosenLift(),bleed=fullBleed();
  try {
    const { exportMpcZip }=await import('./mpc.js');
    const { blob,filename }=await exportMpcZip({set,mono,lift,fullBleed:bleed,onProgress:message=>$('#mpc-status').textContent=message});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('#mpc-status').textContent=`ZIP ready: ${cardsForSet(set).reduce((sum,c)=>sum+c.copies,0)} fronts, one shared back, and upload instructions.${lift?` ${lift}% midtone lift applied.`:''}`;
  } catch(error) { $('#mpc-status').textContent='';$('#mpc-error').textContent='Could not prepare the MPC ZIP. Check your connection and try again.'; }
  finally {button.disabled=false;}
};
deckLabels();gallery();updatePrint();
