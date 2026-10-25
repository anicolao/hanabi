// SPDX-License-Identifier: GPL-3.0-only
import { artworkPath } from './deck.js';
import {laminationRamp,imageLift} from './lamination.js';
export function calibrationSamples(set,id){
 return laminationRamp.map((lift,index)=>({id,lift,index,path:artworkPath(id,set),label:lift?`Midtone lift ${lift}%`:'Standard · 0%'}));
}
