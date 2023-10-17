/// <reference types="node" />
/// <reference types="node" />
import http from 'http';
import https from 'https';
import { CandlesSnapshot, Fills, FundingHistory, L2Snapshot, MarketData, OpenOrders, Subscription, Universe, UserState, VaultDetails } from './types';
import { WebsocketManager } from './websocketmanager';
export declare class API {
    baseUrl: string;
    httpAgent: http.Agent;
    httpsAgent: https.Agent;
    constructor(baseUrl: string);
    post<T>(urlPath: string, payload?: {}): Promise<T>;
}
export declare class Info extends API {
    wsManager: WebsocketManager;
    constructor(baseUrl: string, skipWs?: boolean);
    userState(user: string): Promise<UserState>;
    vaultDetails(user: string | undefined, vaultAddress: string): Promise<VaultDetails>;
    metaAndAssetCtxs(): Promise<[Universe, MarketData]>;
    openOrders(user: string): Promise<OpenOrders>;
    allMids(): Promise<Record<string, string>>;
    userFills(user: string): Promise<Fills>;
    meta(): Promise<Universe>;
    fundingHistory(coin: string, startTime: number, endTime?: number): Promise<FundingHistory>;
    l2Snapshot(coin: string): Promise<L2Snapshot>;
    candlesSnapshot(coin: string, interval: string, startTime: number, endTime: number): Promise<CandlesSnapshot>;
    subscribe(subscription: Subscription, callback: (e: any) => void): void;
    unsubscribe(subscription: Subscription, subscription_id: number): boolean;
}
