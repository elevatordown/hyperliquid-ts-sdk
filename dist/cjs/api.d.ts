import { CandlesSnapshot, Fills, FundingHistory, L2Snapshot, OpenOrders, Subscription, Universe, UserState } from './types';
import { WebsocketManager } from './websocketmanager';
export declare class API {
    baseUrl: string;
    constructor(baseUrl: string);
    post<T>(urlPath: string, payload?: {}): Promise<T>;
}
export declare class Info extends API {
    wsManager: WebsocketManager;
    constructor(baseUrl: string, skipWs?: boolean);
    userState(address: string): Promise<UserState>;
    openOrders(address: string): Promise<OpenOrders>;
    allMids(): Promise<Record<string, string>>;
    userFills(address: string): Promise<Fills>;
    meta(): Promise<Universe>;
    fundingHistory(coin: string, startTime: number, endTime?: number): Promise<FundingHistory>;
    l2Snapshot(coin: string): Promise<L2Snapshot>;
    candlesSnapshot(coin: string, interval: string, startTime: number, endTime: number): Promise<CandlesSnapshot>;
    subscribe(subscription: Subscription, callback: (e: any) => void): void;
    unsubscribe(subscription: Subscription, subscription_id: number): boolean;
}
