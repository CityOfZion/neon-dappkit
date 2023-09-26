import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult, RpcResponseStackItem, BuiltTransaction } from '@cityofzion/neon-dappkit-types';
import { api } from '@cityofzion/neon-js';
import type * as NeonTypes from '@cityofzion/neon-core';
import * as typeChecker from './typeChecker';
export type RpcConfig = {
    rpcAddress: string;
    networkMagic: number;
};
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
    invokeFunction(cimOrBt: ContractInvocationMulti | BuiltTransaction): Promise<string>;
    signTransaction(cimOrBt: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction>;
    calculateFee(cimOrBt: ContractInvocationMulti): Promise<CalculateFee>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<RpcResponseStackItem[]>;
    static init(options: InitOptions): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    static convertParams(args: ExtendedArg[] | undefined): NeonTypes.sc.ContractParam[];
    static buildSigner(optionsAccount: NeonTypes.wallet.Account | undefined, signerEntry?: Signer): NeonTypes.tx.Signer;
    static buildMultipleSigner(optionAccounts: NeonTypes.wallet.Account[], signers?: Signer[]): NeonTypes.tx.Signer[];
    private normalizeAccountArray;
    private buildScriptHex;
    private signTransactionByAccounts;
    private buildTransactionFromCimOrBt;
    private getNetworkFee;
    private getSystemFee;
}
export { typeChecker };
