import { AbiCoder, keccak256 } from 'ethers';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export function orderTypeToTuple(orderType) {
    if (orderType.limit) {
        const tif = orderType.limit?.tif;
        if (tif === 'Gtc') {
            return [2, 0];
        }
        else if (tif === 'Alo') {
            return [1, 0];
        }
        else if (tif === 'Ioc') {
            return [3, 0];
        }
        else if (tif === 'FrontendMarket') {
            return [8, 0];
        }
    }
    else if (orderType.trigger) {
        const trigger = orderType.trigger;
        const triggerPx = trigger?.triggerPx;
        if (trigger?.isMarket && trigger.tpsl === 'tp') {
            return [4, triggerPx];
        }
        else if (!trigger?.isMarket && trigger.tpsl === 'tp') {
            return [5, triggerPx];
        }
        else if (trigger.isMarket && trigger.tpsl === 'sl') {
            return [6, triggerPx];
        }
        else if (!trigger.isMarket && trigger.tpsl === 'sl') {
            return [7, triggerPx];
        }
    }
    throw new Error('Invalid order type');
}
export function orderGroupToNumber(grouping) {
    if (grouping === 'na') {
        return 0;
    }
    else if (grouping === 'normalTpsl') {
        return 1;
    }
    else if (grouping === 'positionTpsl') {
        return 2;
    }
    throw new Error('Invalid order grouping');
}
export function orderSpecPreprocessing(order_spec) {
    const order = order_spec['order'];
    const order_type_array = orderTypeToTuple(order_spec['orderType']);
    return [
        order.asset,
        order.isBuy,
        floatToIntForHashing(order.limitPx),
        floatToIntForHashing(order.sz),
        order.reduceOnly,
        order_type_array[0],
        floatToIntForHashing(order_type_array[1]),
    ];
}
export function orderTypeToWire(orderType) {
    if (orderType.limit) {
        return { limit: orderType.limit };
    }
    else if (orderType.trigger) {
        return {
            trigger: {
                triggerPx: floatToWire(orderType.trigger?.triggerPx),
                tpsl: orderType.trigger?.tpsl,
                isMarket: orderType.trigger?.isMarket,
            },
        };
    }
    throw new Error('Invalid order type');
}
export function orderSpecToOrderWire(order_spec) {
    const order = order_spec.order;
    return {
        asset: order.asset,
        isBuy: order.isBuy,
        limitPx: floatToWire(order.limitPx),
        sz: floatToWire(order.sz),
        reduceOnly: order.reduceOnly,
        orderType: orderTypeToWire(order_spec.orderType),
    };
}
export function constructPhantomAgent(signatureTypes, signatureData) {
    const coder = new AbiCoder();
    const connectionId = coder.encode(signatureTypes, signatureData);
    return {
        source: 'a',
        connectionId: keccak256(connectionId),
    };
}
export async function signL1Action(wallet, signatureTypes, signatureData, activePool, nonce) {
    signatureTypes.push('address');
    signatureTypes.push('uint64');
    if (activePool === null) {
        signatureData.push(ZERO_ADDRESS);
    }
    else {
        signatureData.push(activePool);
    }
    signatureData.push(nonce);
    const phantomAgent = constructPhantomAgent(signatureTypes, signatureData);
    return Tl(await wallet.signTypedData({
        chainId: 1337,
        name: 'Exchange',
        verifyingContract: '0x0000000000000000000000000000000000000000',
        version: '1',
    }, {
        Agent: [
            { name: 'source', type: 'string' },
            { name: 'connectionId', type: 'bytes32' },
        ],
    }, phantomAgent));
}
export async function signUsdTransferAction(wallet, message) {
    return Tl(await wallet.signTypedData({
        chainId: 42161,
        name: 'Exchange',
        verifyingContract: '0x0000000000000000000000000000000000000000',
        version: '1',
    }, {
        UsdTransferSignPayload: [
            { name: 'destination', type: 'string' },
            { name: 'amount', type: 'string' },
            { name: 'time', type: 'uint64' },
        ],
    }, message));
}
export function Tl(e) {
    if (130 !== (e = e.slice(2)).length)
        throw new Error('bad sig length: ' + e.length);
    const t = e.slice(-2);
    if ('1c' !== t && '1b' !== t && '00' !== t && '01' !== t)
        throw new Error('bad sig v '.concat(t));
    const n = '1b' === t || '00' === t ? 27 : 28;
    return {
        r: '0x' + e.slice(0, 64),
        s: '0x' + e.slice(64, 128),
        v: n,
    };
}
export function floatToWire(x) {
    const rounded = x.toFixed(8);
    if (Math.abs(parseFloat(rounded) - x) >= 1e-12) {
        throw new Error('float_to_wire causes rounding');
    }
    return rounded;
}
export function floatToIntForHashing(x) {
    return floatToInt(x, 8);
}
export function floatToUsdInt(x) {
    return floatToInt(x, 6);
}
export function floatToInt(x, power) {
    const with_decimals = x * 10 ** power;
    if (Math.abs(Math.round(with_decimals) - with_decimals) >= 1e-4) {
        throw new Error('float_to_int causes rounding');
    }
    return Math.round(with_decimals);
}
export function getTimestampMs() {
    return Math.floor(Date.now());
}
