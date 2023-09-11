"use strict";
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
exports.NeonEventListener = void 0;
const neon_js_1 = require("@cityofzion/neon-js");
class NeonEventListener {
    constructor(rpcUrl, options = undefined) {
        this.options = options;
        this.blockPollingLoopActive = false;
        this.listeners = new Map();
        this.rpcClient = new neon_js_1.rpc.RPCClient(rpcUrl);
    }
    addEventListener(contract, eventname, callback) {
        var _a;
        const listenersOfContract = this.listeners.get(contract);
        if (!listenersOfContract) {
            this.listeners.set(contract, new Map([[eventname, [callback]]]));
        }
        else {
            listenersOfContract.set(eventname, [...((_a = listenersOfContract.get(eventname)) !== null && _a !== void 0 ? _a : []), callback]);
        }
        if (!this.blockPollingLoopActive) {
            this.blockPollingLoopActive = true;
            this.blockPollingLoop();
        }
    }
    removeEventListener(contract, eventname, callback) {
        const listenersOfContract = this.listeners.get(contract);
        if (listenersOfContract) {
            let listenersOfEvent = listenersOfContract.get(eventname);
            if (listenersOfEvent) {
                listenersOfEvent = listenersOfEvent.filter((l) => l !== callback);
                listenersOfContract.set(eventname, listenersOfEvent);
                if (listenersOfEvent.length === 0) {
                    listenersOfContract.delete(eventname);
                    if (listenersOfContract.size === 0) {
                        this.listeners.delete(contract);
                        if (this.listeners.size === 0) {
                            this.blockPollingLoopActive = false;
                        }
                    }
                }
            }
        }
    }
    removeAllEventListenersOfContract(contract) {
        this.listeners.delete(contract);
        if (this.listeners.size === 0) {
            this.blockPollingLoopActive = false;
        }
    }
    removeAllEventListenersOfEvent(contract, eventname) {
        const listenersOfContract = this.listeners.get(contract);
        if (listenersOfContract) {
            listenersOfContract.delete(eventname);
            if (listenersOfContract.size === 0) {
                this.listeners.delete(contract);
                if (this.listeners.size === 0) {
                    this.blockPollingLoopActive = false;
                }
            }
        }
    }
    waitForApplicationLog(txId) {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            const maxAttempts = (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.waitForApplicationLog) === null || _b === void 0 ? void 0 : _b.maxAttempts) !== null && _c !== void 0 ? _c : 30;
            const waitMs = (_f = (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.waitForApplicationLog) === null || _e === void 0 ? void 0 : _e.waitMs) !== null && _f !== void 0 ? _f : 1000;
            let attempts = 0;
            let error = new Error("Couldn't get application log");
            do {
                try {
                    return yield this.rpcClient.getApplicationLog(txId);
                }
                catch (e) {
                    error = e;
                }
                attempts++;
                yield this.wait(waitMs);
            } while (attempts < maxAttempts);
            throw error;
        });
    }
    confirmHalt(txResult) {
        var _a, _b;
        if (((_a = txResult === null || txResult === void 0 ? void 0 : txResult.executions[0]) === null || _a === void 0 ? void 0 : _a.vmstate) !== 'HALT')
            throw new Error('Transaction failed. VMState: ' + ((_b = txResult === null || txResult === void 0 ? void 0 : txResult.executions[0]) === null || _b === void 0 ? void 0 : _b.vmstate));
    }
    confirmStackTrue(txResult) {
        if (!txResult ||
            !txResult.executions ||
            txResult.executions.length === 0 ||
            !txResult.executions[0].stack ||
            txResult.executions[0].stack.length === 0) {
            throw new Error('Transaction failed. No stack found in transaction result');
        }
        const stack = txResult.executions[0].stack[0];
        if (stack.value !== true) {
            throw new Error('Transaction failed. Stack value is not true');
        }
    }
    getNotificationState(txResult, eventToCheck) {
        return txResult === null || txResult === void 0 ? void 0 : txResult.executions[0].notifications.find((e) => {
            return e.contract === eventToCheck.contract && e.eventname === eventToCheck.eventname;
        });
    }
    confirmTransaction(txResult, eventToCheck, confirmStackTrue = false) {
        this.confirmHalt(txResult);
        if (confirmStackTrue) {
            this.confirmStackTrue(txResult);
        }
        if (eventToCheck) {
            const state = this.getNotificationState(txResult, eventToCheck);
            if (!state) {
                throw new Error('Transaction failed. Event not found in transaction result');
            }
        }
    }
    blockPollingLoop() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __awaiter(this, void 0, void 0, function* () {
            let height = yield this.rpcClient.getBlockCount();
            while (this.blockPollingLoopActive) {
                yield this.wait((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.waitForEventMs) !== null && _b !== void 0 ? _b : 4000);
                try {
                    ((_c = this.options) === null || _c === void 0 ? void 0 : _c.debug) && console.log('Checking block ' + height);
                    if (height > (yield this.rpcClient.getBlockCount())) {
                        ((_d = this.options) === null || _d === void 0 ? void 0 : _d.debug) && console.log('Block height is ahead of node. Waiting for node to catch up...');
                        continue;
                    }
                    const block = yield this.rpcClient.getBlock(height - 1, true);
                    for (const transaction of block.tx) {
                        if (!transaction.hash) {
                            ((_e = this.options) === null || _e === void 0 ? void 0 : _e.debug) && console.log('Transaction hash not found. Skipping transaction');
                            continue;
                        }
                        const log = yield this.rpcClient.getApplicationLog(transaction.hash);
                        for (const notification of log.executions[0].notifications) {
                            const listenersOfContract = this.listeners.get(notification.contract);
                            if (!listenersOfContract) {
                                ((_f = this.options) === null || _f === void 0 ? void 0 : _f.debug) && console.log('No listeners for contract ' + notification.contract);
                                continue;
                            }
                            const listenersOfEvent = listenersOfContract.get(notification.eventname);
                            if (!listenersOfEvent) {
                                ((_g = this.options) === null || _g === void 0 ? void 0 : _g.debug) && console.log('No listeners for event ' + notification.eventname);
                                continue;
                            }
                            for (const listener of listenersOfEvent) {
                                try {
                                    ((_h = this.options) === null || _h === void 0 ? void 0 : _h.debug) && console.log('Calling listener');
                                    listener(notification);
                                }
                                catch (e) {
                                    ((_j = this.options) === null || _j === void 0 ? void 0 : _j.debug) && console.error(e);
                                }
                            }
                        }
                    }
                    height++; // this is important to avoid skipping blocks when the code throws exceptions
                }
                catch (error) {
                    ((_k = this.options) === null || _k === void 0 ? void 0 : _k.debug) && console.error(error);
                }
            }
            ((_l = this.options) === null || _l === void 0 ? void 0 : _l.debug) && console.log('Block polling loop stopped');
        });
    }
    wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.NeonEventListener = NeonEventListener;
NeonEventListener.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonEventListener.TESTNET = 'https://testnet1.neo.coz.io:443';
