"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.five = exports.computePrice = void 0;
function computePrice(l2, side, ttlQuoteQty) {
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
exports.computePrice = computePrice;
function five(price) {
    if (price < 1) {
        const str = price.toString();
        const index = str.search(/[1-9]/);
        if (index === -1 || index >= str.length - 4) {
            return price;
        }
        return Number(str.slice(0, index + 4));
    }
    else if (price < 10000) {
        return (Math.floor(price) +
            Number((price % 1)
                .toString()
                .padEnd(10, '0')
                .slice(0, 7 - Math.log10(price))));
    }
    else if (price < 10000) {
        return (Math.floor(price) +
            Number((price % 1).toString().padEnd(10, '0').slice(0, 3)));
    }
    return Math.round(price);
}
exports.five = five;
