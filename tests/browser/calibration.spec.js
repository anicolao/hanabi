import {test,expect} from '@playwright/test';
test('Minh registration diamonds mark occupied corners and follow duplex offsets',async({page})=>{
 await page.goto('/?deck=minh');
 const diamonds=page.locator('#print-pages .registration-diamond');
 await expect(page.locator('#print-pages .print-page').first().locator('.registration-diamond')).toHaveCount(16);
 await expect(page.locator('#print-pages .print-page').nth(12).locator('.registration-diamond')).toHaveCount(4);
 await expect(page.locator('#print-pages .print-page').nth(13).locator('.registration-diamond')).toHaveCount(4);
 await page.getByText('Adjust double-sided alignment',{exact:true}).click();
 await page.getByLabel('Move right (mm)').fill('1.25');await page.getByLabel('Move right (mm)').blur();
 await page.getByLabel('Move down (mm)').fill('-2.5');await page.getByLabel('Move down (mm)').blur();
 const corners=await page.locator('#print-pages .print-page').evaluateAll(pages=>pages.map(page=>[...page.querySelectorAll('.registration-diamond')].map(mark=>{const m=mark.getAttribute('d').match(/^M ([\d.-]+) ([\d.-]+)/);return {x:Number(m[1]),y:Number(m[2])+1};})));
 for(let sheet=0;sheet<7;sheet++)for(const front of corners[sheet*2])expect(corners[sheet*2+1]).toContainEqual({x:210-front.x+1.25,y:front.y-2.5});
 await page.emulateMedia({media:'print'});const box=await diamonds.first().boundingBox();expect(box.width).toBeCloseTo(2*96/25.4,1);expect(box.height).toBeCloseTo(2*96/25.4,1);
});
test('lamination ramp prints nine controlled samples and applies the chosen lift to the deck',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('Colour mode').selectOption('mono');await page.getByLabel('Print sides').selectOption('back');
 await page.getByLabel('What to include').selectOption('calibration');
 await expect(page.getByLabel('Colour mode')).toHaveValue('colour');await expect(page.getByLabel('Colour mode')).toBeDisabled();await expect(page.getByLabel('Print sides')).toBeDisabled();
 await expect(page.locator('#print-total')).toHaveText('Lamination calibration · 9 samples · 1 sheet · 1 PDF page');
 await expect(page.locator('#preview-description')).toHaveText('LAMINATION CALIBRATION · SINGLE SIDE');
 const cards=page.locator('#print-pages .printed-card');await expect(cards).toHaveCount(9);
 expect(await cards.evaluateAll(els=>els.map(el=>Number(el.dataset.lift)))).toEqual([0,5,10,15,20,25,30,40,50]);
 expect(await cards.locator('img').evaluateAll(imgs=>[...new Set(imgs.map(img=>img.getAttribute('src')))])).toEqual(['assets/minh/multicolour-5.svg']);
 await expect(page.locator('#print-pages .sample-label').first()).toHaveText('Standard · 0%');await expect(page.locator('#print-pages .sample-label').last()).toHaveText('Midtone lift 50%');
 await page.getByLabel('Calibration sample').selectOption('back');
 for(const paper of ['a4','letter']){
  await page.getByLabel('Paper size').selectOption(paper);
  await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.emulateMedia({media:'print'});
  const box=await cards.first().boundingBox();expect(box.width).toBeCloseTo(63*96/25.4,0);expect(box.height).toBeCloseTo(88*96/25.4,0);
  const pdf=(await page.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1');expect((pdf.match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  await page.emulateMedia({media:'screen'});
 }
 await page.getByLabel('What to include').selectOption('deck');await page.getByLabel('Colour adjustment').selectOption('lamination');
 await page.getByRole('slider',{name:'Midtone lift',exact:true}).fill('30');
 await expect(page.locator('#print-pages [data-side=back] img').first()).toHaveCSS('filter','url("#lamination-30")');
 await page.getByLabel('Print sides').selectOption('both');await expect(page.locator('#print-pages [data-side=front] img').first()).toHaveCSS('filter','url("#lamination-30")');
 await page.getByLabel('What to include').selectOption('calibration');await expect(cards.last().locator('img')).toHaveCSS('filter','url("#lamination-50")');
 await page.getByLabel('What to include').selectOption('deck');await page.getByLabel('Colour adjustment').selectOption('standard');await expect(page.locator('#print-pages img').first()).toHaveCSS('filter','none');
});
test('lamination ramp visibly lifts grey midtones and preserves black in the rendered print',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('What to include').selectOption('calibration');await page.getByLabel('Calibration sample').selectOption('back');
 await page.emulateMedia({media:'print'});await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 const images=page.locator('#print-pages img');
 const baseline=(await images.first().screenshot()).toString('base64'),lifted=(await images.last().screenshot()).toString('base64');
 const values=await page.evaluate(async data=>Promise.all(data.map(async png=>{
  const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  return {gray:[...ctx.getImageData(120,50,1,1).data],black:[...ctx.getImageData(2,50,1,1).data]};
 })),[baseline,lifted]);
 expect(values[0].gray[0]).toBe(146);expect(values[1].gray[0]).toBeGreaterThan(170);for(const sample of values)expect(sample.black).toEqual([0,0,0,255]);
});
