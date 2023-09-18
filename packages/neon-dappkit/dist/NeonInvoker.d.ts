import { ContractInvocationMulti, Neo3Invoker, Arg, InvokeResult, RpcResponseStackItem, BuiltTransaction } from '@cityofzion/neon-dappkit-types';
import { api } from '@cityofzion/neon-js';
import type * as NeonTypes from '@cityofzion/neon-core';
import * as typeChecker from './typeChecker';
export type CalculateFee = {
    networkFee: NeonTypes.u.BigInteger;
    systemFee: NeonTypes.u.BigInteger;
    total: number;
};
export type ExtendedArg = Arg | {
    type: 'Address';
    value: string;
} | {
    type: 'ScriptHash';
    value: string;
};
export type InitOptions = {
    rpcAddress: string;
    account?: NeonTypes.wallet.Account | NeonTypes.wallet.Account[];
    signingCallback?: api.SigningFunction;
};
export type Options = InitOptions & {
    networkMagic: number;
    validBlocks: number;
};
export declare class NeonInvoker implements Neo3Invoker {
    options: Options;
    static MAINNET: string;
    static TESTNET: string;
    private constructor();
    testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult>;
    invokeFunction(cim: ContractInvocationMulti | BuiltTransaction): Promise<string>;
    signTransaction(cim: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction>;
    private cimToTx;
    private smartCalculateNetworkFee;
    private signTx;
    private invokeTx;
    private cimOrBtToSignedTx;
    private static isBt;
    private static btToTx;
    private static cimAndTxToBt;
    calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<RpcResponseStackItem[]>;
    static init(options: InitOptions): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    private static buildScriptHex;
    private static convertParams;
    private static buildSigner;
    private static buildMultipleSigner;
    private static normalizeArray;
}
export { typeChecker };
