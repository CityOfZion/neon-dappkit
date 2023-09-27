import { AnyArgType, BooleanArgType, IntegerArgType, ArrayResponseArgType, MapResponseArgType, ByteStringArgType, InteropInterfaceArgType, PointerArgType, BufferArgType, StructArgType, RpcResponseStackItem } from './Neo3Invoker';
declare const TypeChecker: {
    isStackTypeAny(item: any): item is AnyArgType;
    isStackTypeBoolean(item: any): item is BooleanArgType;
    isStackTypeInteger(item: any): item is IntegerArgType;
    isStackTypeArray(item: any): item is ArrayResponseArgType;
    isStackTypeMap(item: any): item is MapResponseArgType;
    isStackTypeByteString(item: any): item is ByteStringArgType;
    isStackTypeInteropInterface(item: any): item is InteropInterfaceArgType;
    isStackTypePointer(item: any): item is PointerArgType;
    isStackTypeBuffer(item: any): item is BufferArgType;
    isStackTypeStruct(item: any): item is StructArgType;
    isRpcResponseStackItem(item: any): item is RpcResponseStackItem;
};
export { TypeChecker };
