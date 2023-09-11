import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult, RpcResponseStackItem } from '@cityofzion/neon-dappkit-types';
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
    invokeFunction(cim: ContractInvocationMulti): Promise<string>;
    calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee>;
    getNetworkFee(cim: ContractInvocationMulti): Promise<NeonTypes.u.BigInteger>;
    getSystemFee(cim: ContractInvocationMulti): Promise<NeonTypes.u.BigInteger>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<RpcResponseStackItem[]>;
    static init(options: InitOptions): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    static buildScriptBuilder(cim: ContractInvocationMulti): string;
    static convertParams(args: ExtendedArg[] | undefined): NeonTypes.sc.ContractParam[];
    static buildSigner(optionsAccount: NeonTypes.wallet.Account | undefined, signerEntry?: Signer): NeonTypes.tx.Signer;
    static buildMultipleSigner(optionAccounts: (NeonTypes.wallet.Account | undefined)[], signers?: Signer[]): NeonTypes.tx.Signer[];
    private normalizeAccountArray;
}
export { typeChecker };
