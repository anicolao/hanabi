import { test,expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const inspectZip=String.raw`import sys,zipfile,json,struct,zlib,hashlib,collections
with zipfile.ZipFile(sys.argv[1]) as z:
 assert z.testzip() is None
 m=json.loads(z.read('manifest.json'))
 expected=45 if m['artwork']=='minh' else 50
 assert m['cardCount']==expected and len(m['cards'])==expected
 fronts=[n for n in z.namelist() if n.startswith('fronts/') and n.endswith('.png')]
 backs=[n for n in z.namelist() if n.startswith('back/') and n.endswith('.png')]
 assert len(fronts)==expected and backs==['back/shared-back.png']
 assert len(z.read('deck.csv').decode().splitlines())==expected+1
 assert '63 x 88 mm' in z.read('README.txt').decode()
 assert 'Unzip' in z.read('README.txt').decode()
 assert 'LICENSE.txt' in z.namelist() and 'NOTICE.txt' in z.namelist()
 hashes={}
 for n in fronts+backs:
  data=z.read(n);assert data[:8]==b'\x89PNG\r\n\x1a\n'.decode('unicode_escape').encode('latin1')
  assert struct.unpack('>II',data[16:24])==(816,1110)
  at=8;density=[]
  while at<len(data):
   size=struct.unpack('>I',data[at:at+4])[0];kind=data[at+4:at+8];payload=data[at+8:at+8+size]
   crc=struct.unpack('>I',data[at+8+size:at+12+size])[0]
   assert zlib.crc32(kind+payload)&0xffffffff==crc
   if kind==b'pHYs':density.append(struct.unpack('>IIB',payload))
   at+=size+12
  assert density==[(11811,11811,1)]
  hashes[n]=hashlib.sha256(data).hexdigest()
 assert len({hashes[n] for n in fronts})==25
 for suit in ['red','yellow','green','blue']+(['multicolour'] if m['artwork']=='minh' else ['white']):
  rows=[c for c in m['cards'] if c['suit']==suit]
  assert [c['rank'] for c in rows]==([1,2,3,4,5] if suit=='multicolour' else [1,1,1,2,2,3,3,4,4,5])
  for rank in range(1,6):assert len({hashes[c['file']] for c in rows if c['rank']==rank})==1
 first=m['cards'][0]['file'];open(sys.argv[2],'wb').write(z.read(first))
 print(json.dumps({'artwork':m['artwork'],'colourMode':m['colourMode'],'fronts':len(fronts),'bytes':sum(i.file_size for i in z.infolist())}))
`;
for(const set of ['diagonal','painted','live','svg','minh']){
 test(`${set}: MPC button downloads the correct 300 dpi PNG fronts and a shared back`,async({page},info)=>{
  test.skip(info.project.name==='phone'&&set!=='svg','Full raster ZIP checks run on desktop; phone checks the vector export.');
  test.setTimeout(90000);
  await page.goto('/');await page.getByLabel('Card artwork').selectOption(set);
  if(set==='live')await page.getByLabel('Colour mode').selectOption('mono');
  // Home printer settings must never leak into these production images.
  await page.getByLabel('Paper size').selectOption('letter');await page.getByLabel('Print sides').selectOption('back');
  await page.getByLabel('What to include').selectOption('catalog');
  const downloadPromise=page.waitForEvent('download',{timeout:60000});
  await page.getByRole('button',{name:'Download MPC ZIP'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe(`hanabi-mpc-${set}${set==='live'?'-mono':''}.zip`);
  const first=info.outputPath('first-front.png');
  const result=JSON.parse(execFileSync('python3',['-c',inspectZip,await download.path(),first],{encoding:'utf8'}));
  expect(result.artwork).toBe(set);expect(result.fronts).toBe(set==='minh'?45:50);expect(result.colourMode).toBe(set==='live'?'black-and-white':'colour');
  await expect(page.locator('#mpc-status')).toContainText(`${set==='minh'?45:50} fronts, one shared back`);
  const pixels=await page.evaluate(async({data,mono})=>{
   const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=816;canvas.height=1110;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const field=[...ctx.getImageData(110,100,1,1).data];const sample=ctx.getImageData(0,0,816,1110).data;let opaque=true,gray=true;for(let i=0;i<sample.length;i+=4){if(sample[i+3]!==255)opaque=false;if(sample[i]!==sample[i+1]||sample[i+1]!==sample[i+2])gray=false;}return {field,opaque,gray};
  },{data:readFileSync(first).toString('base64'),mono:set==='live'});
  expect(pixels.opaque).toBe(true);if(set==='diagonal')expect(Math.max(...pixels.field.slice(0,3))).toBeLessThan(30);if(set==='live')expect(pixels.gray).toBe(true);
 });
}
test('MPC failures show a recoverable error and re-enable the button',async({page})=>{
 await page.route('**/assets/diagonal/red-1.svg',route=>route.abort());await page.goto('/');
 await page.getByRole('button',{name:'Download MPC ZIP'}).click();
 await expect(page.locator('#mpc-error')).toContainText('Could not prepare');await expect(page.getByRole('button',{name:'Download MPC ZIP'})).toBeEnabled();
});
