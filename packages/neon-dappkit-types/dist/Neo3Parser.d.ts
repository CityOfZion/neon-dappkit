import { Arg, RpcResponseStackItem } from './Neo3Invoker';
export interface Neo3Parser {
    /**
     * Converts an ArrayBuffer to an ASCII string.
     * @param buf
     *
     * @example
     * const encoder = new TextEncoder()
     * const arrayBuffer = encoder.encode('unit test')
     * console.log(Neo3Parser.abToStr(arrayBuffer))
     * // unit test
     */
    abToStr: (buf: ArrayBuffer | ArrayLike<number>) => string;
    /**
     * Converts an ASCII string into an arrayBuffer.
     * @param str
     *
     * @example
     * const arrayBuffer = Neo3Parser.strToAb('unit test')
     * console.log(arrayBuffer)
     * // Uint8Array(9) [117, 110, 105, 116, 32, 116, 101, 115, 116]
     */
    strToAb: (str: string) => Uint8Array;
    /**
     * Converts a hexstring into an arrayBuffer.
     * @param str
     *
     * @example
     * const arrayBuffer = Neo3Parser.hexToAb('756e69742074657374')
     * console.log(arrayBuffer)
     * // Uint8Array(9) [117, 110, 105, 116, 32, 116, 101, 115, 116]
     */
    hexToAb: (str: string) => Uint8Array;
    /**
     * Converts an arraybuffer to hexstring.
     * @param arr
     *
     * @example
     * const encoder = new TextEncoder()
     * const arrayBuffer = encoder.encode('unit test')
     * console.log(Neo3Parser.abToHex(arrayBuffer))
     * // 756e69742074657374
     */
    abToHex: (arr: ArrayBuffer | ArrayLike<number>) => string;
    /**
     * Converts an ascii string to hexstring.
     * @param str
     *
     * @example
     * const hexString = Neo3Parser.strToHex('unit test')
     * console.log(hexString)
     * // 756e69742074657374
     */
    strToHex: (str: string) => string;
    /**
     * Converts a hexstring to ascii string.
     * @param hexstring
     *
     * @example
     * const str = Neo3Parser.hexToStr('756e69742074657374')
     * console.log(str)
     * // unit test
     */
    hexToStr: (hexstring: string) => string;
    /**
     * convert an integer to big endian hex and add leading zeros.
     * @param num
     *
     * @example
     * const hexString = Neo3Parser.intToHex(512)
     * console.log(hexString)
     * // 0200
     */
    intToHex: (num: number) => string;
    /**
     * Converts a number to a big endian hexstring of a suitable size, optionally little endian
     * @param num - a positive integer.
     * @param size - the required size in bytes, eg 1 for Uint8, 2 for Uint16. Defaults to 1.
     * @param littleEndian - encode the hex in little endian form
     *
     * @example
     * console.log(Neo3Parser.numToHex(513))
     * // 01
     *
     * console.log(Neo3Parser.numToHex(513, 2))
     * // 0201
     *
     * console.log(Neo3Parser.numToHex(513, 2, true))
     * // 0102
     */
    numToHex: (num: number, size?: number, littleEndian?: boolean) => string;
    /**
     * Converts a number to a variable length Int. Used for array length header
     * @param num
     *
     * @example
     * console.log(Neo3Parser.numToVarInt(16))
     * // 10
     *
     * console.log(Neo3Parser.numToVarInt(512))
     * // fd0002
     *
     * console.log(Neo3Parser.numToVarInt(65535))
     * // fdffff
     *
     * console.log(Neo3Parser.numToVarInt(4294967295))
     * // feffffffff
     *
     * console.log(Neo3Parser.numToVarInt(4294967296))
     * // ff0000000001000000
     */
    numToVarInt: (num: number) => string;
    /**
     * Converts a hex string to a base64 string.
     * @param input
     *
     * @example
     * const base64String = Neo3Parser.hexToBase64('756e69742074657374')
     * console.log(base64String)
     * // dW5pdCB0ZXN0
     */
    hexToBase64: (input: string) => string;
    /**
     * Converts a base64 string to hex
     * @param input
     *
     * @example
     * const hexString = Neo3Parser.base64ToHex('dW5pdCB0ZXN0')
     * console.log(base64String)
     * // 756e69742074657374
     */
    base64ToHex: (input: string) => string;
    /**
     * Converts an utf8 string to a base64 string.
     * @param input
     *
     * @example
     * const base64String = Neo3Parser.utf8ToBase64('unit test')
     * console.log(base64String)
     * // dW5pdCB0ZXN0
     */
    utf8ToBase64: (input: string) => string;
    /**
     * Converts an ascii string to a base64 string.
     * @param input
     *
     * @example
     * const base64String = Neo3Parser.asciiToBase64('unit test')
     * console.log(base64String)
     * // dW5pdCB0ZXN0
     */
    asciiToBase64: (input: string) => string;
    /**
     * Converts a base64 string to utf8.
     * @param input
     *
     * @example
     * const utf8String = Neo3Parser.base64ToUtf8('VVRGLTggU3RyaW5nIMOhw6PDoMOn')
     * console.log(utf8String)
     * // UTF-8 String áãàç
     */
    base64ToUtf8: (input: string) => string;
    /**
     * Converts an account input such Address, PublicKey or ScriptHash to an ScriptHash.
     * @param input
     *
     * @example
     * const scriptHash = Neo3Parser.accountInputToScripthash('NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs')
     * console.log(scriptHash)
     * // a5de523ae9d99be784a536e9412b7a3cbe049e1a
     *
     * @example
     * const scriptHash = Neo3Parser.accountInputToScripthash('03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c')
     * console.log(scriptHash)
     * // a5de523ae9d99be784a536e9412b7a3cbe049e1a
     */
    accountInputToScripthash: (input: string) => string;
    /**
     * Converts a string to base64
     * @param input The string to convert
     *
     * @example
     * const base64String = Neo3Parser.strToBase64('unit test')
     * console.log(base64String)
     * // dW5pdCB0ZXN0
     */
    strToBase64: (input: string) => string;
    /**
     * Converts an account input such Address, PublicKey or ScriptHash to an Address.
     * @param input
     *
     * @example
     * const address = Neo3Parser.accountInputToAddress('a5de523ae9d99be784a536e9412b7a3cbe049e1a')
     * console.log(address)
     * // NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs
     *
     * @example
     * const address = Neo3Parser.accountInputToAddress('03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c')
     * console.log(address)
     * // NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs
     */
    accountInputToAddress: (input: string) => string;
    /**
     * Reverses a HEX string, treating 2 chars as a byte.
     * @param input
     *
     * @example
     * const reversedHexString = Neo3Parser.reverseHex('abcdef')
     * console.log(reversedHexString)
     * // efcdab
     */
    reverseHex: (input: string) => string;
    /**
     * Formats the response from the RPC server to an easier to use format for dapp developers
     * @param input The response from the RPC server
     *
     * @example
     * const stringResponse = {
     *   type: 'ByteString',
     *   value: 'dW5pdCB0ZXN0'
     * }
     * const parsed = Neo3Parser.parseRpcResponse(stringResponse)
     * console.log(parsed)
     * // unit test
     *
     * @example
     * const scriptHashResponse = {
     *   type: 'ByteString',
     *   value: 'YUeato/VwsBLJU84LYTd8vXGfO0='
     * }
     * const parsed = Neo3Parser.parseRpcResponse(scriptHashResponse, { type: 'Hash160' })
     * console.log(parsed)
     * // 0xed7cc6f5f2dd842d384f254bc0c2d58fb69a4761
     *
     * @example
     * const byteArrayResponse = {
     *   type: 'ByteString',
     *   value: 'dW5pdCB0ZXN0'
     * }
     * const parsed = Neo3Parser.parseRpcResponse(bytesResponse, { type: 'ByteArray' })
     * console.log(parsed)
     * // 756e69742074657374
     *
     * @example
     * const integerResponse = {
     *   type: 'Integer',
     *   value: '18'
     * }
     * const parsed = Neo3Parser.parseRpcResponse(integerResponse)
     * console.log(parsed)
     * // 18
     *
     * @example
     * const arrayResponse = {
     *   type: 'Array',
     *   value: [
     *     {
     *       type: 'Integer',
     *       value: '10',
     *     },
     *     {
     *       type: 'Integer',
     *       value: '20',
     *     },
     *     {
     *       type: 'Integer',
     *       value: '30',
     *     },
     *   ]
     * }
     * const parsed = Neo3Parser.parseRpcResponse(arrayResponse, { type: 'Array', generic: { type: 'Integer' } })
     * console.log(parsed)
     * // [10, 20, 30]
     *
     * @example
     * const mapResponse = {
     *   type: 'Map',
     *   value: [
     *     {
     *       key: {
     *         type: 'ByteString',
     *         value: 'dW5pdA=='
     *       },
     *       value: {
     *         type: 'ByteString',
     *         value: 'dGVzdA=='
     *     },
     *     {
     *       key: {
     *         type: 'ByteString',
     *         value: 'bmVvMw=='
     *       },
     *       value: {
     *         type: 'ByteString',
     *         value: 'cGFyc2Vy'
     *     },
     *   ]
     * }
     * const parsed = Neo3Parser.parseRpcResponse(mapResponse, { type: 'Map', genericKey: { type: 'String' }, genericItem: { type: 'String' } })
     * console.log(parsed)
     * // { unit: 'test', neo3: 'parser' }
     */
    parseRpcResponse: (field: RpcResponseStackItem, parseConfig?: ParseConfig) => any;
    /**
     * Formats the argument that will be sent to the RPC server
     * @param arg the argument that will be formatted
     * @param parseConfig how to format the argument
     *
     * @example
     * const formattedNumber = Neo3Parser.formatRpcArgument(123)
     * console.log(formattedNumber)
     * // { type: 'Integer', value: '123' }
     *
     * @example
     * const formattedBoolean = Neo3Parser.formatRpcArgument(true)
     * console.log(formattedBoolean)
     * // { type: 'Boolean', value: true }
     *
     * @example
     * const formattedString = Neo3Parser.formatRpcArgument('unit test')
     * console.log(formmatedString)
     * // { type: 'String', value: 'unit test' }
     *
     * @example
     * const formattedByteArray = Neo3Parser.formatRpcArgument('756e69742074657374')
     * console.log(formattedByteArray)
     * // { type: 'ByteArray', value: '756e69742074657374' }
     *
     * @example
     * const formattedHash160 = Neo3Parser.formatRpcArgument('0xd2a4cff31913016155e38e474a2c06d08be276cf', { type: 'Hash160' })
     * console.log(formattedHash160)
     * // { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' }
     *
     * @example
     * const formattedArray = Neo3Parser.formatRpcArgument([1, 2, 3], { type: 'Array', generic: { type: 'Integer' } })
     * console.log(formattedArray)
     * // { type: 'Array', value: [{ type: 'Integer', value: '1' }, { type: 'Integer', value: '2' }, { type: 'Integer', value: '3' }] }
     *
     * @example
     * const formattedMap = Neo3Parser.formatRpcArgument({ unit: 'test', neo3: 'parser' }, { type: 'Map', genericKey: { type: 'String' }, genericItem: { type: 'String' } })
     * console.log(formattedMap)
     * // { type: 'Map', value: [{ key: { type: 'String', value: 'unit' }, value: { type: 'String', value: 'test' } }, { key: { type: 'String', value: 'neo3' }, value: { type: 'String', value: 'parser' } }] }
     */
    formatRpcArgument: (arg: any, parseConfig?: ParseConfig) => Arg;
}
export type AnyConfigArgType = {
    type: 'Any';
    union?: ParseConfig[];
};
export type StringConfigArgType = {
    type: 'String';
    hint?: string;
};
export type BooleanConfigArgType = {
    type: 'Boolean';
};
export type ByteArrayConfigArgType = {
    type: 'ByteArray';
};
export type PublicKeyConfigArgType = {
    type: 'PublicKey';
    hint?: string;
};
export type Hash160ConfigArgType = {
    type: 'Hash160';
    hint?: string;
};
export type Hash256ConfigArgType = {
    type: 'Hash256';
    hint?: string;
};
export type IntegerConfigArgType = {
    type: 'Integer';
};
export type ArrayConfigArgType = {
    type: 'Array';
    generic?: ParseConfig;
};
export type MapConfigArgType = {
    type: 'Map';
    genericKey?: ParseConfig;
    genericItem?: ParseConfig;
};
export type InteropInterfaceConfigArgType = {
    type: 'InteropInterface';
    hint?: string;
};
export type ParseConfig = AnyConfigArgType | StringConfigArgType | BooleanConfigArgType | ByteArrayConfigArgType | PublicKeyConfigArgType | Hash160ConfigArgType | Hash256ConfigArgType | IntegerConfigArgType | ArrayConfigArgType | MapConfigArgType | InteropInterfaceConfigArgType;
export declare const INTERNAL_TYPES: {
    ARRAY: string;
    BYTESTRING: string;
    BUFFER: string;
    INTEGER: string;
    INTEROPINTERFACE: string;
    BOOLEAN: string;
    MAP: string;
    NULL: string;
    POINTER: string;
    STRUCT: string;
};
export declare const ABI_TYPES: {
    ANY: {
        name: string;
    };
    SIGNATURE: {
        name: string;
        internal: string;
    };
    BOOLEAN: {
        name: string;
        internal: string;
    };
    INTEGER: {
        name: string;
        internal: string;
    };
    HASH160: {
        name: string;
        internal: string;
    };
    HASH256: {
        name: string;
        internal: string;
    };
    BYTEARRAY: {
        name: string;
        internal: string;
    };
    PUBLICKEY: {
        name: string;
        internal: string;
    };
    STRING: {
        name: string;
        internal: string;
    };
    ARRAY: {
        name: string;
        internal: string;
    };
    MAP: {
        name: string;
        internal: string;
    };
    INTEROPINTERFACE: {
        name: string;
        internal: string;
    };
    VOID: {
        name: string;
        internal: string;
    };
};
export declare const HINT_TYPES: {
    ADDRESS: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    PUBLICKEY: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    SCRIPTHASH: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    SCRIPTHASHLITTLEENDING: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    BLOCKHASH: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    TRANSACTIONID: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    STORAGECONTEXT: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
    ITERATOR: {
        name: string;
        abi: {
            name: string;
            internal: string;
        };
    };
};
