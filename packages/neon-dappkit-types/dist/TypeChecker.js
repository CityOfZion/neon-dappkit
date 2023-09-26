"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeChecker = void 0;
const TypeChecker = {
    isStackTypeAny(item) {
        return typeof item === 'object' && item.type === 'Any';
    },
    isStackTypeBoolean(item) {
        return typeof item === 'object' && item.type === 'Boolean' && typeof item.value === 'boolean';
    },
    isStackTypeInteger(item) {
        return typeof item === 'object' && item.type === 'Integer' && typeof item.value === 'string';
    },
    isStackTypeArray(item) {
        return (typeof item === 'object' &&
            item.type === 'Array' &&
            Array.isArray(item.value) &&
            item.value.every((i) => TypeChecker.isRpcResponseStackItem(i)));
    },
    isStackTypeMap(item) {
        return (typeof item === 'object' &&
            item.type === 'Map' &&
            Array.isArray(item.value) &&
            item.value.every((i) => TypeChecker.isRpcResponseStackItem(i.key) && TypeChecker.isRpcResponseStackItem(i.value)));
    },
    isStackTypeByteString(item) {
        return typeof item === 'object' && item.type === 'ByteString' && typeof item.value === 'string';
    },
    isStackTypeInteropInterface(item) {
        return (typeof item === 'object' &&
            item.type === 'InteropInterface' &&
            typeof item.interface === 'string' &&
            typeof item.id === 'string');
    },
    isStackTypePointer(item) {
        return typeof item === 'object' && item.type === 'Pointer' && typeof item.value === 'string';
    },
    isStackTypeBuffer(item) {
        return typeof item === 'object' && item.type === 'Buffer' && typeof item.value === 'string';
    },
    isStackTypeStruct(item) {
        return (typeof item === 'object' &&
            item.type === 'Struct' &&
            Array.isArray(item.value) &&
            item.value.every((i) => TypeChecker.isRpcResponseStackItem(i)));
    },
    isRpcResponseStackItem(item) {
        return (TypeChecker.isStackTypeAny(item) ||
            TypeChecker.isStackTypeBoolean(item) ||
            TypeChecker.isStackTypeInteger(item) ||
            TypeChecker.isStackTypeArray(item) ||
            TypeChecker.isStackTypeMap(item) ||
            TypeChecker.isStackTypeByteString(item) ||
            TypeChecker.isStackTypeInteropInterface(item) ||
            TypeChecker.isStackTypePointer(item) ||
            TypeChecker.isStackTypeBuffer(item) ||
            TypeChecker.isStackTypeStruct(item));
    },
};
exports.TypeChecker = TypeChecker;
