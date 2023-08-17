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
const _1 = require(".");
const mocha_1 = require("mocha");
const assert = __importStar(require("assert"));
(0, mocha_1.describe)("Neon-Parser Tests", function () {
    this.timeout(60000);
    (0, mocha_1.it)("converts Base64 to Hex and revert it", () => __awaiter(this, void 0, void 0, function* () {
        assert.equal(_1.NeonParser.reverseHex(_1.NeonParser.base64ToHex("ateeXCdGd+AdYKWa5w8SikaAqlk=")), "59aa80468a120fe79aa5601de07746275c9ed76a");
    }));
    (0, mocha_1.it)("converts address to script hash", () => __awaiter(this, void 0, void 0, function* () {
        assert.equal(_1.NeonParser.accountInputToScripthash("NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr"), "857a247939db5c7cd3a7bb14791280c09e824bea");
    }));
});
(0, mocha_1.describe)("RPC Response Parser Tests", function () {
    (0, mocha_1.it)("Parse Address", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.asciiToBase64("NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs")
        };
        const address = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "String", hint: "Address" });
        assert.deepEqual(address, "NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs");
    }));
    (0, mocha_1.it)("Parse invalid Address", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            // Address will end up too short
            value: _1.NeonParser.hexToBase64("Nnnnnnnnnnnnnnnn")
        };
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "String", hint: "Address" }));
        // Address will be too big
        rpcResponse.value = _1.NeonParser.strToBase64("NnnnnnnnnnnnnnnnNnnnnnnnnnnnnnnnNnnnnnnnnnnnnnnn");
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "String", hint: "Address" }));
        // Address shouldn't start with a letter that isn't 'A' or 'N'
        rpcResponse.value = _1.NeonParser.strToBase64("BNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs");
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "String", hint: "Address" }));
        // Address shouldn't have invalid base58 characters
        rpcResponse.value = _1.NeonParser.strToBase64("NNLI44dJNXtDNSBkofB48aTVYtb1zZrNEL");
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "String", hint: "Address" }));
    }));
    (0, mocha_1.it)("Parse ScriptHash and ScriptHashLittleEndian", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.hexToBase64("61479ab68fd5c2c04b254f382d84ddf2f5c67ced")
        };
        const scriptHash = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHash" });
        assert.deepEqual(scriptHash, "0xed7cc6f5f2dd842d384f254bc0c2d58fb69a4761");
        const scriptHashLilEndian = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHashLittleEndian" });
        assert.deepEqual(scriptHashLilEndian, "61479ab68fd5c2c04b254f382d84ddf2f5c67ced");
    }));
    (0, mocha_1.it)("Parse invalid ScriptHash and ScriptHashLittleEndian", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            // ScriptHash will end up too short
            value: _1.NeonParser.hexToBase64("61479ab68fd5c2c04b25")
        };
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHash" }));
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHashLittleEndian" }));
        // ScriptHash will be too big
        rpcResponse.value = _1.NeonParser.hexToBase64("61479ab68fd5c2c04b254f382d84ddf2f5c67ced111111111111");
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHash" }));
        assert.throws(() => _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash160", hint: "ScriptHashLittleEndian" }));
    }));
    (0, mocha_1.it)("Parse BlockHash or TransactionId", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.hexToBase64(_1.NeonParser.reverseHex("0x6c513de791b17ddadec205a07301229ac890d71c16c1d5a0320c655fb69214fc".substring(2)))
        };
        const blockHash = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash256", hint: "BlockHash" });
        const transactionId = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash256", hint: "TransactionId" });
        assert.deepEqual(transactionId, "0x6c513de791b17ddadec205a07301229ac890d71c16c1d5a0320c655fb69214fc");
        assert.deepEqual(blockHash, transactionId);
        // There isn't a different on how they are returned right now
        const hash256 = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Hash256" });
        assert.deepEqual(hash256, blockHash);
    }));
    (0, mocha_1.it)("Parse ByteString without parseConfig", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.asciiToBase64("Testing")
        };
        const stringValue = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(stringValue, "Testing");
        const bytesValue = _1.NeonParser.parseRpcResponse(rpcResponse, { type: 'ByteArray' });
        assert.deepEqual(bytesValue, "54657374696e67");
    }));
    (0, mocha_1.it)("Parse PublicKey", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.hexToBase64("03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c")
        };
        const scriptHash = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "PublicKey" });
        assert.deepEqual(scriptHash, "03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c");
    }));
    (0, mocha_1.it)("Parse Integer", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "Integer",
            value: "18"
        };
        const integer = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(integer, 18);
    }));
    (0, mocha_1.it)("Parse single type Array", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "Array",
            value: [
                {
                    type: "Integer",
                    value: "10"
                },
                {
                    type: "Integer",
                    value: "20"
                },
                {
                    type: "Integer",
                    value: "30"
                },
            ]
        };
        let array = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Array", generic: { type: "Integer" } });
        assert.deepEqual(array, [10, 20, 30]);
        rpcResponse = {
            type: "Array",
            value: [
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("test")
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("array")
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("return")
                },
            ]
        };
        array = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Array", generic: { type: "String" } });
        assert.deepEqual(array, ["test", "array", "return"]);
        // Will also work if you don't send a parseConfig and expects the ByteString results to be a String
        assert.deepEqual(array, _1.NeonParser.parseRpcResponse(rpcResponse));
        rpcResponse = {
            type: "Array",
            value: [
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("test")
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("array")
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("return")
                },
            ]
        };
        array = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Array", generic: { type: "ByteArray" } });
        assert.deepEqual(array, ["74657374", "6172726179", "72657475726e"]);
    }));
    (0, mocha_1.it)("Parse Union", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.strToBase64("test")
        };
        let union = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Any", union: [{ type: "String" }, { type: "Integer" }] });
        assert.deepEqual(union, "test");
        rpcResponse = {
            type: "Integer",
            value: "12"
        };
        union = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Any", union: [{ type: "String" }, { type: "Integer" }] });
        assert.deepEqual(union, 12);
        rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.hexToBase64("61479ab68fd5c2c04b254f382d84ddf2f5c67ced")
        };
        union = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Any", union: [{ type: "Hash160", hint: "ScriptHash" }, { type: "Integer" }] });
        assert.deepEqual(union, "0xed7cc6f5f2dd842d384f254bc0c2d58fb69a4761");
    }));
    (0, mocha_1.it)("Try parse same internal types with Union", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "ByteString",
            value: _1.NeonParser.strToBase64("test")
        };
        // It's not possible to definitly know the correct return of the same internal type, currently, it's only a ByteString problem,
        // so whenever there are multiple ByteStrings on a union it will be considerer as a String
        const str = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Any", union: [{ type: "Hash160", hint: "ScriptHash" }, { type: "Hash256", hint: "BlockHash" }, { type: "Integer" }] });
        assert.deepEqual(str, "test");
    }));
    (0, mocha_1.it)("Parse multiple types Array", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "Array",
            value: [
                {
                    type: "Integer",
                    value: "10"
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("test")
                },
                {
                    type: "ByteString",
                    value: _1.NeonParser.strToBase64("parser")
                },
            ]
        };
        let array = _1.NeonParser.parseRpcResponse(rpcResponse, {
            type: "Array",
            generic: {
                type: "Any",
                union: [
                    {
                        type: "Integer"
                    },
                    {
                        type: "String"
                    }
                ]
            }
        });
        assert.deepEqual(array, [10, "test", "parser"]);
        rpcResponse = {
            type: "Array",
            value: [
                {
                    type: "Integer",
                    value: "10"
                },
                {
                    type: "ByteString",
                    value: "Tk5MaTQ0ZEpOWHRETlNCa29mQjQ4YVRWWXRiMXpack5Fcw"
                },
                {
                    type: "ByteString",
                    value: "TlozcHFuYzFoTU44RUhXNTVabkNudThCMndvb1hKSEN5cg=="
                },
            ]
        };
        array = _1.NeonParser.parseRpcResponse(rpcResponse, {
            type: "Array",
            generic: {
                type: "Any",
                union: [
                    {
                        type: "Integer"
                    },
                    {
                        type: "String",
                        hint: "Address"
                    }
                ]
            }
        });
        assert.deepEqual(array, [10, "NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs", "NZ3pqnc1hMN8EHW55ZnCnu8B2wooXJHCyr"]);
    }));
    (0, mocha_1.it)("Parse single type Map", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "Map",
            value: [
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("unit")
                    },
                    value: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("test")
                    }
                },
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("neo")
                    },
                    value: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("parser")
                    }
                },
            ]
        };
        let map = _1.NeonParser.parseRpcResponse(rpcResponse, {
            type: "Map",
            genericKey: { type: "String" }, genericItem: { type: "String" }
        });
        assert.deepEqual(map, { unit: "test", neo: "parser" });
        // Will also work if you don't send a parseConfig and expects the ByteString results to be a String
        assert.deepEqual(map, _1.NeonParser.parseRpcResponse(rpcResponse));
    }));
    (0, mocha_1.it)("Parse multiple types Map", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            type: "Map",
            value: [
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("unit")
                    },
                    value: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("test")
                    }
                },
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("neo")
                    },
                    value: {
                        type: "Integer",
                        value: "123"
                    }
                },
                {
                    key: {
                        type: "Integer",
                        value: "789"
                    },
                    value: {
                        type: "Integer",
                        value: "123"
                    }
                },
            ]
        };
        let map = _1.NeonParser.parseRpcResponse(rpcResponse, {
            type: "Map",
            genericKey: { type: "Any", union: [{ type: "String" }, { type: "Integer" }] },
            genericItem: { type: "Any", union: [{ type: "String" }, { type: "Integer" }] }
        });
        assert.deepEqual(map, { unit: "test", neo: 123, 789: 123 });
    }));
    (0, mocha_1.it)("Parse Boolean", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            "type": "Boolean",
            "value": true
        };
        let bool = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Boolean" });
        assert.deepEqual(bool, true);
        bool = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(bool, true);
        rpcResponse.value = false;
        bool = _1.NeonParser.parseRpcResponse(rpcResponse, { type: "Boolean" });
        assert.deepEqual(bool, false);
        bool = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(bool, false);
    }));
    (0, mocha_1.it)("Parse Iterator", () => __awaiter(this, void 0, void 0, function* () {
        let rpcResponse = {
            "type": "InteropInterface",
            "interface": "IIterator",
            "id": "e93e82f7-629b-4b4b-9fae-054d18bd32e2"
        };
        // currently can't parse an iterator
        const iterator = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(iterator, undefined);
    }));
    (0, mocha_1.it)("Parse Array inside Map", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            type: "Map",
            value: [
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("test")
                    },
                    value: {
                        type: "Array",
                        value: [
                            { type: "ByteString", value: _1.NeonParser.strToBase64("abc") },
                            { type: "ByteString", value: _1.NeonParser.strToBase64("def") },
                            { type: "ByteString", value: _1.NeonParser.strToBase64("ghi") },
                        ]
                    }
                },
                {
                    key: {
                        type: "ByteString",
                        value: _1.NeonParser.strToBase64("neo")
                    },
                    value: {
                        type: "Integer",
                        value: "123"
                    }
                },
            ]
        };
        const map = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(map, { test: ['abc', 'def', 'ghi'], neo: 123 });
        const mapWithConfig = _1.NeonParser.parseRpcResponse(rpcResponse, {
            type: 'Map',
            genericKey: { type: 'String' },
            genericItem: { type: 'Any', union: [{ type: 'Integer' }, { type: 'Array', generic: { type: 'ByteArray' } }] }
        });
        assert.deepEqual(mapWithConfig, { test: ['616263', '646566', '676869'], neo: 123 });
    }));
    (0, mocha_1.it)("Parse Map inside Array", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponseArray = {
            type: "Array",
            value: [
                { type: "ByteString", value: _1.NeonParser.strToBase64("abc") },
                { type: "Map", value: [
                        {
                            key: { type: 'ByteString', value: _1.NeonParser.strToBase64("neon") },
                            value: { type: 'ByteString', value: _1.NeonParser.strToBase64("parser") },
                        },
                        {
                            key: { type: 'ByteString', value: _1.NeonParser.strToBase64("unit") },
                            value: { type: 'ByteString', value: _1.NeonParser.strToBase64("test") },
                        },
                    ] },
                { type: "ByteString", value: _1.NeonParser.strToBase64("def") },
            ]
        };
        let array = _1.NeonParser.parseRpcResponse(rpcResponseArray);
        assert.deepEqual(array, ['abc', { neon: 'parser', unit: 'test' }, 'def']);
        array = _1.NeonParser.parseRpcResponse(rpcResponseArray, {
            type: 'Array',
            generic: { type: 'Any', union: [{ type: 'String' }, { type: 'Map', genericKey: { type: 'String' }, genericItem: { type: 'ByteArray' } }] }
        });
        assert.deepEqual(array, ['abc', { neon: '706172736572', unit: '74657374' }, 'def']);
    }));
    (0, mocha_1.it)("Parse raw when UTF8 parsing fails", () => __awaiter(this, void 0, void 0, function* () {
        const rpcResponse = {
            "type": "Map",
            "value": [
                {
                    "key": {
                        "type": "ByteString",
                        "value": "bmFtZQ=="
                    },
                    "value": {
                        "type": "ByteString",
                        "value": "TElaQVJE"
                    }
                }, {
                    "key": {
                        "type": "ByteString",
                        "value": "c2VlZA=="
                    },
                    "value": {
                        "type": "ByteString",
                        "value": "dphNnS0kGxelyR4Q8ntrbA=="
                    }
                }
            ]
        };
        const parsed = _1.NeonParser.parseRpcResponse(rpcResponse);
        assert.deepEqual(parsed, { name: 'LIZARD', seed: 'dphNnS0kGxelyR4Q8ntrbA==' });
    }));
});
(0, mocha_1.describe)("RPC Arguments Parser Tests", function () {
    (0, mocha_1.it)("parses numbers", () => __awaiter(this, void 0, void 0, function* () {
        let numberArg = _1.NeonParser.formatRpcArgument(0);
        let expectedResult = { type: 'Integer', value: '0' };
        assert.deepStrictEqual(numberArg, expectedResult);
        numberArg = _1.NeonParser.formatRpcArgument(1);
        expectedResult = { type: 'Integer', value: '1' };
        assert.deepStrictEqual(numberArg, expectedResult);
        numberArg = _1.NeonParser.formatRpcArgument(123);
        expectedResult = { type: 'Integer', value: '123' };
        assert.deepStrictEqual(numberArg, expectedResult);
        numberArg = _1.NeonParser.formatRpcArgument(-10);
        expectedResult = { type: 'Integer', value: '-10' };
        assert.deepStrictEqual(numberArg, expectedResult);
    }));
    (0, mocha_1.it)("parses boolean", () => __awaiter(this, void 0, void 0, function* () {
        let booleanArg = _1.NeonParser.formatRpcArgument(true);
        let expectedResult = { type: 'Boolean', value: true };
        assert.deepStrictEqual(booleanArg, expectedResult);
        booleanArg = _1.NeonParser.formatRpcArgument(false);
        expectedResult = { type: 'Boolean', value: false };
        assert.deepStrictEqual(booleanArg, expectedResult);
    }));
    (0, mocha_1.it)("parses string", () => __awaiter(this, void 0, void 0, function* () {
        let stringArg = _1.NeonParser.formatRpcArgument('unit test');
        let expectedResult = { type: 'String', value: 'unit test' };
        assert.deepStrictEqual(stringArg, expectedResult);
        stringArg = _1.NeonParser.formatRpcArgument('1234');
        expectedResult = { type: 'String', value: '1234' };
        assert.deepStrictEqual(stringArg, expectedResult);
    }));
    (0, mocha_1.it)("parses ByteArray", () => __awaiter(this, void 0, void 0, function* () {
        let byteArrayValue = _1.NeonParser.strToHexstring('unit test');
        let byteArrayArg = _1.NeonParser.formatRpcArgument(byteArrayValue, { type: 'ByteArray' });
        let expectedResult = { type: 'ByteArray', value: byteArrayValue };
        assert.deepStrictEqual(byteArrayArg, expectedResult);
        byteArrayValue = _1.NeonParser.strToHexstring('another value 1234');
        byteArrayArg = _1.NeonParser.formatRpcArgument(byteArrayValue, { type: 'ByteArray' });
        expectedResult = { type: 'ByteArray', value: byteArrayValue };
        assert.deepStrictEqual(byteArrayArg, expectedResult);
        // Not passing a config will endup returning a String instead of a ByteArray
        byteArrayArg = _1.NeonParser.formatRpcArgument(byteArrayValue);
        expectedResult = { type: 'ByteArray', value: byteArrayValue };
        assert.notDeepStrictEqual(byteArrayArg, expectedResult);
    }));
    (0, mocha_1.it)("parses Hash160", () => __awaiter(this, void 0, void 0, function* () {
        let hash160Arg = _1.NeonParser.formatRpcArgument('0xd2a4cff31913016155e38e474a2c06d08be276cf', { type: 'Hash160' });
        let expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' };
        assert.deepStrictEqual(hash160Arg, expectedResult);
        hash160Arg = _1.NeonParser.formatRpcArgument('d2a4cff31913016155e38e474a2c06d08be276cf', { type: 'Hash160' });
        expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' };
        assert.deepStrictEqual(hash160Arg, expectedResult);
        // Not passing a config will endup returning a String instead of a Hash160
        hash160Arg = _1.NeonParser.formatRpcArgument('d2a4cff31913016155e38e474a2c06d08be276cf');
        expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' };
        assert.notDeepStrictEqual(hash160Arg, expectedResult);
    }));
    (0, mocha_1.it)("parses Hash256", () => __awaiter(this, void 0, void 0, function* () {
        let hash256Arg = _1.NeonParser.formatRpcArgument('0xd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be', { type: 'Hash256' });
        let expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' };
        assert.deepStrictEqual(hash256Arg, expectedResult);
        hash256Arg = _1.NeonParser.formatRpcArgument('d2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be', { type: 'Hash256' });
        expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' };
        assert.deepStrictEqual(hash256Arg, expectedResult);
        // Not passing a config will endup returning a String instead of a Hash256
        hash256Arg = _1.NeonParser.formatRpcArgument('d2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be');
        expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' };
        assert.notDeepStrictEqual(hash256Arg, expectedResult);
    }));
    (0, mocha_1.it)("parses PublicKey", () => __awaiter(this, void 0, void 0, function* () {
        let publicKeyArg = _1.NeonParser.formatRpcArgument('035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a', { type: 'PublicKey' });
        const expectedResult = { type: 'PublicKey', value: '035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a' };
        assert.deepStrictEqual(publicKeyArg, expectedResult);
        publicKeyArg = _1.NeonParser.formatRpcArgument('035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a');
        assert.notDeepStrictEqual(publicKeyArg, expectedResult);
    }));
    (0, mocha_1.it)("parses array of primitive types", () => __awaiter(this, void 0, void 0, function* () {
        let arrayArg = _1.NeonParser.formatRpcArgument([1, 2, 3], { type: "Array", generic: { type: "Integer" } });
        let arrayArgNoConfig = _1.NeonParser.formatRpcArgument([1, 2, 3]);
        let expectedResult = { type: 'Array', value: [
                { type: 'Integer', value: '1' },
                { type: 'Integer', value: '2' },
                { type: 'Integer', value: '3' },
            ] };
        assert.deepStrictEqual(arrayArg, expectedResult);
        assert.deepStrictEqual(arrayArg, arrayArgNoConfig);
        arrayArg = _1.NeonParser.formatRpcArgument([true, false], { type: "Array", generic: { type: "Boolean" } });
        arrayArgNoConfig = _1.NeonParser.formatRpcArgument([true, false]);
        expectedResult = { type: 'Array', value: [
                { type: 'Boolean', value: true },
                { type: 'Boolean', value: false },
            ] };
        assert.deepStrictEqual(arrayArg, expectedResult);
        assert.deepStrictEqual(arrayArg, arrayArgNoConfig);
        arrayArg = _1.NeonParser.formatRpcArgument(['unit', 'test'], { type: "Array", generic: { type: "String" } });
        arrayArgNoConfig = _1.NeonParser.formatRpcArgument(['unit', 'test']);
        expectedResult = { type: 'Array', value: [
                { type: 'String', value: 'unit' },
                { type: 'String', value: 'test' },
            ] };
        assert.deepStrictEqual(arrayArg, expectedResult);
        assert.deepStrictEqual(arrayArg, arrayArgNoConfig);
        arrayArg = _1.NeonParser.formatRpcArgument(['756e6974', '74657374'], { type: "Array", generic: { type: "ByteArray" } });
        arrayArgNoConfig = _1.NeonParser.formatRpcArgument(['unit', 'test']);
        expectedResult = { type: 'Array', value: [
                { type: 'ByteArray', value: '756e6974' },
                { type: 'ByteArray', value: '74657374' },
            ] };
        assert.deepStrictEqual(arrayArg, expectedResult);
        assert.notDeepStrictEqual(arrayArg, arrayArgNoConfig);
    }));
    (0, mocha_1.it)("parses map of primitive types", () => __awaiter(this, void 0, void 0, function* () {
        let mapArg = _1.NeonParser.formatRpcArgument({}, { type: "Map" });
        let mapArgNoConfig = _1.NeonParser.formatRpcArgument({});
        let expectedResult = {
            "type": "Map",
            "value": []
        };
        assert.deepStrictEqual(mapArg, expectedResult);
        assert.deepStrictEqual(mapArg, mapArgNoConfig);
        mapArg = _1.NeonParser.formatRpcArgument({ unit: 'test', neon: 'parser', neo3: 'parser' }, { type: "Map", genericKey: { type: "String" }, genericItem: { type: "String" } });
        mapArgNoConfig = _1.NeonParser.formatRpcArgument({ unit: 'test', neon: 'parser', neo3: 'parser' });
        expectedResult = {
            "type": "Map",
            "value": [
                {
                    "key": {
                        "type": "String",
                        "value": "unit"
                    },
                    "value": {
                        "type": "String",
                        "value": "test"
                    }
                },
                {
                    "key": {
                        "type": "String",
                        "value": "neon"
                    },
                    "value": {
                        "type": "String",
                        "value": "parser"
                    }
                },
                {
                    "key": {
                        "type": "String",
                        "value": "neo3"
                    },
                    "value": {
                        "type": "String",
                        "value": "parser"
                    }
                }
            ]
        };
        assert.deepStrictEqual(mapArg, expectedResult);
        assert.deepStrictEqual(mapArg, mapArgNoConfig);
        mapArg = _1.NeonParser.formatRpcArgument({ true: true, false: false }, { type: "Map", genericKey: { type: "Boolean" }, genericItem: { type: "Boolean" } });
        mapArgNoConfig = _1.NeonParser.formatRpcArgument({ true: true, false: false });
        expectedResult = {
            "type": "Map",
            "value": [
                {
                    "key": {
                        "type": "Boolean",
                        "value": true
                    },
                    "value": {
                        "type": "Boolean",
                        "value": true
                    }
                },
                {
                    "key": {
                        "type": "Boolean",
                        "value": false
                    },
                    "value": {
                        "type": "Boolean",
                        "value": false
                    }
                }
            ]
        };
        assert.deepStrictEqual(mapArg, expectedResult);
        assert.notDeepStrictEqual(mapArg, mapArgNoConfig);
        mapArg = _1.NeonParser.formatRpcArgument({ 98765: 12345 }, { type: "Map", genericKey: { type: "Integer" }, genericItem: { type: "Integer" } });
        mapArgNoConfig = _1.NeonParser.formatRpcArgument({ 98765: 12345 });
        expectedResult = {
            "type": "Map",
            "value": [
                {
                    "key": {
                        "type": "Integer",
                        "value": "98765"
                    },
                    "value": {
                        "type": "Integer",
                        "value": '12345'
                    }
                }
            ]
        };
        assert.deepStrictEqual(mapArg, expectedResult);
        assert.notDeepStrictEqual(mapArg, mapArgNoConfig);
        mapArg = _1.NeonParser.formatRpcArgument({ '627974654172726179': _1.NeonParser.strToHexstring('unit test') }, { type: "Map", genericKey: { type: "ByteArray" }, genericItem: { type: "ByteArray" } });
        mapArgNoConfig = _1.NeonParser.formatRpcArgument({ '627974654172726179': _1.NeonParser.strToHexstring('unit test') });
        expectedResult = {
            "type": "Map",
            "value": [
                {
                    "key": {
                        "type": "ByteArray",
                        "value": "627974654172726179"
                    },
                    "value": {
                        "type": "ByteArray",
                        "value": "756e69742074657374"
                    }
                }
            ]
        };
        assert.deepStrictEqual(mapArg, expectedResult);
        assert.notDeepStrictEqual(mapArg, mapArgNoConfig);
    }));
    (0, mocha_1.it)("parses Any", () => __awaiter(this, void 0, void 0, function* () {
        let anyArg = _1.NeonParser.formatRpcArgument(12345, { type: "Any" });
        let expectedResult = {
            "type": "Integer",
            "value": "12345"
        };
        assert.deepStrictEqual(anyArg, expectedResult);
        anyArg = _1.NeonParser.formatRpcArgument(false, { type: "Any" });
        expectedResult = {
            "type": "Boolean",
            "value": false
        };
        assert.deepStrictEqual(anyArg, expectedResult);
        anyArg = _1.NeonParser.formatRpcArgument('unit test', { type: "Any" });
        expectedResult = {
            "type": "String",
            "value": 'unit test'
        };
        assert.deepStrictEqual(anyArg, expectedResult);
        anyArg = _1.NeonParser.formatRpcArgument([1, 2], { type: "Any" });
        expectedResult = {
            "type": "Array",
            "value": [
                { "type": "Integer", "value": "1" },
                { "type": "Integer", "value": "2" }
            ]
        };
        assert.deepStrictEqual(anyArg, expectedResult);
        anyArg = _1.NeonParser.formatRpcArgument(null, { type: "Any" });
        expectedResult = { "type": "Any", value: null };
        assert.deepStrictEqual(anyArg, expectedResult);
    }));
});
