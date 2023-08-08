import { Wallet } from 'ethers';
import { OrderType, OrderTypeWire } from './types';
export declare const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare function orderTypeToTuple(orderType: OrderType): [number, number];
type Grouping = 'na' | 'normalTpsl' | 'positionTpsl';
export declare function orderGroupToNumber(grouping: Grouping): number;
interface Order {
    asset: number;
    isBuy: boolean;
    limitPx: number;
    sz: number;
    reduceOnly: boolean;
}
interface OrderSpec {
    order: Order;
    orderType: OrderType;
}
export declare function orderSpecPreprocessing(order_spec: OrderSpec): [number, boolean, number, number, boolean, number, number];
export interface OrderWire {
    asset: number;
    isBuy: boolean;
    limitPx: string;
    sz: string;
    reduceOnly: boolean;
    orderType: OrderTypeWire;
}
export declare function orderTypeToWire(orderType: OrderType): OrderTypeWire;
export declare function orderSpecToOrderWire(order_spec: OrderSpec): OrderWire;
export declare function constructPhantomAgent(signatureTypes: string[], signatureData: any[]): {
    source: string;
    connectionId: string;
};
export declare function signL1Action(wallet: Wallet, signatureTypes: string[], signatureData: any[], activePool: any, nonce: any): Promise<{
    r: string;
    s: string;
    v: number;
}>;
export declare function signUsdTransferAction(wallet: Wallet, message: {
    destination: string;
    amount: string;
    time: number;
}): Promise<{
    r: string;
    s: string;
    v: number;
}>;
export declare function Tl(e: string): {
    r: string;
    s: string;
    v: number;
};
export declare function floatToWire(x: number): string;
export declare function floatToIntForHashing(x: number): number;
export declare function floatToUsdInt(x: number): number;
export declare function floatToInt(x: number, power: number): number;
export declare function getTimestampMs(): number;
export {};
