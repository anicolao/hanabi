// SPDX-License-Identifier: GPL-3.0-only
// Pantheon gloss-v2 recipe: gamma lift blended as luminosity in sRGB.
export const laminationRamp=[0,5,10,15,20,25,30,40,50];
export function clampLift(value){return Math.max(0,Math.min(50,Number(value)||0));}
export function liftFilter(strength,id=`lamination-${clampLift(strength)}`){
 const exponent=1/(1+clampLift(strength)/100);
 return `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1" result="opaque"/><feComponentTransfer in="opaque" result="lifted"><feFuncR type="gamma" amplitude="1" exponent="${exponent}" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="${exponent}" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="${exponent}" offset="0"/></feComponentTransfer><feBlend in="lifted" in2="opaque" mode="luminosity" result="toned"/><feComposite in="toned" in2="SourceGraphic" operator="in"/></filter>`;
}
export function printFilters(strength,prefix='lamination-'){
 return `<svg class="print-filters" aria-hidden="true" width="0" height="0" style="position:absolute"><defs>${[...new Set([...laminationRamp,clampLift(strength)])].map(value=>liftFilter(value,`${prefix}${value}`)).join('')}</defs></svg>`;
}
export function toneSvg(svg,strength){
 if(!clampLift(strength))return svg;
 return svg.replace(/(<svg\b[^>]*>)/,`$1<defs>${liftFilter(strength,'export-lamination')}</defs><g filter="url(#export-lamination)">`).replace(/<\/svg>\s*$/,'</g></svg>');
}
export function imageLift(strength,prefix='lamination-'){return clampLift(strength)?`url(#${prefix}${clampLift(strength)})`:'none';}
