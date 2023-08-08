import { Wallet } from 'ethers';
import { API } from './api';
import { ApiResponse, CancelRequest, OrderRequest, OrderType, Universe } from './types';
export declare class Exchange extends API {
    private wallet;
    private vaultAddress;
    private meta;
    private coinToAsset;
    static create(wallet: Wallet, baseUrl: string, vaultAddress?: string | undefined): Promise<Exchange>;
    constructor(wallet: Wallet, baseUrl: string, meta: Universe, vaultAddress?: string | undefined);
    private _postAction;
    order(coin: string, isBuy: boolean, sz: number, limitPx: number, orderType: OrderType, reduceOnly?: boolean): Promise<ApiResponse>;
    bulkOrders(orderRequests: OrderRequest[]): Promise<ApiResponse>;
    cancel(coin: string, oid: number): Promise<any>;
    bulkCancel(cancelRequests: CancelRequest[]): Promise<ApiResponse>;
    usdTransfer(amount: string, destination?: string): Promise<any>;
}
