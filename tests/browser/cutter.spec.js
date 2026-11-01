import {test,expect} from '@playwright/test';
test('7 mm cutter channel ticks flank centre cuts by 3.5 mm on both sides and follow duplex offsets',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('What to include').selectOption('calibration');await page.getByText('Adjust double-sided alignment',{exact:true}).click();await page.getByLabel('Move right (mm)').fill('1.25');await page.getByLabel('Move right (mm)').blur();await page.getByLabel('Move down (mm)').fill('-2.5');await page.getByLabel('Move down (mm)').blur();
 for(const paper of ['a4','letter'])for(const edges of ['framed','full-bleed']){
  await page.getByLabel('Paper size').selectOption(paper);await page.getByLabel('Card edges').selectOption(edges);
  const marks=await page.locator('#print-pages .print-page').evaluateAll(pages=>pages.slice(0,2).map(page=>[...page.querySelectorAll('.cutter-channel-mark')].map(el=>{
   const [,x,y]=el.getAttribute('d').match(/^M([\d.-]+) ([\d.-]+)/);return {axis:el.dataset.axis,cut:Number(el.dataset.cut),offset:Number(el.dataset.offset),x:Number(x),y:Number(y)};
  })));
  expect(marks[0].length).toBeGreaterThanOrEqual(edges==='full-bleed'?80:24);
  for(const side of marks)for(const mark of side){
   expect(Math.abs(mark.offset)).toBe(3.5);expect(mark[mark.axis]).toBeCloseTo(mark.cut+mark.offset,8);
   const limit=mark.axis==='x'?(paper==='a4'?210:215.9):(paper==='a4'?297:279.4),opposite=mark.cut-mark.offset;
   expect(side.some(other=>other.axis===mark.axis&&other.cut===mark.cut&&other.offset===-mark.offset)).toBe(opposite>=3.2&&opposite<=limit-3.2);
   expect(mark[mark.axis]).toBeGreaterThanOrEqual(3.2);expect(mark[mark.axis]).toBeLessThanOrEqual(limit-3.2);
  }
  const frontCuts=axis=>[...new Set(marks[0].filter(m=>m.axis===axis).map(m=>m.cut))];
  for(const axis of ['x','y']){const cuts=[...new Set(marks[1].filter(m=>m.axis===axis).map(m=>m.cut))];for(const cut of frontCuts(axis))expect(cuts.some(back=>Math.abs(back-(axis==='x'?cut+1.25:cut-2.5))<1e-8)).toBe(true);}
  await page.emulateMedia({media:'print'});
  const pair=page.locator('#print-pages .print-page').first().locator('.cutter-channel-mark[data-axis=x]');
  const a=await pair.nth(0).boundingBox(),b=await pair.nth(1).boundingBox();expect(Math.abs(b.x-a.x)).toBeCloseTo(7*96/25.4,1);
  await page.emulateMedia({media:'screen'});
 }
});

test('Letter centre marks occupy ninety percent of narrower gutters and stay inside printable margins',async({page})=>{
 await page.goto('/?deck=minh');await page.getByLabel('Paper size').selectOption('letter');await page.getByLabel('Card edges').selectOption('full-bleed');await page.getByLabel('Print sides').selectOption('back');
 const geometry=await page.locator('#print-pages .print-page').first().evaluate(el=>{
  const paths=[...el.querySelectorAll('.centre-crop-mark')].map(mark=>{const [,x1,y1,x2,y2]=mark.getAttribute('d').match(/^M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)/).map(Number);return {x1,y1,x2,y2,length:Math.hypot(x2-x1,y2-y1)};});
  return {paths,halo:el.querySelector('.mark-halo')?.getAttribute('stroke')};
 });
 expect(geometry.halo).toBe('white');expect(geometry.paths).toHaveLength(48);
 for(const mark of geometry.paths){expect(Math.min(Math.abs(mark.length-.9),Math.abs(mark.length-1.8))).toBeLessThan(.00001);for(const y of [mark.y1,mark.y2]){expect(y).toBeGreaterThanOrEqual(4.7);expect(y).toBeLessThanOrEqual(279.4-4.7);}}
 await page.emulateMedia({media:'print'});const pdf=(await page.pdf({preferCSSPageSize:true,printBackground:true})).toString('latin1');expect((pdf.match(/\/Type\s*\/Page\b/g)||[]).length).toBe(7);
});
