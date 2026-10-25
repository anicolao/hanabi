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
test('colour calibration prints one unclipped actual-size page on A4 and Letter',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('Colour mode').selectOption('mono');await page.getByLabel('Print sides').selectOption('back');
 await page.getByLabel('What to include').selectOption('calibration');
 await expect(page.getByLabel('Colour mode')).toHaveValue('colour');await expect(page.getByLabel('Colour mode')).toBeDisabled();await expect(page.getByLabel('Print sides')).toBeDisabled();
 await expect(page.locator('#print-total')).toHaveText('Colour calibration · 1 sheet · 1 PDF page');
 await expect(page.locator('#preview-description')).toHaveText('COLOUR CALIBRATION · SINGLE SIDE');
 await expect(page.locator('#print-pages .calibration-samples img')).toHaveCount(6);
 await expect(page.locator('#print-pages .colour-swatch')).toHaveCount(6);await expect(page.locator('#print-pages .gray-swatch')).toHaveCount(11);
 for(const paper of ['a4','letter']){
  await page.getByLabel('Paper size').selectOption(paper);
  await page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.emulateMedia({media:'print'});
  const layout=await page.locator('#print-pages .calibration-page').evaluate(el=>{
   const page=el.getBoundingClientRect(),image=el.querySelector('img').getBoundingClientRect(),note=el.querySelector('.calibration-note').getBoundingClientRect(),ruler=el.querySelector('.scale-check').getBoundingClientRect();
   return {width:image.width,height:image.height,ruler:ruler.width,noteBottom:note.bottom-page.top,pageHeight:page.height,overflow:el.scrollWidth>el.clientWidth};
  });
  expect(layout.width).toBeCloseTo(63*96/25.4,0);expect(layout.height).toBeCloseTo(88*96/25.4,0);expect(layout.ruler).toBeCloseTo(100*96/25.4,0);expect(layout.noteBottom).toBeLessThan(layout.pageHeight-20);expect(layout.overflow).toBe(false);
  const pdf=(await page.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1');expect((pdf.match(/\/Type\s*\/Page\b/g)||[]).length).toBe(1);
  const media=pdf.match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/);expect(Number(media[1])).toBeCloseTo(paper==='a4'?210/25.4*72:612,0);
  await page.emulateMedia({media:'screen'});
 }
 await page.getByLabel('Card artwork').selectOption('svg');await expect(page.locator('#print-pages .calibration-samples img').last()).toHaveAttribute('src','assets/cards/back.svg');
 await page.getByLabel('What to include').selectOption('deck');await expect(page.getByLabel('Colour mode')).toBeEnabled();await expect(page.getByLabel('Print sides')).toBeEnabled();await expect(page.locator('#print-total')).toContainText('50 cards');
});
