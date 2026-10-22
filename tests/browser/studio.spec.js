import { test, expect } from '@playwright/test';
const pdfPages = buffer => {
  const text = buffer.toString('latin1');
  const sizes = [...text.matchAll(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/g)].map(m => ({width:Number(m[1]),height:Number(m[2])}));
  return {count:(text.match(/\/Type\s*\/Page\b/g)||[]).length,sizes};
};
test.beforeEach(async({page})=>{await page.goto('/');});
test('gallery filters, keyboard dialog, shared back and SVG download',async({page})=>{
  await expect(page.locator('.card-tile')).toHaveCount(25);
  await page.getByRole('button',{name:'Blue',exact:true}).click();
  await page.getByLabel('Value',{exact:true}).selectOption('5');
  await expect(page.locator('.card-tile')).toHaveCount(1);
  await expect(page.locator('#gallery-count')).toHaveText('1 unique front · 1 playing card');
  await page.getByRole('button',{name:'Inspect Blue 5, Wave, 1 copy',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Blue 5',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Download SVG'})).toHaveAttribute('href','assets/cards/blue-5.svg');
  const downloadPromise=page.waitForEvent('download'); await page.getByRole('link',{name:'Download SVG'}).click();
  expect((await downloadPromise).suggestedFilename()).toBe('hanabi-blue-5.svg');
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button',{name:'View card back'}).click();
  await expect(page.getByRole('dialog')).toContainText('One shared sky.');
  await expect(page.locator('#detail-image')).toHaveAttribute('src','assets/cards/back.svg');
});
test('full set, filtered copies, sampler, separate jobs and tokens',async({page})=>{
  await expect(page.locator('#print-total')).toHaveText('50 cards · 6 sheets · 12 PDF pages');
  await page.getByRole('button',{name:'Next page',exact:true}).click();
  await expect(page.locator('#preview-description')).toHaveText('A4 · BACKS');
  await page.getByLabel('What to include').selectOption('catalog');
  await expect(page.locator('#print-total')).toHaveText('25 cards · 3 sheets · 6 PDF pages');
  await page.getByLabel('Print sides').selectOption('front');
  await expect(page.locator('#print-pages .print-page')).toHaveCount(3);
  await page.getByRole('button',{name:'Red',exact:true}).click();
  await page.getByLabel('Value',{exact:true}).selectOption('1');
  await page.getByLabel('What to include').selectOption('filtered');
  await expect(page.locator('#print-total')).toHaveText('3 cards · 1 sheet · 1 PDF page');
  await page.getByLabel('Print sides').selectOption('back');
  await expect(page.locator('#print-pages .printed-card img')).toHaveCount(3);
  await page.getByLabel('What to include').selectOption('tokens');
  await expect(page.getByLabel('Print sides')).toBeDisabled();
  await expect(page.locator('#print-pages .token')).toHaveCount(11);
  await expect(page.locator('#print-pages .token.fuse')).toHaveCount(3);
});
test('Letter monochrome and calibration retain physical card dimensions',async({page})=>{
  await page.getByLabel('Paper size').selectOption('letter');
  await page.getByLabel('Artwork',{exact:true}).selectOption('mono');
  await page.getByText('Adjust double-sided alignment',{exact:true}).click();
  const original=await page.locator('#print-pages [data-side="back"]').first().locator('.printed-card').first().evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
  await page.getByLabel('Move right (mm)').fill('1.25'); await page.getByLabel('Move right (mm)').blur();
  await page.getByLabel('Move down (mm)').fill('-2.5'); await page.getByLabel('Move down (mm)').blur();
  const changed=await page.locator('#print-pages [data-side="back"]').first().locator('.printed-card').first().evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
  expect(changed).toEqual({x:original.x+1.25,y:original.y-2.5});
  await expect(page.locator('#print-pages .printed-card img').first()).toHaveAttribute('src',/red-1-mono.svg/);
  await page.emulateMedia({media:'print'});
  const bounds=await page.locator('#print-pages .printed-card').first().boundingBox();
  expect(bounds.width).toBeCloseTo(63*96/25.4,0); expect(bounds.height).toBeCloseTo(88*96/25.4,0);
  await expect(page.locator('main')).not.toBeVisible();
  const pdf=pdfPages(await page.pdf({preferCSSPageSize:true,printBackground:true}));
  expect(pdf.count).toBe(12);
  for(const pdfPage of pdf.sizes){expect(pdfPage.width).toBeCloseTo(612,0);expect(pdfPage.height).toBeCloseTo(792,0);}
});
test('A4 PDF has twelve pages, correct paper, and a five-card final sheet',async({page})=>{
  await expect(page.locator('#print-pages .print-page').nth(10).locator('.printed-card')).toHaveCount(5);
  await expect(page.locator('#print-pages .print-page').nth(11).locator('.printed-card')).toHaveCount(5);
  await page.emulateMedia({media:'print'});
  const pdf=pdfPages(await page.pdf({preferCSSPageSize:true,printBackground:true}));
  expect(pdf.count).toBe(12);
  expect(pdf.sizes[0].width).toBeCloseTo(210/25.4*72,0);
  expect(pdf.sizes[0].height).toBeCloseTo(297/25.4*72,0);
});
test('responsive layout, loaded artwork, working ZIPs and print action',async({page,request},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('link',{name:'Make your set ↗',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#preview-holder img').first().waitFor();
  expect(await page.locator('#preview-holder img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
  for(const url of ['/hanabi-artwork.zip','/hanabi-source.zip']) {const response=await request.get(url);expect(response.ok()).toBe(true);expect((await response.body()).subarray(0,2).toString()).toBe('PK');}
  // Exercise the real handler but intercept the OS dialog in automated testing.
  await page.evaluate(()=>{window.print=()=>{document.body.dataset.printInvoked='true';};});
  await page.getByRole('button',{name:'Print / save PDF'}).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-invoked','true');
  expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath('print-studio.png'),fullPage:false});
  await page.getByRole('link',{name:'hanabi ✳',exact:true}).first().click();
  await page.screenshot({path:testInfo.outputPath('home.png'),fullPage:false});
});
