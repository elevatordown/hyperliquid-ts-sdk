import { Wallet } from 'ethers';
import { API, Info } from './api';
import {
  OrderWire,
  ZERO_ADDRESS,
  getTimestampMs,
  orderGroupToNumber,
  orderSpecPreprocessing,
  orderSpecToOrderWire,
  signL1Action,
} from './signing';
import {
  ApiResponse,
  CancelRequest,
  OrderRequest,
  OrderSpec,
  OrderType,
  Universe,
} from './types';

export class Exchange extends API {
  private wallet: Wallet;
  private vaultAddress: string | undefined;
  private meta: Universe;
  private coinToAsset: Record<string, number>;

  static async create(
    wallet: Wallet,
    baseUrl: string,
    vaultAddress: string | undefined = undefined,
  ): Promise<Exchange> {
    const info = new Info(baseUrl, true);
    const meta = await info.meta();
    return new Exchange(wallet, baseUrl, meta, vaultAddress);
  }

  constructor(
    wallet: Wallet,
    baseUrl: string,
    meta: Universe,
    vaultAddress: string | undefined = undefined,
  ) {
    super(baseUrl);
    this.wallet = wallet;
    this.vaultAddress = vaultAddress;

    this.meta = meta;
    this.coinToAsset = {};
    for (const { name } of this.meta.universe) {
      this.coinToAsset[name] = this.meta.universe.findIndex(
        (assetInfo) => assetInfo.name === name,
      );
    }
  }

  private async _postAction(
    action:
      | {
          type: 'cancel';
          cancels: { asset: number; oid: number }[];
        }
      | {
          type: 'order';
          grouping;
          orders: OrderWire[];
        },
    signature: { r: string; s: string; v: number },
    nonce: number,
  ): Promise<ApiResponse> {
    const payload = {
      action,
      nonce,
      signature,
      vaultAddress: this.vaultAddress,
    };
    return await this.post('/exchange', payload);
  }

  async order(
    coin: string,
    isBuy: boolean,
    sz: number,
    limitPx: number,
    orderType: OrderType,
    reduceOnly = false,
  ): Promise<ApiResponse> {
    return await this.bulkOrders([
      {
        coin,
        isBuy,
        sz,
        limitPx,
        orderType,
        reduceOnly,
      },
    ]);
  }

  async bulkOrders(orderRequests: OrderRequest[]): Promise<ApiResponse> {
    const orderSpecs: OrderSpec[] = orderRequests.map((order) => ({
      order: {
        asset: this.coinToAsset[order.coin],
        isBuy: order.isBuy,
        reduceOnly: order.reduceOnly,
        limitPx: order.limitPx,
        sz: order.sz,
      },
      orderType: order.orderType,
    }));

    const timestamp = getTimestampMs();
    const grouping = 'na';

    const signature = await signL1Action(
      this.wallet,
      ['(uint32,bool,uint64,uint64,bool,uint8,uint64)[]', 'uint8'],
      [
        orderSpecs.map((os) => orderSpecPreprocessing(os)),
        orderGroupToNumber(grouping),
      ],
      this.vaultAddress === undefined ? ZERO_ADDRESS : this.vaultAddress,
      timestamp,
    );

    return await this._postAction(
      {
        type: 'order',
        grouping,
        orders: orderSpecs.map(orderSpecToOrderWire),
      },
      signature,
      timestamp,
    );
  }

  async cancel(coin: string, oid: number): Promise<any> {
    return this.bulkCancel([{ coin, oid }]);
  }

  async bulkCancel(cancelRequests: CancelRequest[]): Promise<ApiResponse> {
    const timestamp = getTimestampMs();
    const signature = await signL1Action(
      this.wallet,
      ['(uint32,uint64)[]'],
      [
        cancelRequests.map((cancel) => [
          this.coinToAsset[cancel.coin],
          cancel.oid,
        ]),
      ],
      this.vaultAddress === undefined ? ZERO_ADDRESS : this.vaultAddress,
      timestamp,
    );

    return this._postAction(
      {
        type: 'cancel',
        cancels: cancelRequests.map((cancel) => ({
          asset: this.coinToAsset[cancel.coin],
          oid: cancel.oid,
        })),
      },
      signature,
      timestamp,
    );
  }
}
