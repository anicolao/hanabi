// SPDX-License-Identifier: GPL-3.0-only
import './artwork.mjs';
import './live-artwork.mjs';
import './painted-artwork.mjs';
import './diagonal-artwork.mjs';
import { copyFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const root = new URL('../', import.meta.url);
copyFileSync(new URL('../LICENSE',import.meta.url),new URL('../dist/LICENSE.txt',import.meta.url));
copyFileSync(new URL('../NOTICE.md',import.meta.url),new URL('../dist/NOTICE.txt',import.meta.url));
rmSync(new URL('../dist/hanabi-artwork.zip',import.meta.url),{force:true});
execFileSync('zip',['-qr','dist/hanabi-artwork.zip','dist/assets','LICENSE','NOTICE.md','references/hanab-live','artwork'],{cwd:root});
rmSync(new URL('../dist/hanabi-source.zip',import.meta.url),{force:true});
execFileSync('zip',['-qr','dist/hanabi-source.zip','dist','scripts','tests','.gitignore','.github','artwork','references','package.json','package-lock.json','playwright.config.js','README.md','LICENSE','NOTICE.md','-x','dist/hanabi-source.zip','dist/hanabi-artwork.zip','dist/assets/painted/*.svg','dist/assets/live/*.svg','dist/assets/diagonal/*.svg'],{cwd:root});
console.log('Packaged artwork and complete GPLv3 source downloads.');
