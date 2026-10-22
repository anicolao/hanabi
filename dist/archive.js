// SPDX-License-Identifier: GPL-3.0-only
// Dependency-free, uncompressed ZIP writer. PNG entries are already compressed.
const encoder=new TextEncoder();
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export const textBytes=text=>encoder.encode(text);
export function makeZip(entries){
 const parts=[],central=[];let offset=0,centralSize=0;
 for(const entry of entries){
  const name=encoder.encode(entry.name),data=entry.data instanceof Uint8Array?entry.data:encoder.encode(entry.data),crc=crc32(data);
  if(name.length>65535||data.length>0xffffffff||offset>0xffffffff)throw new Error('ZIP export is too large.');
  const local=new Uint8Array(30+name.length),l=new DataView(local.buffer);
  l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);
  l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,name.length,true);local.set(name,30);
  parts.push(local,data);
  const header=new Uint8Array(46+name.length),c=new DataView(header.buffer);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);
  c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);header.set(name,46);
  central.push(header);centralSize+=header.length;offset+=local.length+data.length;
 }
 if(entries.length>65535||offset+centralSize>0xffffffff)throw new Error('ZIP export is too large.');
 const end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}
// Canvas PNGs normally declare 96 dpi. Set the physical density to 300 dpi for print.
export function setPngDpi(png,dpi=300){
 const input=new DataView(png.buffer,png.byteOffset,png.byteLength);
 if(input.getUint32(0)!==0x89504e47||input.getUint32(4)!==0x0d0a1a0a)throw new Error('Invalid PNG data.');
 const density=new Uint8Array(21),v=new DataView(density.buffer);v.setUint32(0,9);density.set(encoder.encode('pHYs'),4);
 const ppm=Math.round(dpi/0.0254);v.setUint32(8,ppm);v.setUint32(12,ppm);density[16]=1;v.setUint32(17,crc32(density.subarray(4,17)));
 const chunks=[png.subarray(0,8)];let at=8;
 while(at<png.length){const length=input.getUint32(at),end=at+12+length;if(end>png.length)throw new Error('Invalid PNG chunk.');const kind=String.fromCharCode(...png.subarray(at+4,at+8));if(kind!=='pHYs')chunks.push(png.subarray(at,end));if(kind==='IHDR')chunks.push(density);at=end;}
 const output=new Uint8Array(chunks.reduce((size,chunk)=>size+chunk.length,0));let pos=0;for(const chunk of chunks){output.set(chunk,pos);pos+=chunk.length;}return output;
}
