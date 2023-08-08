import { L2Snapshot } from './types';

export function computePrice(
  l2: L2Snapshot,
  side: 'long' | 'short',
  ttlQuoteQty: number,
): number {
  let quoteQty = 0;
  if (side == 'short') {
    for (const level of l2.levels[0]) {
      const levelQuoteQty = parseFloat(level.sz) * parseFloat(level.px);
      if (quoteQty + levelQuoteQty > ttlQuoteQty) {
        return parseFloat(level.px);
      }
      quoteQty += levelQuoteQty;
    }
  }

  for (const level of l2.levels[1]) {
    const levelQuoteQty = parseFloat(level.sz) * parseFloat(level.px);
    if (quoteQty + levelQuoteQty > ttlQuoteQty) {
      return parseFloat(level.px);
    }
    quoteQty += levelQuoteQty;
  }

  throw new Error('Should not be reached!');
}
