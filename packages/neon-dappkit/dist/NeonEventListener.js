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
exports.NeonEventListener = void 0;
const Neon = __importStar(require("@cityofzion/neon-core"));
class NeonEventListener {
    constructor(rpcUrl, options = undefined) {
        this.options = options;
        this.blockPollingLoopActive = false;
        this.listeners = new Map();
        this.rpcClient = new Neon.rpc.RPCClient(rpcUrl);
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
                listenersOfEvent = listenersOfEvent.filter(l => l !== callback);
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
        if (!txResult || !txResult.executions || txResult.executions.length === 0 || !txResult.executions[0].stack || txResult.executions[0].stack.length === 0) {
            throw new Error('Transaction failed. No stack found in transaction result');
        }
        const stack = txResult.executions[0].stack[0];
        if (stack.value !== true) {
            throw new Error('Transaction failed. Stack value is not true');
        }
    }
    getNotificationState(txResult, eventToCheck) {
        return txResult === null || txResult === void 0 ? void 0 : txResult.executions[0].notifications.find(e => {
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __awaiter(this, void 0, void 0, function* () {
            let height = yield this.rpcClient.getBlockCount();
            while (this.blockPollingLoopActive) {
                yield this.wait(4000);
                try {
                    ((_a = this.options) === null || _a === void 0 ? void 0 : _a.debug) && console.log('Checking block ' + height);
                    if (height > (yield this.rpcClient.getBlockCount())) {
                        ((_b = this.options) === null || _b === void 0 ? void 0 : _b.debug) && console.log('Block height is ahead of node. Waiting for node to catch up...');
                        continue;
                    }
                    const block = yield this.rpcClient.getBlock(height - 1, true);
                    for (const transaction of block.tx) {
                        if (!transaction.hash) {
                            ((_c = this.options) === null || _c === void 0 ? void 0 : _c.debug) && console.log('Transaction hash not found. Skipping transaction');
                            continue;
                        }
                        const log = yield this.rpcClient.getApplicationLog(transaction.hash);
                        for (const notification of log.executions[0].notifications) {
                            const listenersOfContract = this.listeners.get(notification.contract);
                            if (!listenersOfContract) {
                                ((_d = this.options) === null || _d === void 0 ? void 0 : _d.debug) && console.log('No listeners for contract ' + notification.contract);
                                continue;
                            }
                            const listenersOfEvent = listenersOfContract.get(notification.eventname);
                            if (!listenersOfEvent) {
                                ((_e = this.options) === null || _e === void 0 ? void 0 : _e.debug) && console.log('No listeners for event ' + notification.eventname);
                                continue;
                            }
                            for (const listener of listenersOfEvent) {
                                try {
                                    ((_f = this.options) === null || _f === void 0 ? void 0 : _f.debug) && console.log('Calling listener');
                                    listener(notification);
                                }
                                catch (e) {
                                    ((_g = this.options) === null || _g === void 0 ? void 0 : _g.debug) && console.error(e);
                                }
                            }
                        }
                    }
                    height++; // this is important to avoid skipping blocks when the code throws exceptions
                }
                catch (error) {
                    ((_h = this.options) === null || _h === void 0 ? void 0 : _h.debug) && console.error(error);
                }
            }
            ((_j = this.options) === null || _j === void 0 ? void 0 : _j.debug) && console.log('Block polling loop stopped');
        });
    }
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.NeonEventListener = NeonEventListener;
NeonEventListener.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonEventListener.TESTNET = 'https://testnet1.neo.coz.io:443';
