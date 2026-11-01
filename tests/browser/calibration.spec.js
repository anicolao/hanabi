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
 await expect(page.getByLabel('Colour mode')).toHaveValue('mono');await expect(page.getByLabel('Colour mode')).toBeEnabled();await expect(page.getByLabel('Print sides')).toBeEnabled();
 await page.getByLabel('Colour mode').selectOption('colour');await page.getByLabel('Print sides').selectOption('both');
 await expect(page.locator('#print-total')).toHaveText('Alignment & colour test · 9 samples · 1 sheet · 2 PDF pages');
 await expect(page.locator('#preview-description')).toHaveText('ALIGNMENT & COLOUR TEST · FRONTS');
 const cards=page.locator('#print-pages [data-side=front] .printed-card');await expect(cards).toHaveCount(9);
 expect(await cards.evaluateAll(els=>els.map(el=>Number(el.dataset.lift)))).toEqual([0,5,10,15,20,25,30,40,50]);
 expect(await cards.locator('img').evaluateAll(imgs=>[...new Set(imgs.map(img=>img.getAttribute('src')))])).toEqual(['assets/minh/multicolour-5.svg']);
 await expect(page.locator('#print-pages .sample-label').first()).toHaveText('Standard · 0%');await expect(page.locator('#print-pages [data-side=front] .sample-label').last()).toHaveText('Midtone lift 50%');
 await page.getByLabel('Calibration sample').selectOption('back');
 for(const paper of ['a4','letter']){
  await page.getByLabel('Paper size').selectOption(paper);
  await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.emulateMedia({media:'print'});
  const box=await cards.first().boundingBox();expect(box.width).toBeCloseTo(63*96/25.4,0);expect(box.height).toBeCloseTo(88*96/25.4,0);
  const pdf=(await page.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1');expect((pdf.match(/\/Type\s*\/Page\b/g)||[]).length).toBe(2);
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
 await page.goto('/?deck=minh');await page.getByLabel('What to include').selectOption('calibration');await page.getByLabel('Calibration sample').selectOption('black-5');
 await page.emulateMedia({media:'print'});await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
 const images=page.locator('#print-pages [data-side=front] img');
 const baseline=(await images.first().screenshot()).toString('base64'),lifted=(await images.last().screenshot()).toString('base64');
 const values=await page.evaluate(async data=>Promise.all(data.map(async png=>{
  const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  return {gray:[...ctx.getImageData(180,130,1,1).data],black:[...ctx.getImageData(2,50,1,1).data]};
 })),[baseline,lifted]);
 expect(values[0].gray[0]).toBe(203);expect(values[1].gray[0]).toBeGreaterThan(210);for(const sample of values)expect(sample.black).toEqual([0,0,0,255]);
});

test('combined calibration defaults to multicolour for every artwork and retains controls across all views',async({page})=>{
 await page.goto('/');await page.getByLabel('What to include').selectOption('calibration');
 for(const set of ['diagonal','painted','live','svg','minh']){
  await page.getByLabel('Card artwork').selectOption(set);
  await expect(page.getByLabel('Calibration sample')).toHaveValue('multicolour-5');
  await expect(page.locator('#print-pages [data-side=front] img').first()).toHaveAttribute('src','assets/minh/multicolour-5.svg');
  await expect(page.locator('#print-pages [data-side=back] img').first()).toHaveAttribute('src',`assets/${set==='svg'?'cards':set}/back.svg`);
 }
 await page.getByText('Adjust double-sided alignment',{exact:true}).click();
 await page.getByLabel('Move right (mm)').fill('1.25');await page.getByLabel('Move right (mm)').blur();
 await page.getByLabel('Move down (mm)').fill('-2.5');await page.getByLabel('Move down (mm)').blur();
 const corners=await page.locator('#print-pages .print-page').evaluateAll(pages=>pages.map(page=>[...page.querySelectorAll('.registration-diamond')].map(mark=>{const m=mark.getAttribute('d').match(/^M ([\d.-]+) ([\d.-]+)/);return {x:Number(m[1]),y:Number(m[2])+1};})));
 expect(corners[0]).toHaveLength(16);expect(corners[1]).toHaveLength(16);
 for(const front of corners[0])expect(corners[1]).toContainEqual({x:210-front.x+1.25,y:front.y-2.5});
 await page.getByLabel('Colour adjustment').selectOption('lamination');await page.getByRole('slider',{name:'Midtone lift',exact:true}).fill('25');
 for(const view of ['deck','catalog','filtered','calibration','tokens','calibration','deck']){
  await page.getByLabel('What to include').selectOption(view);
  await expect(page.getByLabel('Move right (mm)')).toBeVisible();await expect(page.getByLabel('Move right (mm)')).toHaveValue('1.25');
  await expect(page.getByLabel('Move down (mm)')).toBeVisible();await expect(page.getByLabel('Move down (mm)')).toHaveValue('-2.5');
  await expect(page.getByLabel('Colour adjustment')).toBeVisible();await expect(page.getByLabel('Colour adjustment')).toHaveValue('lamination');
  await expect(page.getByRole('slider',{name:'Midtone lift',exact:true})).toBeVisible();await expect(page.getByRole('slider',{name:'Midtone lift',exact:true})).toHaveValue('25');
  await expect(page.getByLabel('Colour mode')).toBeEnabled();
 }
});
