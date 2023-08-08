#!/usr/bin/env node

import commander from 'commander';
import { ethers } from 'ethers';
import lodash from 'lodash';
import {
  Exchange,
  Info,
  MAINNET_API_URL,
  computePrice as computeImpactPrice,
} from '../src';

const secretKey: string = process.env.SECRET_KEY || '';
const info = new Info(MAINNET_API_URL);
const wallet = new ethers.Wallet(secretKey);
const vault: string | undefined = process.env.VAULT;

export function parsePrice(
  price: string,
  currentMid: number,
  action: string,
): number {
  let parsedprice;
  if (price.indexOf('last-') > -1) {
    // if (action == 'sell') {
    //   throw new Error(`Recommend using last+ with sell orders!`);
    // }
    const pct = parseFloat(price.slice('last-'.length, price.length - 1));
    parsedprice = currentMid - (currentMid * pct) / 100;
  } else if (price.indexOf('last+') > -1) {
    // if (action == 'buy') {
    //   throw new Error(`Recommend using last- with buy orders!`);
    // }
    const pct = parseFloat(price.slice('last+'.length, price.length - 1));
    parsedprice = currentMid + (currentMid * pct) / 100;
  } else {
    parsedprice = parseFloat(price);
  }
  if (isNaN(parsedprice)) {
    throw new Error(
      `Invalid amount ${parsedprice}. Please provide a valid number!`,
    );
  }
  return parsedprice;
}

export function five(price: number): number {
  if (price < 1) {
    const str = price.toString();
    const index = str.search(/[1-9]/);
    if (index === -1 || index >= str.length - 4) {
      return price;
    }
    return Number(str.slice(0, index + 4));
  } else if (price < 10000) {
    return (
      Math.floor(price) +
      Number(
        (price % 1)
          .toString()
          .padEnd(10, '0')
          .slice(0, 7 - Math.log10(price)),
      )
    );
  } else if (price < 10000) {
    return (
      Math.floor(price) +
      Number((price % 1).toString().padEnd(10, '0').slice(0, 3))
    );
  }
  return Math.round(price);
}

