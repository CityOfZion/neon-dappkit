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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const neon_js_1 = require("@cityofzion/neon-js");
const assert_1 = __importDefault(require("assert"));
function getBalance(invoker, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const payerBalanceResp = yield invoker.testInvoke({
            invocations: [
                {
                    operation: 'balanceOf',
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    args: [{ value: address, type: 'Hash160' }],
                },
            ],
        });
        return index_1.NeonParser.parseRpcResponse(payerBalanceResp.stack[0]) / Math.pow(10, 8);
    });
}
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
describe('NeonInvoker', function () {
    this.timeout(60000);
    it('does invokeFuncion', () => __awaiter(this, void 0, void 0, function* () {
        const account = new neon_js_1.wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8');
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account,
        });
        const txId = yield invoker.invokeFunction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: account.address },
                        { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: account.scriptHash,
                    scopes: neon_js_1.tx.WitnessScope.CalledByEntry,
                    rules: [],
                },
            ],
        });
        (0, assert_1.default)(txId.length > 0, 'has txId');
        yield wait(15000);
    }));
    it('does invokeFunction with signingCallback', () => __awaiter(this, void 0, void 0, function* () {
        const publicAccount = new neon_js_1.wallet.Account('02eecb8c0c3ae4e3c65457581c8c8dc0ecf52f74953166ce84d3c5b67a42a1ee73');
        const privateAccount = new neon_js_1.wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8');
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            signingCallback: (transaction, details) => __awaiter(this, void 0, void 0, function* () {
                const hex = index_1.NeonParser.numToHex(details.network, 4, true) + index_1.NeonParser.reverseHex(transaction.hash());
                return neon_js_1.wallet.sign(hex, privateAccount.privateKey);
            }),
            account: publicAccount,
        });
        const txId = yield invoker.invokeFunction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: publicAccount.address },
                        { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: publicAccount.scriptHash,
                    scopes: neon_js_1.tx.WitnessScope.CalledByEntry,
                    rules: [],
                },
            ],
        });
        (0, assert_1.default)(txId.length > 0, 'has txId');
        yield wait(15000);
    }));
    it('can sign and invoke using different NeonInvokers/accounts', () => __awaiter(this, void 0, void 0, function* () {
        const accountPayer = new neon_js_1.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014'); // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv
        const accountOwner = new neon_js_1.wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8'); // NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr
        // TEST WITH BOTH ACCOUNTS ON THE SAME INVOKER
        const invokerBoth = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account: [accountPayer, accountOwner],
        });
        const txBoth = yield invokerBoth.invokeFunction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: accountOwner.address },
                        { type: 'Hash160', value: accountPayer.address },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: accountPayer.scriptHash,
                    scopes: 'CalledByEntry',
                },
                {
                    account: accountOwner.scriptHash,
                    scopes: 'CalledByEntry',
                },
            ],
        });
        (0, assert_1.default)(txBoth.length > 0, 'has txId');
        yield wait(15000);
        // TEST WITH EACH ACCOUNT ON A DIFFERENT INVOKER
        const invokerPayer = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account: accountPayer,
        });
        const invokerOwner = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account: accountOwner,
        });
        const payerBalance = yield getBalance(invokerPayer, accountPayer.address);
        const ownerBalance = yield getBalance(invokerOwner, accountOwner.address);
        const bt = yield invokerPayer.signTransaction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: accountOwner.address },
                        { type: 'Hash160', value: accountPayer.address },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: accountPayer.scriptHash,
                    scopes: 'CalledByEntry',
                },
                {
                    account: accountOwner.scriptHash,
                    scopes: 'CalledByEntry',
                },
            ],
        });
        const txId = yield invokerOwner.invokeFunction(bt);
        (0, assert_1.default)(txId.length > 0, 'has txId');
        yield wait(15000);
        const payerBalance2 = yield getBalance(invokerPayer, accountPayer.address);
        const ownerBalance2 = yield getBalance(invokerOwner, accountOwner.address);
        (0, assert_1.default)(payerBalance2 > payerBalance + 0.8, `payer balance (${payerBalance2}) increased by almost 1 (was ${payerBalance})`);
        (0, assert_1.default)(payerBalance2 < payerBalance + 1, `payer balance (${payerBalance2}) increased by almost 1 (was ${payerBalance})`);
        assert_1.default.equal(ownerBalance2, ownerBalance - 1, 'owner balance decreased by 1');
        yield wait(15000);
    }));
    it("can throw an error if the signed transaction doesn't match the invocation", () => __awaiter(this, void 0, void 0, function* () {
        const accountPayer = new neon_js_1.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014'); // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv
        const accountOwner = new neon_js_1.wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8'); // NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr
        const invokerPayer = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account: accountPayer,
        });
        const invokerOwner = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account: accountOwner,
        });
        const bt = yield invokerPayer.signTransaction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: accountOwner.address },
                        { type: 'Hash160', value: accountPayer.address },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: accountPayer.scriptHash,
                    scopes: 'CalledByEntry',
                },
                {
                    account: accountOwner.scriptHash,
                    scopes: 'CalledByEntry',
                },
            ],
        });
        yield assert_1.default.rejects(invokerOwner.invokeFunction(Object.assign(Object.assign({}, bt), { invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: accountPayer.address },
                        { type: 'Hash160', value: accountOwner.address },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ] })), {
            name: 'Error',
            message: 'The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti',
        });
    }));
    it('does calculateFee', () => __awaiter(this, void 0, void 0, function* () {
        const account = new neon_js_1.wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8');
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account,
        });
        const param = {
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: account.address },
                        { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: account.scriptHash,
                    scopes: neon_js_1.tx.WitnessScope.CalledByEntry,
                    rules: [],
                },
            ],
        };
        const { networkFee, systemFee, total } = yield invoker.calculateFee(param);
        (0, assert_1.default)(Number(networkFee) > 0, 'has networkFee');
        (0, assert_1.default)(Number(systemFee) > 0, 'has systemFee');
        (0, assert_1.default)(total === Number(networkFee.add(systemFee).toDecimal(8)), 'has totalFee');
        const { networkFee: networkFeeOverridden, systemFee: systemFeeOverridden } = yield invoker.calculateFee(Object.assign({ networkFeeOverride: 20000, systemFeeOverride: 10000 }, param));
        (0, assert_1.default)(Number(networkFeeOverridden) === 20000, 'has networkFee overridden');
        (0, assert_1.default)(Number(systemFeeOverridden) === 10000, 'has systemFee overridden');
        const { networkFee: networkFeeExtra, systemFee: systemFeeExtra } = yield invoker.calculateFee(Object.assign({ extraNetworkFee: 20000, extraSystemFee: 10000 }, param));
        (0, assert_1.default)(Number(networkFeeExtra) === Number(networkFee) + 20000, 'has networkFee overridden');
        (0, assert_1.default)(Number(systemFeeExtra) === Number(systemFee) + 10000, 'has systemFee overridden');
    }));
    it('does testInvoke', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'symbol',
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeByteString(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, 'R0FT', 'correct symbol');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
    }));
    it('handles integer return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'negative_number',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_int',
                    args: [{ type: 'Integer', value: '1234' }],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeInteger(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, '-100');
        }
        else {
            assert_1.default.fail('stack return is not Integer');
        }
        if (index_1.TypeChecker.isStackTypeInteger(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, '1234');
        }
        else {
            assert_1.default.fail('stack return is not Integer');
        }
    }));
    it('handles boolean return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_true',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_false',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: true }],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: false }],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[2])) {
            assert_1.default.equal(resp.stack[2].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[3])) {
            assert_1.default.equal(resp.stack[3].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
    }));
    it('handles boolean return (again)', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_true',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_false',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: true }],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: false }],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[2])) {
            assert_1.default.equal(resp.stack[2].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.TypeChecker.isStackTypeBoolean(resp.stack[3])) {
            assert_1.default.equal(resp.stack[3].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
    }));
    it('handles array return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'positive_numbers',
                    args: [],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeArray(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    type: 'Integer',
                    value: '1',
                },
                {
                    type: 'Integer',
                    value: '20',
                },
                {
                    type: 'Integer',
                    value: '100',
                },
                {
                    type: 'Integer',
                    value: '123',
                },
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Array');
        }
    }));
    it('handles bytestring return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_str',
                    args: [],
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_bytes',
                    args: [],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeByteString(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
        if (index_1.TypeChecker.isStackTypeByteString(resp.stack[1])) {
            assert_1.default.deepEqual(resp.stack[1].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
    }));
    it('handles array return (again)', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'positive_numbers',
                    args: [],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeArray(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    type: 'Integer',
                    value: '1',
                },
                {
                    type: 'Integer',
                    value: '20',
                },
                {
                    type: 'Integer',
                    value: '100',
                },
                {
                    type: 'Integer',
                    value: '123',
                },
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Array');
        }
    }));
    it('handles map return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x8b43ab0c83b7d12cf35a0e780072bc314a688796',
                    operation: 'main',
                    args: [],
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.TypeChecker.isStackTypeMap(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    key: {
                        type: 'ByteString',
                        value: 'YQ==',
                    },
                    value: {
                        type: 'Integer',
                        value: '4',
                    },
                },
                {
                    key: {
                        type: 'Integer',
                        value: '13',
                    },
                    value: {
                        type: 'Integer',
                        value: '3',
                    },
                },
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Map');
        }
    }));
});
