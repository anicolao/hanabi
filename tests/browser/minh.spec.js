import {test,expect} from '@playwright/test';
test('Minh share link prints exactly 45 cards and switches suits and quantities correctly',async({page})=>{
 await page.goto('/?deck=minh');
 await expect(page.locator('#art-set')).toHaveValue('minh');
 await expect(page.locator('#print-total')).toHaveText('45 cards · 5 sheets · 10 PDF pages');
 await expect(page.locator('#print-pages [data-side=front] .printed-card')).toHaveCount(45);
 for(let rank=1;rank<=5;rank++)await expect(page.locator(`#print-pages [data-side=front] [data-card="multicolour-${rank}"]`)).toHaveCount(1);
 await expect(page.locator('#print-pages [data-card^=white]')).toHaveCount(0);
 await page.locator('#gallery > summary').click();
 await page.getByRole('button',{name:'Multicolour',exact:true}).click();
 await expect(page.locator('#gallery-count')).toHaveText('5 unique fronts · 5 playing cards');
 await expect(page.locator('.card-tile')).toHaveCount(5);
 await page.getByLabel('What to include').selectOption('filtered');
 await expect(page.locator('#print-total')).toHaveText('5 cards · 1 sheet · 2 PDF pages');
 await page.getByLabel('Card artwork').selectOption('live');
 await expect(page.getByRole('button',{name:'White',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Multicolour',exact:true})).toHaveCount(0);
 await expect(page.locator('#print-total')).toContainText('50 cards');
});

test('Minh colour and monochrome artwork keep every edge black and omit colour labels',async({page})=>{
 await page.goto('/?deck=minh');
 const result=await page.evaluate(async()=>{
  const {minhCards,artworkPath}=await import('/deck.js');
  const failures=[];
  for(const mono of [false,true])for(const id of [...minhCards.map(c=>c.id),'back']){
   const url=artworkPath(id,'minh',mono),svg=new DOMParser().parseFromString(await (await fetch(url)).text(),'image/svg+xml');
   if([...svg.querySelectorAll('text')].some(el=>!/^[1-5]$/.test(el.textContent)))failures.push(`${url}: printed label`);
   const img=new Image();img.src=url;await img.decode();
   const canvas=document.createElement('canvas');canvas.width=286;canvas.height=406;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,286,406);const pixels=ctx.getImageData(0,0,286,406).data;
   for(let y=0;y<406;y++)for(let x=0;x<286;x++)if(x<10||x>=276||y<10||y>=396){const i=(y*286+x)*4;if(pixels[i]||pixels[i+1]||pixels[i+2]||pixels[i+3]!==255){failures.push(`${url}: edge ${x},${y}`);y=406;break;}}
  }
  return failures;
 });
 expect(result).toEqual([]);
 const bleed=page.locator('#print-pages .bleed').first();await expect(bleed).toHaveCSS('background-color','rgb(0, 0, 0)');
 await page.getByLabel('Colour mode').selectOption('mono');await expect(bleed).toHaveCSS('background-color','rgb(0, 0, 0)');
});
