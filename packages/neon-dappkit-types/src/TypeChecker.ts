import {
  AnyArgType,
  BooleanArgType,
  IntegerArgType,
  ArrayResponseArgType,
  MapResponseArgType,
  ByteStringArgType,
  InteropInterfaceArgType,
  PointerArgType,
  BufferArgType,
  StructArgType,
  RpcResponseStackItem,
} from './Neo3Invoker'

const TypeChecker = {
  isStackTypeAny(item: any): item is AnyArgType {
    return typeof item === 'object' && item.type === 'Any'
  },
  isStackTypeBoolean(item: any): item is BooleanArgType {
    return typeof item === 'object' && item.type === 'Boolean' && typeof item.value === 'boolean'
  },
  isStackTypeInteger(item: any): item is IntegerArgType {
    return typeof item === 'object' && item.type === 'Integer' && typeof item.value === 'string'
  },
  isStackTypeArray(item: any): item is ArrayResponseArgType {
    return (
      typeof item === 'object' &&
      item.type === 'Array' &&
      Array.isArray(item.value) &&
      item.value.every((i: any) => TypeChecker.isRpcResponseStackItem(i))
    )
  },
  isStackTypeMap(item: any): item is MapResponseArgType {
    return (
      typeof item === 'object' &&
      item.type === 'Map' &&
      Array.isArray(item.value) &&
      item.value.every(
        (i: any) => TypeChecker.isRpcResponseStackItem(i.key) && TypeChecker.isRpcResponseStackItem(i.value),
      )
    )
  },
  isStackTypeByteString(item: any): item is ByteStringArgType {
    return typeof item === 'object' && item.type === 'ByteString' && typeof item.value === 'string'
  },
  isStackTypeInteropInterface(item: any): item is InteropInterfaceArgType {
    return (
      typeof item === 'object' &&
      item.type === 'InteropInterface' &&
      typeof item.interface === 'string' &&
      typeof item.id === 'string'
    )
  },
  isStackTypePointer(item: any): item is PointerArgType {
    return typeof item === 'object' && item.type === 'Pointer' && typeof item.value === 'string'
  },
  isStackTypeBuffer(item: any): item is BufferArgType {
    return typeof item === 'object' && item.type === 'Buffer' && typeof item.value === 'string'
  },
  isStackTypeStruct(item: any): item is StructArgType {
    return (
      typeof item === 'object' &&
      item.type === 'Struct' &&
      Array.isArray(item.value) &&
      item.value.every((i: any) => TypeChecker.isRpcResponseStackItem(i))
    )
  },
  isRpcResponseStackItem(item: any): item is RpcResponseStackItem {
    return (
      TypeChecker.isStackTypeAny(item) ||
      TypeChecker.isStackTypeBoolean(item) ||
      TypeChecker.isStackTypeInteger(item) ||
      TypeChecker.isStackTypeArray(item) ||
      TypeChecker.isStackTypeMap(item) ||
      TypeChecker.isStackTypeByteString(item) ||
      TypeChecker.isStackTypeInteropInterface(item) ||
      TypeChecker.isStackTypePointer(item) ||
      TypeChecker.isStackTypeBuffer(item) ||
      TypeChecker.isStackTypeStruct(item)
    )
  },
}

export { TypeChecker }
