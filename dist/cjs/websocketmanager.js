"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketManager = void 0;
class WebsocketManager {
    subscription_id_counter;
    wsReady;
    queuedSubscriptions;
    activeSubscriptions;
    socket;
    debug;
    constructor(base_url, debug = false) {
        this.subscription_id_counter = 0;
        this.wsReady = false;
        this.queuedSubscriptions = [];
        this.activeSubscriptions = {};
        const wsUrl = `ws${base_url.slice('http'.length)}/ws`;
        this.socket = new WebSocket(wsUrl);
        this.debug = debug;
        this.socket.onopen = () => {
            if (this.debug) {
                console.log('on_open');
            }
            this.wsReady = true;
            for (const [subscription, active_subscription] of this
                .queuedSubscriptions) {
                this.subscribe(subscription, active_subscription.callback, active_subscription.subscriptionId);
            }
        };
        this.socket.onmessage = (event) => {
            const message = event.data;
            if (message === 'Websocket connection established.') {
                if (this.debug) {
                    console.log(message);
                }
                return;
            }
            const wsMsg = JSON.parse(message);
            const identifier = this.wsMsgToIdentifier(wsMsg);
            if (identifier === null) {
                if (this.debug) {
                    console.log('Websocket not handling empty message');
                }
                return;
            }
            const active_subscriptions = this.activeSubscriptions[identifier];
            if (!active_subscriptions || active_subscriptions.length === 0) {
                if (this.debug) {
                    console.log('Websocket message from an unexpected subscription:', message, identifier);
                }
            }
            else {
                for (const active_subscription of active_subscriptions) {
                    active_subscription.callback(wsMsg);
                }
            }
        };
    }
    subscribe(subscription, callback, subscription_id) {
        const subscriptionId = subscription_id || ++this.subscription_id_counter;
        if (!this.wsReady) {
            if (this.debug) {
                console.log('enqueueing subscription');
            }
            this.queuedSubscriptions.push([
                subscription,
                { callback, subscriptionId: subscriptionId },
            ]);
        }
        else {
            if (this.debug) {
                console.log('subscribing');
            }
            const identifier = this.subscriptionToIdentifier(subscription);
            if (subscription.type === 'userEvents') {
                if (this.activeSubscriptions[identifier] &&
                    this.activeSubscriptions[identifier].length !== 0) {
                    throw new Error('Cannot subscribe to UserEvents multiple times');
                }
            }
            this.activeSubscriptions[identifier] =
                this.activeSubscriptions[identifier] || [];
            this.activeSubscriptions[identifier].push({
                callback,
                subscriptionId: subscriptionId,
            });
            this.socket.send(JSON.stringify({ method: 'subscribe', subscription }));
        }
        return subscriptionId;
    }
    unsubscribe(subscription, subscription_id) {
        if (!this.wsReady) {
            throw new Error("Can't unsubscribe before websocket connected");
        }
        const identifier = this.subscriptionToIdentifier(subscription);
        const active_subscriptions = this.activeSubscriptions[identifier] || [];
        const new_active_subscriptions = active_subscriptions.filter((x) => x.subscriptionId !== subscription_id);
        if (new_active_subscriptions.length === 0) {
            this.socket.send(JSON.stringify({ method: 'unsubscribe', subscription }));
        }
        this.activeSubscriptions[identifier] = new_active_subscriptions;
        return new_active_subscriptions.length !== active_subscriptions.length;
    }
    subscriptionToIdentifier(subscription) {
        return subscription.type;
    }
    wsMsgToIdentifier(wsMsg) {
        if (wsMsg.channel === 'allMids') {
            return 'allMids';
        }
        else if (wsMsg.channel === 'l2Book') {
            return `l2Book:${wsMsg.data.coin.toLowerCase()}`;
        }
        else if (wsMsg.channel === 'trades') {
            const trades = wsMsg.data;
            if (trades.length === 0) {
                return null;
            }
            else {
                return `trades:${trades[0].coin.toLowerCase()}`;
            }
        }
        else if (wsMsg.channel === 'user') {
            return 'userEvents';
        }
        else if (wsMsg['channel'] === 'subscriptionResponse') {
            return 'subscriptionResponse';
        }
        throw new Error('Unknown channel type');
    }
}
exports.WebsocketManager = WebsocketManager;
