import axios from 'axios';
import http from 'http';
import https from 'https';
import {
  CandlesSnapshot,
  Fills,
  FundingHistory,
  L2Snapshot,
  OpenOrders,
  Subscription,
  Universe,
  UserState,
  VaultDetails,
} from './types';
import { WebsocketManager } from './websocketmanager';

export class API {
  httpAgent: http.Agent;
  httpsAgent: https.Agent;
  constructor(public baseUrl: string) {
    this.httpAgent = new http.Agent({ keepAlive: true });
    this.httpsAgent = new https.Agent({ keepAlive: true });
  }

  public async post<T>(urlPath: string, payload = {}): Promise<T> {
    try {
      const response = await axios.post(this.baseUrl + urlPath, payload, {
        httpAgent: this.httpAgent,
        httpsAgent: this.httpsAgent,
      });
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

  public async userState(user: string): Promise<UserState> {
    return await this.post<UserState>('/info', {
      type: 'clearinghouseState',
      user,
    });
  }

  public async vaultDetails(
    user: string,
    vaultAddress: string,
  ): Promise<VaultDetails> {
    return await this.post<VaultDetails>('/info', {
      type: 'vaultDetails',
      user,
      vaultAddress,
    });
  }

  public async openOrders(user: string): Promise<OpenOrders> {
    return await this.post<OpenOrders>('/info', {
      type: 'openOrders',
      user,
    });
  }

  public async allMids(): Promise<Record<string, string>> {
    return await this.post<Record<string, string>>('/info', {
      type: 'allMids',
    });
  }

  public async userFills(user: string): Promise<Fills> {
    return await this.post<Fills>('/info', {
      type: 'userFills',
      user,
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
