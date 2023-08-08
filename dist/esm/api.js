import axios from 'axios';
import { WebsocketManager } from './websocketmanager';
export class API {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async post(urlPath, payload = {}) {
        try {
            const response = await axios.post(this.baseUrl + urlPath, payload);
            return response.data;
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
}
export class Info extends API {
    wsManager;
    constructor(baseUrl, skipWs = false) {
        super(baseUrl);
        if (!skipWs) {
            this.wsManager = new WebsocketManager(this.baseUrl);
        }
    }
    async userState(address) {
        return await this.post('/info', {
            type: 'clearinghouseState',
            user: address,
        });
    }
    async openOrders(address) {
        return await this.post('/info', {
            type: 'openOrders',
            user: address,
        });
    }
    async allMids() {
        return await this.post('/info', {
            type: 'allMids',
        });
    }
    async userFills(address) {
        return await this.post('/info', {
            type: 'userFills',
            user: address,
        });
    }
    async meta() {
        return await this.post('/info', { type: 'meta' });
    }
    async fundingHistory(coin, startTime, endTime) {
        const request = endTime
            ? { type: 'fundingHistory', coin, startTime, endTime }
            : { type: 'fundingHistory', coin, startTime };
        return await this.post('/info', request);
    }
    async l2Snapshot(coin) {
        return await this.post('/info', { type: 'l2Book', coin });
    }
    async candlesSnapshot(coin, interval, startTime, endTime) {
        const request = { coin, interval, startTime, endTime };
        return await this.post('/info', {
            type: 'candleSnapshot',
            req: request,
        });
    }
    subscribe(subscription, callback) {
        this.wsManager.subscribe(subscription, callback);
    }
    unsubscribe(subscription, subscription_id) {
        if (!this.wsManager) {
            throw new Error('Cannot call unsubscribe since skipWs was used');
        }
        else {
            return this.wsManager.unsubscribe(subscription, subscription_id);
        }
    }
}
