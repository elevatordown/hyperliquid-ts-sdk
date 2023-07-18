import { ethers } from 'ethers';
import { Exchange, Info, MAINNET_API_URL } from '../src';

const secretKey: string = process.env.SECRET_KEY || '';

async function dohttp(info, wallet) {
  const address = wallet.address;

  console.log(await info.userState(address));
  console.log(await info.openOrders(address));
  console.log(await info.allMids());
  console.log(await info.userFills(address));
  console.log(await info.meta());
  console.log(
    await info.fundingHistory(
      'BTC',
      new Date().getTime() - 24 * 60 * 60 * 1000,
    ),
  );
  console.log((await info.l2Snapshot('BTC'))['levels'][0][0]);
  console.log(
    await info.candlesSnapshot(
      'BTC',
      '1d',
      new Date().getTime() - 24 * 60 * 60 * 1000,
      new Date().getTime(),
    ),
  );
}

async function dows(info, wallet) {
  const address = wallet.address;

  info.subscribe({ type: 'userEvents', user: address }, (event) => {
    console.log(event);
  });
  info.subscribe({ type: 'l2Book', coin: 'BTC' }, (event) => {
    console.log(event);
  });
  info.subscribe({ type: 'l2Book', coin: 'ETH' }, (event) => {
    console.log(event);
  });
  let i = 0;
  while (i < 1000) {
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    i++;
  }
}
async function doexchange(info, exchange, wallet) {
  const address = wallet.address;

  const oos = await info.openOrders(address);
  const cancelRequests = oos.map((oo) => {
    return { coin: oo.coin, oid: oo.oid };
  });
  console.log(await exchange.bulkCancel(cancelRequests));

  console.log(
    await exchange.bulkOrders([
      {
        coin: 'XRP',
        isBuy: true,
        sz: 1,
        limitPx: 1,
        orderType: { limit: { tif: 'Alo' } },
        reduceOnly: true,
      },
    ]),
  );
}

async function main(): Promise<void> {
  const info = new Info(MAINNET_API_URL);
  const wallet = new ethers.Wallet(secretKey);
  const exchange = await Exchange.create(wallet, MAINNET_API_URL);

  try {
    // await dohttp(info, wallet);
    // await dows(info, wallet);
    await doexchange(info, exchange, wallet);
  } catch (error) {
    console.log(error);
  }
}

main();
