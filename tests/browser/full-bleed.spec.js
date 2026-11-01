import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const ready=page=>page.locator('#print-pages img').evaluateAll(imgs=>Promise.all(imgs.map(async img=>{await img.artworkReady;await img.decode();})));
test('full bleed removes front/back frames in every artwork and both colour modes',async({page})=>{
 await page.goto('/');
 const results=await page.evaluate(async()=>{
  const {artworkUrl}=await import('/full-bleed.js'),out=[];
  for(const set of ['diagonal','painted','minh','live','svg'])for(const mono of [false,true])for(const id of ['red-5','back']){
   const url=await artworkUrl(id,set,mono,true),source=await(await fetch(url)).text(),root=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
   const rects=[...root.children].filter(el=>el.localName==='rect');
   const img=new Image();img.src=await artworkUrl(id,set,mono,true,1);await img.decode();const canvas=document.createElement('canvas');canvas.width=286;canvas.height=406;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,286,406);
   out.push({set,id,mono,flag:root.getAttribute('data-edge-treatment'),perimeter:rects.filter(el=>el.getAttribute('fill')==='none'&&el.hasAttribute('stroke')).length,corner:[...ctx.getImageData(1,1,1,1).data]});
  }
  return out;
 });
 for(const result of results){expect(result.flag).toBe('full-bleed');expect(result.perimeter).toBe(0);expect(result.corner[3]).toBe(255);if(result.id==='back'&&['minh','live'].includes(result.set))expect(result.corner).toEqual([0,0,0,255]);}
});
test('full-bleed suit sheets use shared cuts and retain guttered calibration',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('Card edges').selectOption('full-bleed');await ready(page);
 await expect(page.locator('#print-total')).toHaveText('60 printed · 55 required + 5 spares · 7 sheets · 14 PDF pages');
 const positions=await page.locator('#print-pages .print-page').evaluateAll(pages=>[0,1].map(i=>[...pages[i].querySelectorAll('.printed-card')].map(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}))));
 expect(positions[0]).toHaveLength(9);expect(positions[0][1].x-positions[0][0].x).toBe(63);expect(positions[0][3].y-positions[0][0].y).toBe(88);
 for(let i=0;i<9;i++){expect(positions[0][i].x+positions[1][i].x+63).toBeCloseTo(210);expect(positions[0][i].y).toBe(positions[1][i].y);}
 await page.emulateMedia({media:'print'});const trim=await page.locator('#print-pages .printed-card').first().boundingBox(),bleed=await page.locator('#print-pages .bleed').first().boundingBox();expect(trim.width).toBeCloseTo(63*96/25.4,0);expect(trim.height).toBeCloseTo(88*96/25.4,0);expect(bleed.width).toBeCloseTo(65*96/25.4,0);expect(bleed.height).toBeCloseTo(90*96/25.4,0);
 await page.emulateMedia({media:'screen'});await page.getByLabel('What to include').selectOption('calibration');await ready(page);
 await expect(page.locator('#print-total')).toHaveText('Alignment & colour test · 9 samples · 1 sheet · 2 PDF pages');
 expect(await page.locator('#print-pages [data-side=front] .printed-card').evaluateAll(els=>els.map(el=>Number(el.dataset.lift)))).toEqual([0,5,10,15,20,25,30,40,50]);
 for(const paper of ['a4','letter']){
  await page.getByLabel('Paper size').selectOption(paper);await ready(page);await page.emulateMedia({media:'print'});
  const boxes=await page.locator('#print-pages [data-side=front] .printed-card').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y};}));
  expect(boxes).toHaveLength(9);for(const box of boxes){expect(box.width).toBeCloseTo(63*96/25.4,0);expect(box.height).toBeCloseTo(88*96/25.4,0);}
  expect(boxes[2].x-boxes[0].x).toBeCloseTo(130*96/25.4,0);expect(boxes[8].y-boxes[0].y).toBeCloseTo(180*96/25.4,0);
  const pdf=(await page.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1');expect((pdf.match(/\/Type\s*\/Page\b/g)||[]).length).toBe(2);
  await page.emulateMedia({media:'screen'});
 }
 await page.emulateMedia({media:'screen'});await page.evaluate(()=>{window.print=()=>document.body.dataset.printInvoked='true';});await page.getByRole('button',{name:'Print / save PDF'}).click();await expect(page.locator('body')).toHaveAttribute('data-print-invoked','true');
 await page.getByLabel('Card edges').selectOption('framed');await expect(page.locator('#print-total')).toHaveText('Alignment & colour test · 9 samples · 1 sheet · 2 PDF pages');
});
test('full-bleed MPC download has art-coloured edges on both faces and a frameless shared back',async({page},info)=>{
 await page.goto('/?deck=minh');await page.getByLabel('Card edges').selectOption('full-bleed');await page.getByLabel('Colour adjustment').selectOption('lamination');
 const pending=page.waitForEvent('download');await page.locator('#mpc-export').click();const download=await pending;expect(download.suggestedFilename()).toBe('hanabi-mpc-minh-full-bleed-lift-20.zip');
 const front=info.outputPath('front.png'),back=info.outputPath('back.png');
 execFileSync('python3',['-c',`import sys,zipfile,json,struct
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 m=json.loads(z.read('manifest.json'));assert m['edgeTreatment']=='full-bleed' and m['cardCount']==55
 assert 'Full bleed' in z.read('README.txt').decode()
 for name,path in [(m['cards'][0]['file'],sys.argv[2]),('back/shared-back.png',sys.argv[3])]:
  data=z.read(name);assert struct.unpack('>II',data[16:24])==(816,1110);open(path,'wb').write(data)`,await download.path(),front,back]);
 const pixels=await page.evaluate(async data=>Promise.all(data.map(async png=>{const img=new Image();img.src='data:image/png;base64,'+png;await img.decode();const canvas=document.createElement('canvas');canvas.width=816;canvas.height=1110;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return [...ctx.getImageData(1,200,1,1).data];})),[front,back].map(file=>readFileSync(file).toString('base64')));
 expect(pixels[0][0]).toBe(255);expect(pixels[0][1]).toBeGreaterThan(190);expect(pixels[0][1]).toBeLessThan(230);expect(pixels[1]).toEqual([0,0,0,255]);
});
