// SPDX-License-Identifier: GPL-3.0-only
import {artworkPath} from './deck.js';
const cache=new Map();
export function fullBleedSvg(source,{set,id,mono=false}){
 const document=new DOMParser().parseFromString(source,'image/svg+xml'),root=document.documentElement;
 if(root.localName!=='svg')throw new Error('Invalid card artwork.');
 const [, ,width,height]=root.getAttribute('viewBox').split(/\s+/).map(Number);
 const rects=[...root.children].filter(el=>el.localName==='rect');
 const expand=rect=>{for(const [key,value] of Object.entries({x:0,y:0,width,height}))rect.setAttribute(key,value);for(const key of ['rx','ry','stroke','stroke-width','stroke-opacity'])rect.removeAttribute(key);};
 if(set==='live'||set==='minh'){
  rects[0].setAttribute('fill',id==='back'?'#000':'white');
  for(const rect of rects.slice(1)){expand(rect);if(id==='back')rect.setAttribute('fill','#000');}
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
 const xs=[[x-bx,bx,x,.01],[x,w,x,w],[x+w,bx,x+w-.01,.01]],ys=[[y-by,by,y,.01],[y,h,y,h],[y+h,by,y+h-.01,.01]];
 for(const [dx,dw,sx,sw] of xs)for(const [dy,dh,sy,sh] of ys){const slice=document.createElementNS(root.namespaceURI,'svg');for(const [key,value] of Object.entries({x:dx,y:dy,width:dw,height:dh,viewBox:`${sx} ${sy} ${sw} ${sh}`,preserveAspectRatio:'none',overflow:'hidden'}))slice.setAttribute(key,value);const use=document.createElementNS(root.namespaceURI,'use');use.setAttribute('href','#card-bleed-content');slice.append(use);root.append(slice);}
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
