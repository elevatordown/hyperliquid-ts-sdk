import 'dotenv/config';
import { ethers } from 'ethers';
import lodash from 'lodash';
import { Markup, Telegraf } from 'telegraf';
import { Exchange, HLP_ADDRESS, Info, MAINNET_API_URL } from '../src';
import { five } from '../src/util';

// Based off of https://github.com/feathers-studio/telegraf-docs/blob/master/examples/keyboard-bot.ts

const bot = new Telegraf(process.env.BOT_TOKEN!);
const CHAT_ID = process.env.CHAT_ID;
const info = new Info(MAINNET_API_URL);
const wallet = new ethers.Wallet(process.env.SECRET_KEY!);
const vault: string | undefined = process.env.VAULT;

const CONTRACTS_FETCH_INTERVAL = 5 * 60 * 1000;
const NUM_LADDER_ORDERS = 25;
const DEFAULT_LADDER_RANGE = 10;
const TOTAL_POSITION_SIZE = 10000;

async function fetchHlp() {
  try {
    const vaultDetails = await info.vaultDetails(undefined, HLP_ADDRESS);
    const pnl = vaultDetails['portfolio']['day']['pnlHistory'];
    bot.telegram.sendMessage(
      CHAT_ID!,
      `INFO: HLP day pnl ${parseFloat(
        pnl[pnl.length - 1][1],
      ).toLocaleString()}$`,
    );
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
}

async function fetchMeta() {
  try {
    const meta = await info.metaAndAssetCtxs();
    meta[0].universe.forEach((u, i) => {
      u['change24h'] =
        ((parseFloat(meta[1][i].markPx) - parseFloat(meta[1][i].prevDayPx)) *
          100) /
        parseFloat(meta[1][i].markPx);
      u['funding24h'] = parseFloat(meta[1][i].funding) * 24 * 100;
    });

    let log = '';
    const copy = meta[0].universe.slice();
    copy.sort((a, b) => Math.abs(b['change24h']) - Math.abs(a['change24h']));
    copy
      .slice(0, 4)
      .forEach(
        (u) =>
          (log += `INFO: ${u.name.padStart(6)}, change24h ${u['change24h']
            .toFixed(2)
            .padStart(6)}%\n`),
      );
    bot.telegram.sendMessage(CHAT_ID!, log);

    log = '';
    meta[0].universe
      .sort((a, b) => Math.abs(b['funding24h']) - Math.abs(a['funding24h']))
      .slice(0, 4)
      .forEach(
        (u) =>
          (log += `INFO: ${u.name.padStart(6)}, funding24h ${u['funding24h']
            .toFixed(2)
            .padStart(6)}%\n`),
      );
    bot.telegram.sendMessage(CHAT_ID!, log);
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
}

const startDataFetching = async () => {
  await Promise.all([fetchHlp(), fetchMeta()]);

  setInterval(async () => {
    await Promise.all([fetchHlp(), fetchMeta()]);
  }, CONTRACTS_FETCH_INTERVAL);
};
startDataFetching();

bot.command('menu', async (ctx) => {
  return await ctx.reply(
    'Menu',
    Markup.keyboard([['/coins', '/account', '/openorders']])
      .oneTime()
      .resize(),
  );
});

bot.command('coins', async (ctx) => {
  const meta = await info.meta();

  return ctx.reply(
    'Coins',
    Markup.inlineKeyboard(
      meta.universe
        .sort((a, b) => {
          let aname = a.name;
          let bname = b.name;
          if (aname.startsWith('k')) {
            aname = aname.substring(1);
          }
          if (bname.startsWith('k')) {
            bname = bname.substring(1);
          }
          return aname.localeCompare(bname);
        })
        .map((coin) => {
          let label = coin.name;

          // Need to rethink how to display this nicely,
          // there are just too many coins to put one coin in its each row
          // if (contracts) {
          //   const c = contracts?.filter((c) => c.base_currency == coin.name)[0];
          //   const f24 = parseFloat(c.funding_rate) * 100 * 24;
          //   label += ` 24h funding (${f24.toFixed(2)}%)`;
          // }

          return Markup.button.callback(label, 'Coin' + coin.name);
        }),
      { columns: 4 },
    ),
  );
});

bot.action(/Coin.+/, (ctx) => {
  const coin = ctx.match[0].replace('Coin', '');
  return ctx.reply(
    `Actions on ${coin}`,
    Markup.inlineKeyboard(
      [
        Markup.button.callback('-30 to 0%', 'Long30.0' + coin),
        Markup.button.callback('-10 to 0%', 'Long10.0' + coin),
        Markup.button.callback('-5 to 0%', 'Long5.0' + coin),
        Markup.button.callback('-1 to 0%', 'Long1.0' + coin),
        Markup.button.callback('-0.1 to 0%', 'Long0.1' + coin),
        Markup.button.callback('0 to 0.1%', 'Short0.1' + coin),
        Markup.button.callback('0 to 1%', 'Short1.0' + coin),
        Markup.button.callback('0 to 5%', 'Short5.0' + coin),
        Markup.button.callback('0 to 10%', 'Short10.0' + coin),
        Markup.button.callback('0 to 30%', 'Short30.0' + coin),
      ],
      { columns: 1 },
    ),
  );
});

bot.action(/Long.+/, async (ctx) => {
  const rangeStr = ctx.match[0].match(/(\d+(\.\d+)?)/);
  let range = DEFAULT_LADDER_RANGE;
  let coin;
  if (rangeStr) {
    range = parseFloat(rangeStr[0]);
    coin = ctx.match[0].replace('Long', '').replace(rangeStr[0], '');
  } else {
    return;
  }

  let meta = await info.meta();
  let coinMeta = meta.universe.filter((u) => u.name == coin)[0];

  const allMids = await info.allMids();
  const currentMid = parseFloat(allMids[coin]);

  const parsedAmount = TOTAL_POSITION_SIZE / currentMid;

  const parsedLowerPrice = (currentMid * (100 - range)) / 100;
  const parsedUpperPrice = currentMid;

  const exchange = await Exchange.create(wallet, MAINNET_API_URL, vault);
  try {
    const r = await exchange.bulkOrders(
      lodash.range(1, NUM_LADDER_ORDERS + 1).map((i) => {
        return {
          coin,
          isBuy: true,
          sz: parseFloat(
            (parsedAmount / NUM_LADDER_ORDERS).toFixed(coinMeta.szDecimals),
          ),
          limitPx: five(
            parsedLowerPrice +
              (i * Math.abs(parsedUpperPrice - parsedLowerPrice)) /
                NUM_LADDER_ORDERS,
          ),
          orderType: { limit: { tif: 'Gtc' } },
          reduceOnly: false,
        };
      }),
    );
    console.log(r.response.data.statuses);
    ctx.reply(
      `LOG: Placed ${NUM_LADDER_ORDERS} LONG orders ${five(
        parsedLowerPrice,
      )}$ through ${five(parsedUpperPrice)}$ for ${coin}`,
    );
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
});

bot.action(/Short.+/, async (ctx) => {
  const rangeStr = ctx.match[0].match(/(\d+(\.\d+)?)/);
  let range = DEFAULT_LADDER_RANGE;
  let coin;
  if (rangeStr) {
    range = parseFloat(rangeStr[0]);
    coin = ctx.match[0].replace('Short', '').replace(rangeStr[0], '');
  } else {
    return;
  }

  let meta = await info.meta();
  let coinMeta = meta.universe.filter((u) => u.name == coin)[0];

  const allMids = await info.allMids();
  const currentMid = parseFloat(allMids[coin]);

  const parsedAmount = TOTAL_POSITION_SIZE / currentMid;

  const parsedLowerPrice = currentMid;
  const parsedUpperPrice = (currentMid * (100 + range)) / 100;

  const exchange = await Exchange.create(wallet, MAINNET_API_URL, vault);
  try {
    const r = await exchange.bulkOrders(
      lodash.range(1, NUM_LADDER_ORDERS + 1).map((i) => {
        return {
          coin,
          isBuy: false,
          sz: parseFloat(
            (parsedAmount / NUM_LADDER_ORDERS).toFixed(coinMeta.szDecimals),
          ),
          limitPx: five(
            parsedLowerPrice +
              (i * Math.abs(parsedUpperPrice - parsedLowerPrice)) /
                NUM_LADDER_ORDERS,
          ),
          orderType: { limit: { tif: 'Gtc' } },
          reduceOnly: false,
        };
      }),
    );
    console.log(r.response.data.statuses);
    ctx.reply(
      `LOG: Placed 25 SHORT orders ${five(parsedLowerPrice)}$ through ${five(
        parsedUpperPrice,
      )}$ for ${coin}`,
    );
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
});

bot.command('account', async (ctx) => {
  const state = await info.userState(
    vault != undefined ? vault : wallet.address,
  );
  const vaultDetails = await info.vaultDetails(
    vault != undefined ? vault : wallet.address,
    HLP_ADDRESS,
  );

  const positions = state.assetPositions
    .filter((p) => parseFloat(p.position.szi) != 0)
    .sort(
      (a, b) =>
        parseFloat(a.position.returnOnEquity) -
        parseFloat(b.position.returnOnEquity),
    );

  const details = `(equity: ${parseFloat(
    state.crossMarginSummary.accountValue,
  ).toFixed()}$, hlp equity: ${parseFloat(
    vaultDetails.followerState.vaultEquity,
  ).toFixed()}$)`;

  if (positions.length == 0) {
    return ctx.reply(`LOG: no positions open ${details}`);
  }

  return ctx.reply(
    `Positions ${details}`,
    Markup.inlineKeyboard(
      positions.map((p) =>
        Markup.button.callback(
          `${p.position.coin} ${(
            (parseFloat(p.position.returnOnEquity) /
              p.position.leverage.value) *
            100
          ).toFixed(2)}% (${
            parseFloat(p.position.szi) > 0 ? 'LONG' : 'SHORT'
          } ${parseFloat(p.position.positionValue).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}$)`,
          `Position${p.position.coin}`,
        ),
      ),
      { columns: 1 },
    ),
  );
});

bot.action(/Position.+/, (ctx) => {
  const coin = ctx.match[0].replace('Position', '');
  return ctx.reply(
    `Actions on ${coin}`,
    Markup.inlineKeyboard([
      Markup.button.callback('Close 25%', 'Close25.0' + coin),
      Markup.button.callback('Close 50%', 'Close50.0' + coin),
      Markup.button.callback('Close 75%', 'Close75.0' + coin),
      Markup.button.callback('Close 100%', 'Close100.0' + coin),
    ]),
  );
});

bot.action(/Close.+/, async (ctx) => {
  const rangeStr = ctx.match[0].match(/(\d+(\.\d+)?)/);
  let closePct = 100;
  let coin;
  if (rangeStr) {
    closePct = parseFloat(rangeStr[0]);
    coin = ctx.match[0].replace('Close', '').replace(rangeStr[0], '');
  } else {
    return;
  }

  const allMids = await info.allMids();
  const state = await info.userState(
    vault != undefined ? vault : wallet.address,
  );
  const p = state.assetPositions.filter((p) => p.position.coin === coin)[0];
  const currentPosition = parseFloat(p.position.szi);
  const closePosition = (currentPosition * closePct) / 100;

  const currentSide = currentPosition > 0 ? 'buy' : 'sell';
  const currentMid = parseFloat(allMids[coin]);
  if (!allMids[coin]) {
    throw new Error(`Unknown coin ${coin}!`);
  }

  let meta = await info.meta();
  let coinMeta = meta.universe.filter((u) => u.name == coin)[0];

  const exchange = await Exchange.create(wallet, MAINNET_API_URL, vault);
  try {
    const r = await exchange.bulkOrders([
      {
        coin: coin,
        isBuy: currentSide == 'sell',
        sz: Math.abs(parseFloat(closePosition.toFixed(coinMeta.szDecimals))),
        limitPx: five(currentMid),
        orderType: { limit: { tif: 'Gtc' } },
        reduceOnly: true,
      },
    ]);
    ctx.reply(
      `LOG: Placed a close order at ${five(
        currentMid,
      )}$ for ${closePosition.toFixed(coinMeta.szDecimals)} ${coin}`,
    );
    console.log(r.response.data.statuses);
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
});

bot.command('openorders', async (ctx) => {
  let oos = await info.openOrders(vault != undefined ? vault : wallet.address);
  const mappedResults = oos.map((oo) => [
    oo.coin,
    oo.side == 'A' ? 'sell' : 'buy',
    oo.reduceOnly,
  ]);
  const sortedResults = lodash.sortBy(mappedResults, (item) => [
    item[0],
    item[1],
    item[2],
  ]);
  const uniqueResults = lodash.uniqWith(sortedResults, lodash.isEqual);

  if (uniqueResults.length == 0) {
    return ctx.reply(`LOG: no open orders to cancel`);
  }

  return ctx.reply(
    'Cancel Open Orders',
    Markup.inlineKeyboard(
      uniqueResults.map((r) =>
        Markup.button.callback(
          r[0] + ' ' + r[1] + ' ' + (r[2] ? '(Reduce Only)' : '') + '(s)',
          'Cancel' + r[0] + r[1] + (r[2] ? 'RO' : ''),
        ),
      ),
    ),
  );
});

bot.action(/Cancel.+/, async (ctx) => {
  const coin = ctx.match[0]
    .replace('Cancel', '')
    .replace('buy', '')
    .replace('sell', '')
    .replace('RO', '');
  const sideToCancel = ctx.match[0]
    .replace('Cancel', '')
    .replace(coin, '')
    .replace('RO', '');
  const ro =
    ctx.match[0]
      .replace('Cancel', '')
      .replace(coin, '')
      .replace(sideToCancel, '') != '';

  let oos = await info.openOrders(vault != undefined ? vault : wallet.address);

  const exchange = await Exchange.create(wallet, MAINNET_API_URL, vault);
  oos = oos.filter((oo) => oo.coin == coin);
  oos = oos.filter((oo) => oo.side === (sideToCancel === 'buy' ? 'B' : 'A'));
  oos = oos.filter((oo) =>
    ro
      ? oo.reduceOnly == ro
      : oo.reduceOnly == undefined || oo.reduceOnly == false,
  );

  const cancelRequests = oos.map((oo) => {
    return { coin: oo.coin, oid: oo.oid };
  });
  try {
    if (oos.length) {
      const r = await exchange.bulkCancel(cancelRequests);
      console.log(r);
    }
    ctx.reply(`LOG: Cancelled ${oos.length} ${sideToCancel} orders on ${coin}`);
  } catch (error) {
    console.log(error);
    bot.telegram.sendMessage(CHAT_ID!, error);
  }
});

// Useful for debugging what actions are unmatched
// bot.action(/.+/, (ctx) => {
//   return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`);
// });

bot.launch();

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  process.exit();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit();
});
