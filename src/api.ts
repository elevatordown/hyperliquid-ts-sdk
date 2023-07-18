import axios from 'axios';
import {
  CandlesSnapshot,
  Fills,
  FundingHistory,
  L2Snapshot,
  OpenOrders,
  Subscription,
  Universe,
  UserState,
} from './types';
import { WebsocketManager } from './websocketmanager';

export class API {
  constructor(public baseUrl: string) {}

  public async post<T>(urlPath: string, payload = {}): Promise<T> {
    try {
      const response = await axios.post(this.baseUrl + urlPath, payload);
      return <T>response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export class Info extends API {
  wsManager: WebsocketManager;

  constructor(baseUrl: string, skipWs = false) {
    super(baseUrl);
    if (!skipWs) {
      this.wsManager = new WebsocketManager(this.baseUrl);
    }
  }

  public async userState(address: string): Promise<UserState> {
    return await this.post<UserState>('/info', {
      type: 'clearinghouseState',
      user: address,
    });
  }

  public async openOrders(address: string): Promise<OpenOrders> {
    return await this.post<OpenOrders>('/info', {
      type: 'openOrders',
      user: address,
    });
  }

  public async allMids(): Promise<Record<string, string>> {
    return await this.post<Record<string, string>>('/info', {
      type: 'allMids',
    });
  }

  public async userFills(address: string): Promise<Fills> {
    return await this.post<Fills>('/info', {
      type: 'userFills',
      user: address,
    });
  }

  public async meta(): Promise<Universe> {
    return await this.post<Universe>('/info', { type: 'meta' });
  }

  public async fundingHistory(
    coin: string,
    startTime: number,
    endTime?: number,
  ): Promise<FundingHistory> {
    const request = endTime
      ? { type: 'fundingHistory', coin, startTime, endTime }
      : { type: 'fundingHistory', coin, startTime };
    return await this.post<FundingHistory>('/info', request);
  }

  public async l2Snapshot(coin: string): Promise<L2Snapshot> {
    return await this.post<L2Snapshot>('/info', { type: 'l2Book', coin });
  }

  public async candlesSnapshot(
    coin: string,
    interval: string,
    startTime: number,
    endTime: number,
  ): Promise<CandlesSnapshot> {
    const request = { coin, interval, startTime, endTime };
    return await this.post<CandlesSnapshot>('/info', {
      type: 'candleSnapshot',
      req: request,
    });
  }

  public subscribe(subscription: Subscription, callback: (e) => void): void {
    this.wsManager.subscribe(subscription, callback);
  }

  public unsubscribe(
    subscription: Subscription,
    subscription_id: number,
  ): boolean {
    if (!this.wsManager) {
      throw new Error('Cannot call unsubscribe since skipWs was used');
    } else {
      return this.wsManager.unsubscribe(subscription, subscription_id);
    }
  }
}