async function parseCommand(input: string[]): Promise<void> {
  const exchange = await Exchange.create(wallet, MAINNET_API_URL, vault);

  // examples
  // - pair
  if (input[0] === 'pair') {
    let [action, pair, amount] = input;

    let parsedQuoteAmount;
    if (amount.indexOf('$') > -1) {
      parsedQuoteAmount = parseFloat(amount.slice(0, amount.length - 1)) / 2;
    } else {
      throw new Error(`Amount should be in $!`);
    }

    const meta = await info.meta();

    const base = pair.split('/')[0];
    const quote = pair.split('/')[1];
    const l2s = await Promise.all([
      info.l2Snapshot(base),
      info.l2Snapshot(quote),
    ]);

    const bPx = computeImpactPrice(
      l2s.filter((r) => r.coin == base)[0],
      'long',
      parsedQuoteAmount,
    );
    const bsz = parsedQuoteAmount / bPx;
    const qPx = computeImpactPrice(
      l2s.filter((r) => r.coin == quote)[0],
      'short',
      parsedQuoteAmount,
    );
    const qsz = parsedQuoteAmount / bPx;

    console.log(`${pair} current px ${bPx / qPx} including slippage`);

    const r = await exchange.bulkOrders([
      {
        coin: base,
        isBuy: true,
        sz: parseFloat(
          bsz.toFixed(
            meta.universe.filter((u) => u.name == base)[0].szDecimals,
          ),
        ),
        limitPx: five(bPx),
        orderType: { limit: { tif: 'Ioc' } },
        reduceOnly: false,
      },
      {
        coin: quote,
        isBuy: false,
        sz: parseFloat(
          qsz.toFixed(
            meta.universe.filter((u) => u.name == quote)[0].szDecimals,
          ),
        ),
        limitPx: five(qPx),
        orderType: { limit: { tif: 'Ioc' } },
        reduceOnly: false,
      },
    ]);
    console.log(JSON.stringify(r));
  }
  // examples
  // - withdraw 1
  else if (input[0] === 'transfer') {
    let [action, amount] = input;
    const r = await exchange.usdTransfer(amount);
    console.log(JSON.stringify(r));
  }
  // examples
  // - close eth
  else if (input[0] === 'close') {
    const [action, currency] = input;
    const allMids = await info.allMids();
    const state = await info.userState(
      vault != undefined ? vault : wallet.address,
    );
    const p = state.assetPositions.filter(
      (p) => p.position.coin === currency.toLocaleUpperCase(),
    )[0];
    const currentPosition = parseFloat(p.position.szi);
    if (currentPosition != 0) {
      {
        const currentSide = currentPosition > 0 ? 'buy' : 'sell';
        const currentMid = parseFloat(allMids[currency]);
        if (!allMids[currency]) {
          throw new Error(`Unknown currency ${currency}!`);
        }
        const closePrice =
          currentPosition > 0 ? currentMid * 0.95 : currentMid * 1.05;
        console.log(`Closing ${currentPosition} ${currency} at ${closePrice}`);
        const r = await exchange.bulkOrders([
          {
            coin: currency,
            isBuy: currentSide == 'sell',
            sz: currentPosition,
            limitPx: five(closePrice),
            orderType: { limit: { tif: 'Ioc' } },
            reduceOnly: true,
          },
        ]);
        // console.log(JSON.stringify(r));
      }
    }
  }
  // exammples
  // - cancel eth
  // - cancel buy eth
  // - cancel sell eth
  else if (input[0] === 'cancel') {
    let action, side, currency;
    if (input.length == 2) {
      [action, currency] = input;
    } else {
      [action, side, currency] = input;
    }
    let oos = await info.openOrders(
      vault != undefined ? vault : wallet.address,
    );
    if (currency) {
      oos = oos.filter((oo) => oo.coin == currency);
    }
    if (side) {
      oos = oos.filter((oo) => oo.side === (side === 'buy' ? 'B' : 'A'));
    }
    const cancelRequests = oos.map((oo) => {
      return { coin: oo.coin, oid: oo.oid };
    });
    if (cancelRequests.length > 0) {
      await exchange.bulkCancel(cancelRequests);
    }
  } else if (input[0].toLowerCase() === 'autotp') {
    const allMids = await info.allMids();
    const state = await info.userState(
      vault != undefined ? vault : wallet.address,
    );
    let oos = await info.openOrders(
      vault != undefined ? vault : wallet.address,
    );
    await Promise.all(
      state.assetPositions
        .filter((ap) => parseFloat(ap.position.szi) != 0)
        .map(async (ap) => {
          const coin = ap.position.coin;
          const parsedPortions = 5;
          const ep = parseFloat(ap.position.entryPx);
          const sz = parseFloat(ap.position.szi);
          const currentSide = sz > 0 ? 'buy' : 'sell';

          const parsedLowerPrice = five(
            sz < 0 ? (ep * 99) / 100 : (ep * 101) / 100,
          );
          const parsedUpperPrice = five(
            sz < 0 ? (ep * 98) / 100 : (ep * 102) / 100,
          );

          oos = oos.filter((oo) => oo.coin == coin);
          oos = oos.filter(
            (oo) => oo.side === (currentSide === 'buy' ? 'A' : 'B'),
          );
          const cancelRequests = oos.map((oo) => {
            return { coin: oo.coin, oid: oo.oid };
          });
          if (cancelRequests.length > 0) {
            const r = await exchange.bulkCancel(cancelRequests);
            // console.log(JSON.stringify(r));
          }
          const r = await exchange.bulkOrders(
            lodash.range(1, parsedPortions + 1).map((i) => {
              return {
                coin: ap.position.coin,
                isBuy: sz < 0,
                sz: Math.abs(sz / parsedPortions),
                limitPx: five(
                  parsedLowerPrice +
                    (i * Math.abs(parsedUpperPrice - parsedLowerPrice)) /
                      parsedPortions,
                ),
                orderType: { limit: { tif: 'Alo' } },
                reduceOnly: true,
              };
            }),
          );
          // console.log(JSON.stringify(r));
        }),
    );
  }
  // - split side currency coin-size poritions price-range-a price-range-b
  // price-range-a can be last-<some-number>%
  // price-range-a can be last+<some-number>%
  // exammples
  // - split buy eth 10 10 1800 1900
  // - split sell eth 10 10 1800 1900
  // - split buy eth 10 10 last-1% last-3%
  // - split sell eth 10 10 last+1% last+3%
  else if (input[0].toLowerCase() === 'split') {
    const [_, action, currency, amount, portions, lowerPrice, upperPrice] =
      input;

    if (!['buy', 'sell'].includes(action)) {
      throw new Error(
        'Invalid action. Please provide either "buy", or "sell".',
      );
    }

    const allMids = await info.allMids();
    if (!allMids[currency]) {
      throw new Error(`Unknown currency ${currency}!`);
    }
    const currentMid = parseFloat(allMids[currency]);

    let parsedAmount;
    let meta = await info.meta();
    let coinMeta = meta.universe.filter((u) => u.name == currency)[0];
    if (amount.indexOf('$') > -1) {
      parsedAmount = (
        parseFloat(amount.slice(0, amount.length - 1)) / currentMid
      ).toFixed(coinMeta.szDecimals);
    } else {
      parsedAmount = parseFloat(amount);
    }

    if (isNaN(parsedAmount)) {
      throw new Error('Invalid amount. Please provide a valid number.');
    }

    const parsedPortions = parseInt(portions, 10);
    if (isNaN(parsedPortions)) {
      throw new Error('Invalid portions. Please provide a valid number.');
    }

    let parsedLowerPrice = five(parsePrice(lowerPrice, currentMid, action));
    let parsedUpperPrice = five(parsePrice(upperPrice, currentMid, action));

    if (parsedLowerPrice > parsedUpperPrice) {
      throw new Error(
        `${parsedLowerPrice} should be lower than ${parsedUpperPrice}`,
      );
    }

    console.log(
      `Placing ${portions} ${action} orders between ${parsedLowerPrice} and ${parsedUpperPrice} for ${parsedAmount} ${currency}`,
    );
    const r = await exchange.bulkOrders(
      lodash.range(1, parsedPortions + 1).map((i) => {
        return {
          coin: currency,
          isBuy: action === 'buy',
          sz: parseFloat(
            (parsedAmount / parsedPortions).toFixed(coinMeta.szDecimals),
          ),
          limitPx: five(
            parsedLowerPrice +
              (i * Math.abs(parsedUpperPrice - parsedLowerPrice)) /
                parsedPortions,
          ),
          orderType: { limit: { tif: 'Gtc' } },
          reduceOnly: false,
        };
      }),
    );
    console.log(JSON.stringify(r));
  } else {
    throw new Error(`Unknown command ${input}!`);
  }
  process.exit(0);
}

async function processCommand(input: string[]): Promise<void> {
  await parseCommand(input);
}

const program = new commander.Command();
program.arguments('<command...>').action(async (command: string[]) => {
  await processCommand(command);
});

program.parse(process.argv);
