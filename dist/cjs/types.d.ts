export type Side = 'A' | 'B';
type Position = {
    coin: 'BTC';
    entryPx: string;
    leverage: {
        type: 'cross';
        value: number;
    };
    liquidationPx: null;
    marginUsed: string;
    maxLeverage: number;
    maxTradeSzs: [string, string];
    positionValue: string;
    returnOnEquity: string;
    szi: string;
    unrealizedPnl: string;
};
export type AssetPosition = {
    position: Position;
    type: 'oneWay';
};
export type CrossMarginSummary = {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
    withdrawable: string;
};
export type MarginSummary = CrossMarginSummary;
export type UserState = {
    assetPositions: AssetPosition[];
    crossMarginSummary: CrossMarginSummary;
    marginSummary: MarginSummary;
};
export type OpenOrder = {
    coin: string;
    limitPx: string;
    oid: number;
    side: 'A';
    sz: string;
    timestamp: number;
};
export type OpenOrders = OpenOrder[];
type Fill = {
    closedPnl: string;
    coin: string;
    crossed: boolean;
    dir: 'Open Short';
    fee: string;
    hash: string;
    oid: number;
    px: string;
    side: 'A';
    startPosition: string;
    sz: string;
    time: number;
};
export type Fills = Fill[];
export type UniverseItem = {
    maxLeverage: number;
    name: string;
    szDecimals: number;
};
export type Universe = {
    universe: UniverseItem[];
};
export type Funding = {
    coin: 'BTC';
    fundingRate: string;
    premium: string;
    time: number;
};
export type FundingHistory = Funding[];
export type Level = {
    n: number;
    px: string;
    sz: string;
};
export type L2Snapshot = {
    coin: 'BTC';
    levels: Level[][];
    time: number;
};
export type CandleSnapshot = {
    T: number;
    c: string;
    h: string;
    i: '1d';
    l: string;
    n: number;
    o: string;
    s: 'BTC';
    t: number;
    v: string;
};
export type CandlesSnapshot = CandleSnapshot[];
export type AllMidsSubscription = {
    type: 'allMids';
};
export type L2BookSubscription = {
    type: 'l2Book';
    coin: string;
};
export type TradesSubscription = {
    type: 'trades';
    coin: string;
};
export type UserEventsSubscription = {
    type: 'userEvents';
    user: string;
};
export type Subscription = AllMidsSubscription | L2BookSubscription | TradesSubscription | UserEventsSubscription;
type Channel = {
    channel: string;
};
export type AllMidsData = {
    mids: Record<string, string>;
};
export type AllMidsMsg = {
    channel: 'allMids';
    data: AllMidsData;
} & Channel;
type L2BookMsg = {
    channel: 'l2Book';
    data: L2Snapshot;
} & Channel;
export type Trade = {
    coin: string;
    side: Side;
    px: string;
    sz: number;
    hash: string;
    time: number;
};
export type TradesMsg = {
    channel: 'trades';
    data: Trade[];
} & Channel;
export type UserEventsData = {
    fills: Fill[];
} & Channel;
export type UserEventsMsg = {
    channel: 'user';
    data: UserEventsData;
} & Channel;
export type WsMsg = AllMidsMsg | L2BookMsg | TradesMsg | UserEventsMsg;
export type Tif = 'Alo' | 'Ioc' | 'Gtc';
export type Tpsl = 'tp' | 'sl';
export interface LimitOrderType {
    tif: Tif;
}
export interface TriggerOrderType {
    triggerPx: number;
    isMarket: boolean;
    tpsl: Tpsl;
}
export interface TriggerOrderTypeWire {
    triggerPx: string;
    isMarket: boolean;
    tpsl: Tpsl;
}
export interface OrderType {
    limit?: LimitOrderType;
    trigger?: TriggerOrderType;
}
export interface OrderTypeWire {
    limit?: LimitOrderType;
    trigger?: TriggerOrderTypeWire;
}
export interface OrderRequest {
    coin: string;
    isBuy: boolean;
    sz: number;
    limitPx: number;
    orderType: OrderType;
    reduceOnly: boolean;
}
export interface CancelRequest {
    coin: string;
    oid: number;
}
export interface Order {
    asset: number;
    isBuy: boolean;
    limitPx: number;
    sz: number;
    reduceOnly: boolean;
}
export interface OrderSpec {
    order: Order;
    orderType: OrderType;
}
type ResponseStatus = 'success' | {
    error: string;
};
export interface ApiResponse {
    status: 'ok';
    response: {
        type: 'cancel';
        data: {
            statuses: ResponseStatus[];
        };
    };
}
export {};
