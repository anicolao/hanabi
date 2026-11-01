import {test,expect} from '@playwright/test';
test('suit sheets share edges, preserve deck quantities, identify spares, and reserve gutters for the 5s',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('Card edges').selectOption('full-bleed');
 const sheets=await page.locator('#print-pages [data-side=front]').evaluateAll(pages=>pages.map(page=>({kind:page.dataset.kind,gap:Number(page.dataset.gap),footer:page.querySelector('.page-label').textContent,cards:[...page.querySelectorAll('.printed-card')].map(card=>({id:card.dataset.card,spare:card.dataset.spare==='true',x:parseFloat(card.style.left),y:parseFloat(card.style.top)}))})));
 expect(sheets).toHaveLength(7);
 for(const sheet of sheets.slice(0,-1)){expect(sheet.kind).toBe('suit');expect(sheet.gap).toBe(0);expect(sheet.cards).toHaveLength(9);expect(new Set(sheet.cards.map(c=>c.id.split('-')[0])).size).toBe(1);expect(sheet.cards.every(c=>!c.id.endsWith('-5'))).toBe(true);expect(sheet.cards[1].x-sheet.cards[0].x).toBe(63);expect(sheet.cards[3].y-sheet.cards[0].y).toBe(88);}
 const fives=sheets.at(-1);expect(fives.kind).toBe('fives');expect(fives.gap).toBe(2);expect(fives.cards.map(c=>c.id)).toEqual(['red-5','yellow-5','green-5','blue-5','multicolour-5','black-5']);
 const required=sheets.flatMap(s=>s.cards).filter(c=>!c.spare);expect(required).toHaveLength(55);expect(sheets.flatMap(s=>s.cards).filter(c=>c.spare)).toHaveLength(5);
 expect(sheets.find(s=>s.cards[0].id.startsWith('multicolour')).footer).toContain('SPARE POSITIONS 5, 6, 7, 8, 9');
 await expect(page.locator('#print-pages [data-side=back] .page-label').nth(4)).toContainText('SPARE POSITIONS 4, 5, 7, 8, 9');
 for(const paper of ['a4','letter']){
  await page.getByLabel('Paper size').selectOption(paper);await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(async img=>{await img.artworkReady;await img.decode();})));await page.emulateMedia({media:'print'});
  const first=page.locator('#print-pages [data-side=front]').first(),bounds=await first.locator('.printed-card').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
  for(const box of bounds){expect(box.width).toBeCloseTo(63*96/25.4,0);expect(box.height).toBeCloseTo(88*96/25.4,0);}
  const png=(await first.screenshot()).toString('base64');
  const colours=await page.evaluate(async({png,x,y,x2,y2})=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return [-2,-1,0,1,2].flatMap(offset=>[[...ctx.getImageData(Math.round(x)+offset,Math.round(y),1,1).data],[...ctx.getImageData(Math.round(x2),Math.round(y2)+offset,1,1).data]]);},{png,x:bounds[1].x,y:bounds[0].y+44*96/25.4,x2:bounds[0].x+31.5*96/25.4,y2:bounds[3].y});
  for(const colour of colours)expect(colour).toEqual([255,199,199,255]);
  await page.emulateMedia({media:'screen'});
 }
});
