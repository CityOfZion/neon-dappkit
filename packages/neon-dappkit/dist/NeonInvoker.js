"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeChecker = exports.NeonInvoker = void 0;
const neon_js_1 = require("@cityofzion/neon-js");
const typeChecker = __importStar(require("./typeChecker"));
exports.typeChecker = typeChecker;
class NeonInvoker {
    constructor(options) {
        this.options = options;
    }
    testInvoke(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            const script = this.buildScriptHex(cim);
            const rpcResult = yield new neon_js_1.rpc.RPCClient(this.options.rpcAddress).invokeScript(neon_js_1.u.HexString.fromHex(script), accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined);
            if (rpcResult.state === 'FAULT')
                throw Error(`Execution state is FAULT. Exception: ${rpcResult.exception}`);
            return Object.assign(Object.assign({}, rpcResult), { stack: rpcResult.stack });
        });
    }
    invokeFunction(cimOrBt) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            const transaction = yield this.buildTransactionFromCimOrBt(cimOrBt, accountArr);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const signedTransaction = yield this.signTransactionByAccounts(transaction, accountArr);
            return yield rpcClient.sendRawTransaction(signedTransaction);
        });
    }
    signTransaction(cimOrBt) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            const transaction = yield this.buildTransactionFromCimOrBt(cimOrBt, accountArr);
            const signedTransaction = yield this.signTransactionByAccounts(transaction, accountArr);
            const signedTransactionJson = signedTransaction.toJson();
            return Object.assign(Object.assign({}, cimOrBt), { hash: signedTransactionJson.hash, script: neon_js_1.u.base642hex(signedTransactionJson.script), nonce: signedTransactionJson.nonce, version: signedTransactionJson.version, size: signedTransactionJson.size, validUntilBlock: signedTransactionJson.validuntilblock, witnesses: signedTransactionJson.witnesses, networkFee: signedTransactionJson.netfee, systemFee: signedTransactionJson.sysfee });
        });
    }
    calculateFee(cimOrBt) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            const transaction = yield this.buildTransactionFromCimOrBt(cimOrBt, accountArr);
            return {
                networkFee: transaction.networkFee,
                systemFee: transaction.systemFee,
                total: Number(transaction.networkFee.add(transaction.systemFee).toDecimal(8)),
            };
        });
    }
    traverseIterator(sessionId, iteratorId, count) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const result = yield rpcClient.traverseIterator(sessionId, iteratorId, count);
            return result.map((item) => ({ value: item.value, type: item.type }));
        });
    }
    static init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkMagic = yield this.getMagicOfRpcAddress(options.rpcAddress);
            return new NeonInvoker(Object.assign(Object.assign({}, options), { validBlocks: 100, networkMagic }));
        });
    }
    static getMagicOfRpcAddress(rpcAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield new neon_js_1.rpc.RPCClient(rpcAddress).getVersion();
            return resp.protocol.network;
        });
    }
    static convertParams(args) {
        return (args !== null && args !== void 0 ? args : []).map((a) => {
            if (a.type === undefined)
                throw new Error('Invalid argument type');
            if (a.value === undefined)
                throw new Error('Invalid argument value');
            switch (a.type) {
                case 'Any':
                    return neon_js_1.sc.ContractParam.any(a.value);
                case 'String':
                    return neon_js_1.sc.ContractParam.string(a.value);
                case 'Boolean':
                    return neon_js_1.sc.ContractParam.boolean(a.value);
                case 'PublicKey':
                    return neon_js_1.sc.ContractParam.publicKey(a.value);
                case 'ScriptHash':
                    return neon_js_1.sc.ContractParam.hash160(neon_js_1.u.HexString.fromHex(a.value));
                case 'Address':
                case 'Hash160':
                    return neon_js_1.sc.ContractParam.hash160(a.value);
                case 'Hash256':
                    return neon_js_1.sc.ContractParam.hash256(a.value);
                case 'Integer':
                    return neon_js_1.sc.ContractParam.integer(a.value);
                case 'Array':
                    return neon_js_1.sc.ContractParam.array(...this.convertParams(a.value));
                case 'Map':
                    return neon_js_1.sc.ContractParam.map(...a.value.map((map) => ({
                        key: this.convertParams([map.key])[0],
                        value: this.convertParams([map.value])[0],
                    })));
                case 'ByteArray':
                    return neon_js_1.sc.ContractParam.byteArray(neon_js_1.u.hex2base64(a.value));
            }
        });
    }
    static buildSigner(optionsAccount, signerEntry) {
        var _a, _b;
        let scopes = (_a = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.scopes) !== null && _a !== void 0 ? _a : 'CalledByEntry';
        if (typeof scopes === 'number') {
            scopes = neon_js_1.tx.toString(scopes);
        }
        const account = (_b = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.account) !== null && _b !== void 0 ? _b : optionsAccount === null || optionsAccount === void 0 ? void 0 : optionsAccount.scriptHash;
        if (!account)
            throw new Error('You need to provide at least one account to sign.');
        return neon_js_1.tx.Signer.fromJson({
            scopes,
            account,
            allowedcontracts: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedContracts,
            allowedgroups: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedGroups,
            rules: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.rules,
        });
    }
    static buildMultipleSigner(optionAccounts, signers = []) {
        const allSigners = [];
        for (let i = 0; i < Math.max(signers.length, optionAccounts.length); i++) {
            allSigners.push(this.buildSigner(optionAccounts === null || optionAccounts === void 0 ? void 0 : optionAccounts[i], signers === null || signers === void 0 ? void 0 : signers[i]));
        }
        return allSigners;
    }
    normalizeAccountArray(acc) {
        if (Array.isArray(acc)) {
            return acc;
        }
        else {
            return [acc];
        }
    }
    buildScriptHex(cim) {
        const sb = new neon_js_1.sc.ScriptBuilder();
        cim.invocations.forEach((c) => {
            sb.emitContractCall({
                scriptHash: c.scriptHash,
                operation: c.operation,
                args: NeonInvoker.convertParams(c.args),
            });
            if (c.abortOnFail) {
                sb.emit(0x39);
            }
        });
        return sb.build();
    }
    signTransactionByAccounts(transaction, accountArr) {
        return __awaiter(this, void 0, void 0, function* () {
            let txClone = new neon_js_1.tx.Transaction(transaction);
            for (const account of accountArr) {
                if (this.options.signingCallback) {
                    transaction.addWitness(new neon_js_1.tx.Witness({
                        invocationScript: '',
                        verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                    }));
                    const facade = yield neon_js_1.api.NetworkFacade.fromConfig({
                        node: this.options.rpcAddress,
                    });
                    txClone = yield facade.sign(transaction, {
                        signingCallback: this.options.signingCallback,
                    });
                    continue;
                }
                txClone.sign(account, this.options.networkMagic);
            }
            return txClone;
        });
    }
    buildTransactionFromCimOrBt(cimOrBt, accountArr) {
        return __awaiter(this, void 0, void 0, function* () {
            const cimHexString = this.buildScriptHex(cimOrBt);
            const signers = NeonInvoker.buildMultipleSigner(accountArr, cimOrBt.signers);
            if ('script' in cimOrBt) {
                if (cimOrBt.script !== cimHexString) {
                    throw new Error('The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti');
                }
                return new neon_js_1.tx.Transaction({
                    validUntilBlock: cimOrBt.validUntilBlock,
                    version: cimOrBt.version,
                    nonce: cimOrBt.nonce,
                    script: cimOrBt.script,
                    systemFee: cimOrBt.systemFee,
                    networkFee: cimOrBt.networkFee,
                    witnesses: cimOrBt.witnesses.map((witness) => neon_js_1.tx.Witness.fromJson(witness)),
                    signers,
                });
            }
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            const transaction = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(cimHexString),
                validUntilBlock: currentHeight + this.options.validBlocks,
                signers,
            });
            const systemFee = yield this.getSystemFee(cimOrBt);
            const networkFee = yield this.getNetworkFee(cimOrBt, rpcClient, accountArr, transaction);
            transaction.networkFee = networkFee;
            transaction.systemFee = systemFee;
            return transaction;
        });
    }
    getNetworkFee(cim, rpcClient, accountArr, transaction) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (cim.networkFeeOverride) {
                return neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride);
            }
            const txClone = new neon_js_1.tx.Transaction(transaction);
            txClone.signers.forEach((signer) => {
                var _a;
                const account = (_a = accountArr.find((account) => account.scriptHash === signer.account.toString())) !== null && _a !== void 0 ? _a : accountArr[0];
                if (!account)
                    throw new Error('You need to provide at least one account to calculate the network fee.');
                txClone.addWitness(new neon_js_1.tx.Witness({
                    invocationScript: '',
                    verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                }));
            });
            const networkFee = yield neon_js_1.api.smartCalculateNetworkFee(txClone, rpcClient);
            return networkFee.add((_a = cim.extraNetworkFee) !== null && _a !== void 0 ? _a : 0);
        });
    }
    getSystemFee(cimOrBt) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (cimOrBt.systemFeeOverride) {
                return neon_js_1.u.BigInteger.fromNumber(cimOrBt.systemFeeOverride);
            }
            const { gasconsumed } = yield this.testInvoke(cimOrBt);
            const systemFee = neon_js_1.u.BigInteger.fromNumber(gasconsumed);
            return systemFee.add((_a = cimOrBt.extraSystemFee) !== null && _a !== void 0 ? _a : 0);
        });
    }
}
exports.NeonInvoker = NeonInvoker;
NeonInvoker.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonInvoker.TESTNET = 'https://testnet1.neo.coz.io:443';
