// SPDX-License-Identifier: GPL-3.0-only
export const suits = [
  { id: 'red', name: 'Red', motif: 'Sun', symbol: '☀', color: '#c74436', light: '#f4a377' },
  { id: 'yellow', name: 'Yellow', motif: 'Star', symbol: '★', color: '#a56d13', light: '#f5ce63' },
  { id: 'green', name: 'Green', motif: 'Leaf', symbol: '♧', color: '#287163', light: '#8cc7a4' },
  { id: 'blue', name: 'Blue', motif: 'Wave', symbol: '≈', color: '#3263a5', light: '#94c8e9' },
  { id: 'white', name: 'White', motif: 'Diamond', symbol: '◇', color: '#5d6276', light: '#e9e8ed' }
];
export const multiplicities = [0, 3, 2, 2, 2, 1];
export const cards = suits.flatMap(suit => Array.from({ length: 5 }, (_, i) => ({
  id: `${suit.id}-${i + 1}`, suit, rank: i + 1, copies: multiplicities[i + 1]
})));
export const multicolourSuit = { id: 'multicolour', name: 'Multicolour', motif: 'Rainbow diamond', symbol: '◇', color: '#7056ad', light: '#dfd4f5' };
export const minhCards = [...cards.filter(card => card.suit.id !== 'white'), ...Array.from({length:5}, (_, i) => ({id:`multicolour-${i+1}`, suit:multicolourSuit, rank:i+1, copies:1}))];
export function cardsForSet(set = 'diagonal') { return set === 'minh' ? minhCards : cards; }
export const papers = { a4: { width: 210, height: 297 }, letter: { width: 215.9, height: 279.4 } };
export function makeSheets(selection = cards, { paper = 'a4', quantity = 'deck', side = 'both', x = 0, y = 0 } = {}) {
  const { width, height } = papers[paper];
  const deck = selection.flatMap(card => Array.from({ length: quantity === 'deck' ? card.copies : 1 }, () => card));
  const pages = [];
  for (let i = 0; i < deck.length; i += 9) {
    const front = deck.slice(i, i + 9).map((card, j) => ({ card, x: (width - 189) / 2 + (j % 3) * 63, y: (height - 264) / 2 + Math.floor(j / 3) * 88 }));
    if (side !== 'back') pages.push({ sheet: i / 9 + 1, side: 'front', items: front });
    if (side !== 'front') pages.push({ sheet: i / 9 + 1, side: 'back', items: front.map(item => ({ ...item, x: width - item.x - 63 + x, y: item.y + y })) });
  }
  return pages;
}

export const artworkSets = {
  diagonal: { directory: 'diagonal', label: 'Painted diagonal' },
  painted: { directory: 'painted', label: 'Painted classic' },
  minh: { directory: 'minh', label: 'Minh · Hanab Live multicolour' },
  live: { directory: 'live', label: 'Hanab Live style' },
  svg: { directory: 'cards', label: 'Original SVG' }
};
export function artworkPath(id, set = 'diagonal', mono = false) {
  if (!artworkSets[set]) throw new Error('Unknown artwork set.');
  return `assets/${artworkSets[set].directory}/${id}${mono ? '-mono' : ''}.svg`;
}
