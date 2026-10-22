// SPDX-License-Identifier: GPL-3.0-only
import './artwork.mjs';
import { copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
copyFileSync(new URL('../LICENSE',import.meta.url),new URL('../dist/LICENSE.txt',import.meta.url));
rmSync(new URL('../dist/hanabi-artwork.zip',import.meta.url),{force:true});
execFileSync('zip',['-qr','hanabi-artwork.zip','assets/cards','LICENSE.txt'],{cwd:new URL('../dist/',import.meta.url)});
rmSync(new URL('../dist/hanabi-source.zip',import.meta.url),{force:true});
execFileSync('zip',['-qr','dist/hanabi-source.zip','dist','scripts','tests','.github','package.json','package-lock.json','playwright.config.js','README.md','LICENSE','NOTICE.md','-x','dist/hanabi-source.zip'],{cwd:root});
console.log('Packaged artwork and complete GPLv3 source downloads.');
