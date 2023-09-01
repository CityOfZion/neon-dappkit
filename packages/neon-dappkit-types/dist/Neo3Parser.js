"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HINT_TYPES = exports.ABI_TYPES = exports.INTERNAL_TYPES = void 0;
exports.INTERNAL_TYPES = {
    ARRAY: 'Array',
    BYTESTRING: 'ByteString',
    BUFFER: 'Buffer',
    INTEGER: 'Integer',
    INTEROPINTERFACE: 'InteropInterface',
    BOOLEAN: 'Boolean',
    MAP: 'Map',
    NULL: 'Null',
    POINTER: 'Pointer',
    STRUCT: 'Struct',
};
exports.ABI_TYPES = {
    ANY: { name: 'Any' },
    SIGNATURE: { name: 'Signature', internal: exports.INTERNAL_TYPES.BYTESTRING },
    BOOLEAN: { name: 'Boolean', internal: exports.INTERNAL_TYPES.BOOLEAN },
    INTEGER: { name: 'Integer', internal: exports.INTERNAL_TYPES.INTEGER },
    HASH160: { name: 'Hash160', internal: exports.INTERNAL_TYPES.BYTESTRING },
    HASH256: { name: 'Hash256', internal: exports.INTERNAL_TYPES.BYTESTRING },
    BYTEARRAY: { name: 'ByteArray', internal: exports.INTERNAL_TYPES.BYTESTRING },
    PUBLICKEY: { name: 'PublicKey', internal: exports.INTERNAL_TYPES.BYTESTRING },
    STRING: { name: 'String', internal: exports.INTERNAL_TYPES.BYTESTRING },
    ARRAY: { name: 'Array', internal: exports.INTERNAL_TYPES.ARRAY },
    MAP: { name: 'Map', internal: exports.INTERNAL_TYPES.MAP },
    INTEROPINTERFACE: { name: 'InteropInterface', internal: exports.INTERNAL_TYPES.INTEROPINTERFACE },
    VOID: { name: 'Void', internal: exports.INTERNAL_TYPES.NULL },
};
exports.HINT_TYPES = {
    ADDRESS: { name: 'Address', abi: exports.ABI_TYPES.STRING },
    PUBLICKEY: { name: 'PublicKey', abi: exports.ABI_TYPES.PUBLICKEY },
    SCRIPTHASH: { name: 'ScriptHash', abi: exports.ABI_TYPES.HASH160 },
    SCRIPTHASHLITTLEENDING: { name: 'ScriptHashLittleEndian', abi: exports.ABI_TYPES.HASH160 },
    BLOCKHASH: { name: 'BlockHash', abi: exports.ABI_TYPES.HASH256 },
    TRANSACTIONID: { name: 'TransactionId', abi: exports.ABI_TYPES.HASH256 },
    STORAGECONTEXT: { name: 'StorageContext', abi: exports.ABI_TYPES.INTEROPINTERFACE },
    ITERATOR: { name: 'Iterator', abi: exports.ABI_TYPES.INTEROPINTERFACE },
};
