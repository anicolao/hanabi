// SPDX-License-Identifier: GPL-3.0-only
import { artworkPath } from './deck.js';
import {laminationRamp,imageLift} from './lamination.js';
export function calibrationSamples(set,id,mono=false){
 const sampleSet=id==='multicolour-5'?'minh':set;
 return laminationRamp.map((lift,index)=>({id,set:sampleSet,lift,index,path:artworkPath(id,sampleSet,mono),label:lift?`Midtone lift ${lift}%`:'Standard · 0%'}));
}
