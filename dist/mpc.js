// SPDX-License-Identifier: GPL-3.0-only
import { cardsForSet, artworkPath, artworkSets } from './deck.js';
import { makeZip, setPngDpi } from './archive.js';
// Official MPC American-poker-size.pdf (63 × 88 mm), inspected 2026-10-22.
// This is NOT the 822 × 1122 px traditional 63.5 × 88.9 mm template.
export const mpcSpec=Object.freeze({width:816,height:1110,trimWidth:744,trimHeight:1038,bleed:36,dpi:300,safeInset:72});
export function mpcDeck(set){return cardsForSet(set).flatMap(card=>Array.from({length:card.copies},(_,i)=>({card,copy:i+1}))).map((item,i)=>({...item,ordinal:i+1,file:`fronts/${String(i+1).padStart(3,'0')}-${item.card.id}-copy-${item.copy}.png`}));}
async function pngForCard(id,set,mono){
 const img=new Image();img.src=artworkPath(id,set,mono);await img.decode();
 const {width,height,trimWidth:w,trimHeight:h,bleed:b}=mpcSpec;
 const trim=document.createElement('canvas');trim.width=w;trim.height=h;
 const ctx=trim.getContext('2d',{alpha:false,colorSpace:'srgb'});ctx.fillStyle='#080d12';ctx.fillRect(0,0,w,h);ctx.filter=mono?'grayscale(1)':'none';ctx.drawImage(img,0,0,w,h);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const out=canvas.getContext('2d',{alpha:false,colorSpace:'srgb'});
 // Extend the actual edge pixels into bleed, rather than shrinking or cropping the card.
 out.drawImage(trim,b,b,w,h);
 out.drawImage(trim,0,0,w,1,b,0,w,b);out.drawImage(trim,0,h-1,w,1,b,b+h,w,b);
 out.drawImage(trim,0,0,1,h,0,b,b,h);out.drawImage(trim,w-1,0,1,h,b+w,b,b,h);
 out.drawImage(trim,0,0,1,1,0,0,b,b);out.drawImage(trim,w-1,0,1,1,b+w,0,b,b);
 out.drawImage(trim,0,h-1,1,1,0,b+h,b,b);out.drawImage(trim,w-1,h-1,1,1,b+w,b+h,b,b);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG encoding failed.')),'image/png'));
 return setPngDpi(new Uint8Array(await blob.arrayBuffer()),300);
}
export async function exportMpcZip({set='diagonal',mono=false,onProgress=()=>{}}={}){
 if(!artworkSets[set])throw new Error('Unknown artwork set.');
 await document.fonts.ready;
 const cards=cardsForSet(set),count=cards.reduce((sum,c)=>sum+c.copies,0);
 const images=new Map();
 for(const [i,id] of [...cards.map(card=>card.id),'back'].entries()){
  onProgress(`Preparing image ${i+1} of ${cards.length+1}…`);images.set(id,await pngForCard(id,set,mono));
 }
 onProgress(`Packing ${count} fronts and the shared back…`);
 const deck=mpcDeck(set);
 const manifest={format:'Hanabi MPC export v1',artwork:set,colourMode:mono?'black-and-white':'colour',cardCount:count,image:mpcSpec,back:'back/shared-back.png',product:'https://www.makeplayingcards.com/design/custom-blank-card.html',template:'https://www.makeplayingcards.com/dl/templates/playingcard/American-poker-size.pdf',cards:deck.map(({card,copy,ordinal,file})=>({ordinal,file,id:card.id,suit:card.suit.id,rank:card.rank,copy}))};
 const instructions=`HANABI — MAKEPLAYINGCARDS UPLOAD FILES\n\nArtwork: ${artworkSets[set].label}${mono?' (black & white)':''}\n\n1. Unzip this file. The MPC designer accepts the PNG images, not this ZIP itself.\n2. Choose Custom Game Cards, 63 x 88 mm: ${manifest.product}\n   Choose a capacity of at least ${count} cards (choose the next available size).\n   Do not select Traditional Poker (63.5 x 88.9 mm).\n3. Upload the ${count} numbered PNGs from fronts/ and place one in each of ${count} front slots, in filename order.\n   Repeated designs are intentional: ${set==='minh'?'multicolour has one of each rank 1–5; other suits have three 1s, two 2s, two 3s, two 4s and one 5.':'each suit has three 1s, two 2s, two 3s, two 4s and one 5.'}\n   Check deck.csv against the designer: if it deduplicates uploaded images, place the copies manually.\n4. Use back/shared-back.png as the SAME back for every card.\n5. If your selected product requires extra slots, fill those fronts with shared-back.png as well, and set those spare cards aside before play. The playing deck must contain exactly the ${count} fronts listed in deck.csv.\n6. Review every front and the back in MPC's preview. Keep the complete image at its supplied size; no crop marks or guides should be printed.\n\nFILES AND GEOMETRY\nAll ${count+1} PNGs are ${mpcSpec.width} x ${mpcSpec.height} pixels, tagged 300 dpi, RGB and fully opaque.\nThe ${mpcSpec.trimWidth} x ${mpcSpec.trimHeight} px card is centred, with ${mpcSpec.bleed} px of artwork bleed on every side.\nThe conservative safe area begins ${mpcSpec.safeInset} px from the outer image edge (36 px inside the trim).\nSource template: ${manifest.template}\nTemplate guide: https://www.makeplayingcards.com/pops/pc-temp-guide.html\n\nThis export always contains a full deck in the chosen artwork and colour mode.\nHome-printer paper size, filters, card quantities, print sides and back alignment offsets do not change these production files. No tokens are included.\n\nGPL-3.0-only. Hanabi is a game by Antoine Bauza. Independent project; not affiliated with MPC or the publishers. See LICENSE.txt and NOTICE.txt.\n`;
 const entries=deck.map(({card,file})=>({name:file,data:images.get(card.id)}));
 entries.push({name:'back/shared-back.png',data:images.get('back')},{name:'README.txt',data:instructions},{name:'manifest.json',data:JSON.stringify(manifest,null,2)},{name:'deck.csv',data:'position,file,suit,value,copy\n'+manifest.cards.map(c=>`${c.ordinal},${c.file},${c.suit},${c.rank},${c.copy}`).join('\n')+'\n'});
 for(const name of ['LICENSE.txt','NOTICE.txt']){const response=await fetch(name);if(!response.ok)throw new Error('Could not load export credits.');entries.push({name,data:new Uint8Array(await response.arrayBuffer())});}
 return {blob:makeZip(entries),filename:`hanabi-mpc-${set}${mono?'-mono':''}.zip`};
}
