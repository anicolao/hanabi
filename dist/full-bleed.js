// SPDX-License-Identifier: GPL-3.0-only
import {artworkPath} from './deck.js';
const cache=new Map();
export function fullBleedSvg(source,{set,id,mono=false}){
 const document=new DOMParser().parseFromString(source,'image/svg+xml'),root=document.documentElement;
 if(root.localName!=='svg')throw new Error('Invalid card artwork.');
 const [, ,width,height]=root.getAttribute('viewBox').split(/\s+/).map(Number);
 const rects=[...root.children].filter(el=>el.localName==='rect');
 const expand=rect=>{for(const [key,value] of Object.entries({x:-2,y:-2,width:width+4,height:height+4}))rect.setAttribute(key,value);for(const key of ['rx','ry','stroke','stroke-width','stroke-opacity'])rect.removeAttribute(key);};
 if(set==='live'||set==='minh'){
  const panel=rects.at(-1),opacity=panel.hasAttribute('fill-opacity')?Number(panel.getAttribute('fill-opacity')):1;
  const mix=colour=>{
   const hex=colour.slice(1),rgb=hex.length===3?[...hex].map(c=>parseInt(c+c,16)):[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
   return '#'+rgb.map(channel=>Math.round(channel*opacity+255*(1-opacity)).toString(16).padStart(2,'0')).join('');
  };
  let fill=id==='back'?'#000':panel.getAttribute('fill');
  if(id!=='back'&&fill.startsWith('url(')&&opacity){
   const gradient=document.getElementById(fill.match(/#([^)]*)/)[1]).cloneNode(true);gradient.id='full-bleed-field';
   for(const stop of gradient.querySelectorAll('stop'))stop.setAttribute('stop-color',mix(stop.getAttribute('stop-color')));
   root.querySelector('defs').append(gradient);fill='url(#full-bleed-field)';
  }else if(id!=='back')fill=opacity?mix(fill):'#ffffff';
  // One opaque field avoids anti-aliased white underlay fringes between cards.
  const field=rects[0];expand(field);field.setAttribute('fill',fill);field.removeAttribute('fill-opacity');
  for(const rect of rects.slice(1))rect.remove();
 }else{
  // Perimeter strokes are decoration, not the rank badges or diagonal index fields.
  for(const rect of rects)if(rect.getAttribute('fill')==='none'&&rect.hasAttribute('stroke'))rect.remove();
  if(set==='diagonal'&&id!=='back')for(const el of [...root.children])if(el.localName==='path'&&el.getAttribute('d')?.startsWith('M28 305'))el.remove();
  if(set==='svg'&&id!=='back'){
   rects.find(rect=>rect.getAttribute('x')==='10')?.remove();
   const sky=rects.find(rect=>rect.getAttribute('x')==='93');if(sky)expand(sky);
   const indices=[...root.children].find(el=>el.localName==='g'&&el.getAttribute('font-family')==='Georgia,serif');
   if(indices){const badge=document.createElementNS(root.namespaceURI,'g');badge.innerHTML='<rect x="12" y="12" width="84" height="149" rx="8" fill="#fff7e6"/><g transform="translate(630 880) rotate(180)"><rect x="12" y="12" width="84" height="149" rx="8" fill="#fff7e6"/></g>';root.insertBefore(badge,indices);}
   if(!mono)for(const text of root.querySelectorAll('text'))if(text.getAttribute('y')==='800')text.setAttribute('fill','#f5eddb');
  }
 }
 root.setAttribute('data-edge-treatment','full-bleed');
 return new XMLSerializer().serializeToString(root);
}
// Nine-slice edge extension keeps the trim artwork and index positions unchanged.
export function bleedSvg(source,mm=1){
 const document=new DOMParser().parseFromString(source,'image/svg+xml'),root=document.documentElement;
 const [x,y,w,h]=root.getAttribute('viewBox').split(/\s+/).map(Number),bx=w*mm/63,by=h*mm/88;
 const defs=document.createElementNS(root.namespaceURI,'defs'),content=document.createElementNS(root.namespaceURI,'g');content.id='card-bleed-content';
 for(const child of [...root.children])content.append(child);defs.append(content);root.append(defs);
 root.setAttribute('width',`${63+2*mm}mm`);root.setAttribute('height',`${88+2*mm}mm`);root.setAttribute('viewBox',`${x-bx} ${y-by} ${w+2*bx} ${h+2*by}`);
 const ox=w*.5/63,oy=h*.5/88;
 const xs=[[x-bx,bx+ox,x,.01],[x,w,x,w],[x+w-ox,bx+ox,x+w-.01,.01]],ys=[[y-by,by+oy,y,.01],[y,h,y,h],[y+h-oy,by+oy,y+h-.01,.01]];
 const pairs=[[1,1],...[0,1,2].flatMap(i=>[0,1,2].filter(j=>i!==1||j!==1).map(j=>[i,j]))];
 for(const [i,j] of pairs){const [dx,dw,sx,sw]=xs[i],[dy,dh,sy,sh]=ys[j];const slice=document.createElementNS(root.namespaceURI,'svg');for(const [key,value] of Object.entries({x:dx,y:dy,width:dw,height:dh,viewBox:`${sx} ${sy} ${sw} ${sh}`,preserveAspectRatio:'none',overflow:'hidden'}))slice.setAttribute(key,value);const use=document.createElementNS(root.namespaceURI,'use');use.setAttribute('href','#card-bleed-content');slice.append(use);root.append(slice);}

 return new XMLSerializer().serializeToString(root);
}
export async function artworkUrl(id,set,mono=false,fullBleed=false,bleed=0){
 const path=artworkPath(id,set,mono);if(!fullBleed)return path;
 const key=`${path}:${bleed}`;
 if(!cache.has(key))cache.set(key,(async()=>{
  const response=await fetch(path);if(!response.ok)throw new Error('Could not load artwork.');
  let svg=fullBleedSvg(await response.text(),{id,set,mono});if(bleed)svg=bleedSvg(svg,bleed);
  return URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 })().catch(error=>{cache.delete(key);throw error;}));
 return cache.get(key);
}
export function setArtwork(img,{id,set,mono=false,fullBleed=false,bleed=0}){
 const pending=artworkUrl(id,set,mono,fullBleed,bleed).then(url=>{img.src=url;return url;});
 img.artworkReady=pending;pending.catch(()=>{});return pending;
}
const sheetCache=new Map();
export async function sharedSheetUrl(page,{paper,set,mono=false}){
 const {papers}=await import('./deck.js');
 const dimensions=papers[paper],key=JSON.stringify([paper,set,mono,page.side,page.items.map(item=>[item.card.id,item.set,item.x,item.y])]);
 if(!sheetCache.has(key))sheetCache.set(key,(async()=>{
  const root=document.createElementNS('http://www.w3.org/2000/svg','svg');root.setAttribute('xmlns',root.namespaceURI);root.setAttribute('width',`${dimensions.width}mm`);root.setAttribute('height',`${dimensions.height}mm`);root.setAttribute('viewBox',`0 0 ${dimensions.width} ${dimensions.height}`);
  for(const [index,item] of page.items.entries()){
   const id=page.side==='back'?'back':item.card.id,artSet=page.side==='back'?set:item.set||set;
   const url=await artworkUrl(id,artSet,mono,true),source=await(await fetch(url)).text();
   const unique=source.replace(/id="([^"]+)"/g,(_,id)=>`id="sheet-${index}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#sheet-${index}-${id})`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#sheet-${index}-${id}"`);
   const svg=new DOMParser().parseFromString(unique,'image/svg+xml').documentElement,[,,width,height]=svg.getAttribute('viewBox').split(/\s+/).map(Number);
   const group=document.createElementNS(root.namespaceURI,'g');group.setAttribute('transform',`translate(${item.x} ${item.y}) scale(${63/width} ${88/height})`);for(const child of [...svg.children])group.append(document.importNode(child,true));root.append(group);
  }
  return URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(root)],{type:'image/svg+xml'}));
 })().catch(error=>{sheetCache.delete(key);throw error;}));
 return sheetCache.get(key);
}
