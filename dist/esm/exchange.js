import { API, Info } from './api';
import { ZERO_ADDRESS, getTimestampMs, orderGroupToNumber, orderSpecPreprocessing, orderSpecToOrderWire, signL1Action, signUsdTransferAction, } from './signing';
export class Exchange extends API {
    wallet;
    vaultAddress;
    meta;
    coinToAsset;
    static async create(wallet, baseUrl, vaultAddress = undefined) {
        const info = new Info(baseUrl, true);
        const meta = await info.meta();
        return new Exchange(wallet, baseUrl, meta, vaultAddress);
    }
    constructor(wallet, baseUrl, meta, vaultAddress = undefined) {
        super(baseUrl);
        this.wallet = wallet;
        this.vaultAddress = vaultAddress;
        this.meta = meta;
        this.coinToAsset = {};
        for (const { name } of this.meta.universe) {
            this.coinToAsset[name] = this.meta.universe.findIndex((assetInfo) => assetInfo.name === name);
        }
    }
    async _postAction(action, signature, nonce) {
        const payload = {
            action,
            nonce,
            signature,
            vaultAddress: this.vaultAddress,
        };
        return await this.post('/exchange', payload);
    }
    async order(coin, isBuy, sz, limitPx, orderType, reduceOnly = false) {
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
    async bulkOrders(orderRequests) {
        const orderSpecs = orderRequests.map((order) => ({
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
        const signature = await signL1Action(this.wallet, ['(uint32,bool,uint64,uint64,bool,uint8,uint64)[]', 'uint8'], [
            orderSpecs.map((os) => orderSpecPreprocessing(os)),
            orderGroupToNumber(grouping),
        ], this.vaultAddress === undefined ? ZERO_ADDRESS : this.vaultAddress, timestamp);
        return await this._postAction({
            type: 'order',
            grouping,
            orders: orderSpecs.map(orderSpecToOrderWire),
        }, signature, timestamp);
    }
    async cancel(coin, oid) {
        return this.bulkCancel([{ coin, oid }]);
    }
    async bulkCancel(cancelRequests) {
        const timestamp = getTimestampMs();
        const signature = await signL1Action(this.wallet, ['(uint32,uint64)[]'], [
            cancelRequests.map((cancel) => [
                this.coinToAsset[cancel.coin],
                cancel.oid,
            ]),
        ], this.vaultAddress === undefined ? ZERO_ADDRESS : this.vaultAddress, timestamp);
        return this._postAction({
            type: 'cancel',
            cancels: cancelRequests.map((cancel) => ({
                asset: this.coinToAsset[cancel.coin],
                oid: cancel.oid,
            })),
        }, signature, timestamp);
    }
    async usdTransfer(amount, destination = this.wallet.address) {
        const timestamp = getTimestampMs();
        const payload = {
            destination,
            amount,
            time: timestamp,
        };
        const signature = await signUsdTransferAction(this.wallet, payload);
        return this._postAction({
            type: 'usdTransfer',
            chain: 'Arbitrum',
            payload,
        }, signature, timestamp);
    }
}
