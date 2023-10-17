export type Side = 'A' | 'B';

type Position = {
  coin: 'BTC';
  entryPx: string;
  leverage: { type: 'cross'; value: number };
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
  origSz: string;
  reduceOnly: boolean;
  side: 'A' | 'B';
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
  side: 'A' | 'B';
  startPosition: string;
  sz: string;
  time: number;
};

export type Fills = Fill[];

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

export type WebData = {
  type: 'userEvents';
  user: string;
};

export type Subscription =
  | AllMidsSubscription
  | L2BookSubscription
  | TradesSubscription
  | UserEventsSubscription
  | WebData;

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

type ResponseStatus = 'success' | { error: string };

export interface ApiResponse {
  status: 'ok';
  response: {
    type: 'cancel';
    data: {
      statuses: ResponseStatus[];
    };
  };
}

export interface FollowerState {
  allTimePnl: string;
  daysFollowing: number;
  lockupUntil: number;
  pnl: string;
  user: string;
  vaultEntryTime: number;
  vaultEquity: string;
}

export interface VaultDetails {
  ageInDays: number;
  allowDeposits: boolean;
  apr: number;
  description: string;
  followerState: FollowerState;
}

export interface Contract {
  ticker_id: string;
  base_currency: string;
  quote_currency: string;
  last_price: string;
  base_volume: string;
  quote_volume: string;
  product_type: string;
  open_interest: string;
  index_price: string;
  index_name: string;
  index_currency: string;
  funding_rate: string;
  next_funding_rate: string;
  next_funding_rate_timestamp: string;
  contract_type: string;
  contract_price_currency: string;
}

export interface UniverseItem {
  maxLeverage: number;
  name: string;
  onlyIsolated: boolean;
  szDecimals: number;
}

export type Universe = {
  universe: UniverseItem[];
};

export interface MarketDataItem {
  dayNtlVlm: string;
  funding: string;
  impactPxs: string[];
  markPx: string;
  midPx: string;
  openInterest: string;
  oraclePx: string;
  premium: string;
  prevDayPx: string;
}

export type MarketData = MarketDataItem[];
