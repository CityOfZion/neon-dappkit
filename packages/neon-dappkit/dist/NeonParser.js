"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeonParser = void 0;
const neon_dappkit_types_1 = require("@cityofzion/neon-dappkit-types");
const neon_js_1 = require("@cityofzion/neon-js");
const NeonParser = {
    abToHex(arr) {
        return neon_js_1.u.ab2hexstring(arr);
    },
    abToStr(buf) {
        return neon_js_1.u.ab2str(buf);
    },
    accountInputToAddress(input) {
        return new neon_js_1.wallet.Account(input).address;
    },
    accountInputToScripthash(input) {
        return new neon_js_1.wallet.Account(input).scriptHash;
    },
    base64ToHex: (input) => {
        return neon_js_1.u.base642hex(input);
    },
    base64ToUtf8(input) {
        return neon_js_1.u.base642utf8(input);
    },
    hexToBase64(input) {
        return neon_js_1.u.hex2base64(input);
    },
    hexToAb(str) {
        return neon_js_1.u.hexstring2ab(str);
    },
    hexToStr(hexstring) {
        return neon_js_1.u.hexstring2str(hexstring);
    },
    intToHex(num) {
        return neon_js_1.u.int2hex(num);
    },
    numToHex(num, size, littleEndian) {
        return neon_js_1.u.num2hexstring(num, size, littleEndian);
    },
    numToVarInt(num) {
        return neon_js_1.u.num2VarInt(num);
    },
    reverseHex(input) {
        return neon_js_1.u.reverseHex(input);
    },
    strToAb(str) {
        return neon_js_1.u.str2ab(str);
    },
    strToBase64: (input) => {
        return neon_js_1.u.hex2base64(neon_js_1.u.str2hexstring(input));
    },
    strToHex(str) {
        return neon_js_1.u.str2hexstring(str);
    },
    utf8ToBase64(input) {
        return neon_js_1.u.utf82base64(input);
    },
    asciiToBase64(input) {
        return neon_js_1.u.HexString.fromAscii(input).toBase64();
    },
    parseRpcResponse(field, parseConfig) {
        parseConfig = verifyParseConfigUnion(field, parseConfig);
        switch (field.type) {
            case 'ByteString':
                return parseByteString(field, parseConfig);
            case 'Integer':
                return parseInt(field.value);
            case 'Struct':
            case 'Array':
                return field.value.map((f) => {
                    return NeonParser.parseRpcResponse(f, parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.generic);
                });
            case 'Map': {
                const object = {};
                const mapResponseArg = field;
                mapResponseArg.value.forEach((f) => {
                    const key = NeonParser.parseRpcResponse(f.key, parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.genericKey);
                    object[key] = NeonParser.parseRpcResponse(f.value, parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.genericItem);
                });
                return object;
            }
            // Another method should take care of this parse
            case 'InteropInterface':
                return;
            default:
                try {
                    return JSON.parse(field.value);
                }
                catch (e) {
                    return field.value;
                }
        }
    },
    formatRpcArgument(arg, parseConfig) {
        const argType = parseConfig && parseConfig.type !== 'Any' ? parseConfig.type : typeof arg;
        switch (argType) {
            case 'ByteArray': {
                return { type: 'ByteArray', value: arg };
            }
            case 'Hash160': {
                return neon_js_1.sc.ContractParam.hash160(arg).toJson();
            }
            case 'Hash256': {
                return neon_js_1.sc.ContractParam.hash256(arg).toJson();
            }
            case 'PublicKey': {
                return neon_js_1.sc.ContractParam.publicKey(arg).toJson();
            }
            case 'String':
            case 'string': {
                return neon_js_1.sc.ContractParam.string(arg).toJson();
            }
            case 'Integer':
            case 'number': {
                return neon_js_1.sc.ContractParam.integer(arg).toJson();
            }
            case 'Boolean':
            case 'boolean': {
                return neon_js_1.sc.ContractParam.boolean(typeof arg === 'string' ? arg === 'true' : arg).toJson();
            }
            case 'Array':
            case 'Map':
            case 'object': {
                if (Array.isArray(arg)) {
                    parseConfig = parseConfig;
                    const typeHints = parseConfig && parseConfig.generic ? parseConfig.generic : undefined;
                    return { type: 'Array', value: arg.map((arrayArg) => NeonParser.formatRpcArgument(arrayArg, typeHints)) };
                }
                else if (arg !== null) {
                    const mapPairs = Object.keys(arg).map((key) => {
                        parseConfig = parseConfig;
                        const configKey = (parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.genericKey) || undefined;
                        const configItem = (parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.genericItem) || undefined;
                        return {
                            key: NeonParser.formatRpcArgument(key, configKey),
                            value: NeonParser.formatRpcArgument(arg[key], configItem),
                        };
                    });
                    return { type: 'Map', value: mapPairs };
                }
                // If the variable 'arg' is null, the default case of the switch case should be returned.
            }
            /* eslint "no-fallthrough": "off" */
            default: {
                return neon_js_1.sc.ContractParam.any().toJson();
            }
        }
    },
};
exports.NeonParser = NeonParser;
function verifyParseConfigUnion(field, parseConfig) {
    if ((parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.type) === 'Any' && (parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.union)) {
        const configs = parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.union.filter((config) => {
            var _a;
            const abiType = neon_dappkit_types_1.ABI_TYPES[config.type.toUpperCase()];
            return ((_a = abiType.internal) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === field.type.toUpperCase();
        });
        if (configs.length > 0) {
            if (field.type === 'Array' && configs[0].type === 'Array') {
                return { type: 'Array', generic: configs[0].generic };
            }
            else if (field.type === 'Map' && configs[0].type === 'Map') {
                return { type: 'Map', genericKey: configs[0].genericKey, genericItem: configs[0].genericItem };
            }
            else if (field.type === 'ByteString') {
                if (configs.length === 1) {
                    return configs[0];
                }
                else {
                    return { type: 'String' };
                }
            }
            else {
                return configs[0];
            }
        }
        return undefined;
    }
    return parseConfig;
}
function parseByteString({ value }, parseConfig) {
    const valueToParse = value;
    const rawValue = NeonParser.base64ToHex(valueToParse);
    if ((parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.type) === neon_dappkit_types_1.ABI_TYPES.BYTEARRAY.name || (parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.type) === neon_dappkit_types_1.ABI_TYPES.PUBLICKEY.name) {
        return rawValue;
    }
    if ((parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.type) === neon_dappkit_types_1.ABI_TYPES.HASH160.name) {
        if (rawValue.length !== 40)
            throw new TypeError(`${rawValue} is not a ${neon_dappkit_types_1.ABI_TYPES.HASH160.name}`);
        return (parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.hint) === neon_dappkit_types_1.HINT_TYPES.SCRIPTHASHLITTLEENDING.name
            ? rawValue
            : `0x${NeonParser.reverseHex(rawValue)}`;
    }
    if ((parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.type) === neon_dappkit_types_1.ABI_TYPES.HASH256.name) {
        if (rawValue.length !== 64)
            throw new TypeError(`${rawValue} is not a ${neon_dappkit_types_1.ABI_TYPES.HASH256.name}`);
        return `0x${NeonParser.reverseHex(rawValue)}`;
    }
    let stringValue;
    try {
        stringValue = NeonParser.base64ToUtf8(valueToParse);
    }
    catch (e) {
        return valueToParse;
    }
    if ((parseConfig === null || parseConfig === void 0 ? void 0 : parseConfig.hint) === neon_dappkit_types_1.HINT_TYPES.ADDRESS.name &&
        (stringValue.length !== 34 ||
            (!stringValue.startsWith('N') && !stringValue.startsWith('A')) ||
            !stringValue.match(/^[A-HJ-NP-Za-km-z1-9]*$/)) // check base58 chars
    ) {
        throw new TypeError(`${valueToParse} is not an ${neon_dappkit_types_1.HINT_TYPES.ADDRESS.name}`);
    }
    return stringValue;
}
