import {test,expect} from '@playwright/test';
const ready=page=>page.locator('#preview-holder img').evaluateAll(imgs=>Promise.all(imgs.map(async img=>{await img.artworkReady;await img.decode();})));
test('full bleed is the default and calibration labels have no solid border strips',async({page})=>{
 await page.goto('/?deck=minh');await expect(page.getByLabel('Card edges')).toHaveValue('full-bleed');await page.getByLabel('What to include').selectOption('calibration');await ready(page);
 await expect(page.locator('#preview-holder .sample-label').first()).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 const frame=await page.locator('#preview-holder .printed-card img').first().evaluate(async img=>{const root=new DOMParser().parseFromString(await(await fetch(img.src)).text(),'image/svg+xml').documentElement;return {flag:root.getAttribute('data-edge-treatment'),rects:[...root.children].filter(el=>el.localName==='rect').map(el=>({x:Number(el.getAttribute('x')),width:Number(el.getAttribute('width')),stroke:el.getAttribute('stroke')}))};});
 expect(frame.flag).toBe('full-bleed');for(const rect of frame.rects){expect(rect.x).toBeLessThanOrEqual(0);expect(rect.x+rect.width).toBeGreaterThanOrEqual(286);expect(rect.stroke).toBeNull();}
 await page.getByLabel('Card edges').selectOption('framed');await page.reload();await expect(page.getByLabel('Card edges')).toHaveValue('framed');await page.getByLabel('Card edges').selectOption('full-bleed');await page.reload();await expect(page.getByLabel('Card edges')).toHaveValue('full-bleed');
});
test('scaled suit previews have no pale or grey hairlines across adjoining cards, including lamination',async({page})=>{
 await page.goto('/?deck=minh');
 for(const paper of ['a4','letter'])for(const profile of ['standard','lamination']){
  await page.getByLabel('Paper size').selectOption(paper);await page.getByLabel('Colour adjustment').selectOption(profile);await ready(page);
  const points=await page.locator('#preview-holder').evaluate(el=>{const r=el.getBoundingClientRect(),cards=el.querySelectorAll('.printed-card'),a=cards[0].getBoundingClientRect(),b=cards[1].getBoundingClientRect(),d=cards[3].getBoundingClientRect();return {x:b.x-r.x,y:a.y-r.y+a.height/2,x2:a.x-r.x+a.width/2,y2:d.y-r.y};});
  const png=(await page.locator('#preview-holder').screenshot()).toString('base64');
  const pixels=await page.evaluate(async({png,p})=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return [-2,-1,0,1,2].flatMap(k=>[[...ctx.getImageData(Math.round(p.x)+k,Math.round(p.y),1,1).data],[...ctx.getImageData(Math.round(p.x2),Math.round(p.y2)+k,1,1).data]]);},{png,p:points});
  for(const pixel of pixels)expect(pixel).toEqual(pixels[0]);expect(pixels[0][0]).toBe(255);expect(pixels[0][3]).toBe(255);
 }
});
