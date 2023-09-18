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
            const accountArr = NeonInvoker.normalizeArray(this.options.account);
            const script = NeonInvoker.buildScriptHex(cim);
            const rpcResult = yield new neon_js_1.rpc.RPCClient(this.options.rpcAddress).invokeScript(neon_js_1.u.HexString.fromHex(script), accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined);
            if (rpcResult.state === 'FAULT')
                throw Error(`Execution state is FAULT. Exception: ${rpcResult.exception}`);
            return Object.assign(Object.assign({}, rpcResult), { stack: rpcResult.stack });
        });
    }
    invokeFunction(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const trx = yield this.cimOrBtToSignedTx(cim);
            console.log(JSON.stringify(trx.toJson()));
            return yield this.invokeTx(trx);
        });
    }
    signTransaction(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            return NeonInvoker.cimAndTxToBt(cim, yield this.cimOrBtToSignedTx(cim));
        });
    }
    cimToTx(cim) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = NeonInvoker.normalizeArray(this.options.account);
            const script = NeonInvoker.buildScriptHex(cim);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            const trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + this.options.validBlocks,
                // TODO: Should I put all the signers? Even the ones that I don't have the private key? Backend and Frontend?
                // signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
            });
            if (cim.systemFeeOverride) {
                trx.networkFee = neon_js_1.u.BigInteger.fromNumber(cim.systemFeeOverride);
            }
            else {
                const { gasconsumed } = yield this.testInvoke(cim);
                const systemFee = neon_js_1.u.BigInteger.fromNumber(gasconsumed);
                trx.networkFee = systemFee.add((_a = cim.extraSystemFee) !== null && _a !== void 0 ? _a : 0);
            }
            if (cim.networkFeeOverride) {
                trx.systemFee = neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride);
            }
            else {
                const networkFee = yield this.smartCalculateNetworkFee(trx, accountArr, rpcClient);
                trx.systemFee = networkFee.add((_b = cim.extraNetworkFee) !== null && _b !== void 0 ? _b : 0);
            }
            return trx;
        });
    }
    smartCalculateNetworkFee(trx, accountArr, rpcClient) {
        return __awaiter(this, void 0, void 0, function* () {
            const trxClone = neon_js_1.tx.Transaction.fromJson(trx.toJson());
            for (const account of accountArr) {
                if (account) {
                    trxClone.addWitness(new neon_js_1.tx.Witness({
                        invocationScript: '',
                        verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                    }));
                }
            }
            return yield neon_js_1.api.smartCalculateNetworkFee(trxClone, rpcClient);
        });
    }
    signTx(trx, signers) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = NeonInvoker.normalizeArray(this.options.account);
            // TODO: Can I put some signers on the backend and some on the frontend?
            const txsignersArr = (trx.signers ? NeonInvoker.normalizeArray(trx.signers) : []);
            trx.signers = [...txsignersArr, ...NeonInvoker.buildMultipleSigner(accountArr, signers === null || signers === void 0 ? void 0 : signers.slice(txsignersArr.length))];
            for (const i in accountArr) {
                const account = accountArr[i];
                if (account) {
                    if (this.options.signingCallback) {
                        trx.addWitness(new neon_js_1.tx.Witness({
                            invocationScript: '',
                            verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                        }));
                        const facade = yield neon_js_1.api.NetworkFacade.fromConfig({
                            node: this.options.rpcAddress,
                        });
                        trx = yield facade.sign(trx, {
                            signingCallback: this.options.signingCallback,
                        });
                    }
                    else {
                        trx.sign(account, this.options.networkMagic);
                    }
                }
            }
            return trx;
        });
    }
    invokeTx(trx) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            return yield rpcClient.sendRawTransaction(trx);
        });
    }
    cimOrBtToSignedTx(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            let trx;
            if (NeonInvoker.isBt(cim)) {
                const bt = cim;
                if (neon_js_1.u.base642hex(bt.script) !== NeonInvoker.buildScriptHex(bt)) {
                    throw new Error('The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti');
                }
                trx = NeonInvoker.btToTx(bt);
            }
            else {
                trx = yield this.cimToTx(cim);
            }
            return yield this.signTx(trx, cim.signers);
        });
    }
    static isBt(cim) {
        return cim.script !== undefined;
    }
    static btToTx(bt) {
        const trx = Object.assign(bt, { sender: '', attributes: [] });
        return neon_js_1.tx.Transaction.fromJson(trx);
    }
    static cimAndTxToBt(cim, trx) {
        return Object.assign(cim, trx.toJson());
    }
    calculateFee(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = yield this.cimToTx(cim);
            return {
                networkFee: tx.networkFee,
                systemFee: tx.systemFee,
                total: Number(tx.networkFee.add(tx.systemFee).toDecimal(8)),
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
    static buildScriptHex(cim) {
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
    static buildMultipleSigner(optionAccounts, signers) {
        if (!(signers === null || signers === void 0 ? void 0 : signers.length)) {
            return optionAccounts.map((a) => this.buildSigner(a));
        }
        else if (signers.length === optionAccounts.length) {
            return optionAccounts.map((a, i) => this.buildSigner(a, signers[i]));
        }
        else {
            throw new Error('You need to provide an account on the constructor for each signer. At least one.');
        }
    }
    static normalizeArray(objOrArray) {
        if (Array.isArray(objOrArray)) {
            return objOrArray;
        }
        else {
            return [objOrArray];
        }
    }
}
exports.NeonInvoker = NeonInvoker;
NeonInvoker.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonInvoker.TESTNET = 'https://testnet1.neo.coz.io:443';
