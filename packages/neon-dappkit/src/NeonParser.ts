import {
  Neo3Parser,
  ParseConfig,
  ABI_TYPES,
  HINT_TYPES,
  ArrayConfigArgType,
  MapConfigArgType,
  InteropInterfaceConfigArgType,
  Hash160ConfigArgType,
  StringConfigArgType,
  AnyArgType,
  Arg,
  ArrayResponseArgType,
  BooleanArgType,
  ByteStringArgType,
  Hash160ArgType,
  Hash256ArgType,
  IntegerArgType,
  MapResponseArgType,
  PublicKeyArgType,
  RpcResponseStackItem,
  StringArgType,
} from '@cityofzion/neon-dappkit-types'
import { u, wallet, sc } from '@cityofzion/neon-js'

const NeonParser: Neo3Parser = {
  abToHexstring(arr: ArrayBuffer | ArrayLike<number>): string {
    return u.ab2hexstring(arr)
  },
  abToStr(buf: ArrayBuffer | ArrayLike<number>): string {
    return u.ab2str(buf)
  },
  accountInputToAddress(input: string): string {
    return new wallet.Account(input).address
  },
  accountInputToScripthash(input: string): string {
    return new wallet.Account(input).scriptHash
  },
  base64ToHex: (input: string): string => {
    return u.base642hex(input)
  },
  base64ToUtf8(input: string): string {
    return u.base642utf8(input)
  },
  hexToBase64(input: string): string {
    return u.hex2base64(input)
  },
  hexstringToAb(str: string): Uint8Array {
    return u.hexstring2ab(str)
  },
  hexstringToStr(hexstring: string): string {
    return u.hexstring2str(hexstring)
  },
  intToHex(num: number): string {
    return u.int2hex(num)
  },
  numToHexstring(num: number, size: number | undefined, littleEndian: boolean | undefined): string {
    return u.num2hexstring(num, size, littleEndian)
  },
  numToVarInt(num: number): string {
    return u.num2VarInt(num)
  },
  reverseHex(input: string): string {
    return u.reverseHex(input)
  },
  strToAb(str: string): Uint8Array {
    return u.str2ab(str)
  },
  strToBase64: (input: string): string => {
    return u.hex2base64(u.str2hexstring(input))
  },
  strToHexstring(str: string): string {
    return u.str2hexstring(str)
  },
  utf8ToBase64(input: string): string {
    return u.utf82base64(input)
  },
  asciiToBase64(input: string): string {
    return u.HexString.fromAscii(input).toBase64()
  },
  parseRpcResponse(field: RpcResponseStackItem, parseConfig?: ParseConfig): any {
    parseConfig = verifyParseConfigUnion(field, parseConfig)

    switch (field.type) {
      case 'ByteString':
        return parseByteString(field, parseConfig)
      case 'Integer':
        return parseInt((field as IntegerArgType).value as string)
      case 'Struct':
      case 'Array':
        return ((field as ArrayResponseArgType).value as RpcResponseStackItem[]).map((f: any) => {
          return NeonParser.parseRpcResponse(f, (parseConfig as ArrayConfigArgType)?.generic)
        })
      case 'Map': {
        const object: { [key: string]: any } = {}
        const mapResponseArg = field as MapResponseArgType
        mapResponseArg.value.forEach((f: any) => {
          const key: string = NeonParser.parseRpcResponse(f.key, (parseConfig as MapConfigArgType)?.genericKey)
          object[key] = NeonParser.parseRpcResponse(f.value, (parseConfig as MapConfigArgType)?.genericItem)
        })
        return object
      }
      // Another method should take care of this parse
      case 'InteropInterface':
        return
      default:
        try {
          return JSON.parse((field as Exclude<RpcResponseStackItem, InteropInterfaceConfigArgType>).value as string)
        } catch (e) {
          return (field as Exclude<RpcResponseStackItem, InteropInterfaceConfigArgType>).value
        }
    }
  },

  formatRpcArgument(arg: any, parseConfig?: ParseConfig): Arg {
    const argType = parseConfig && parseConfig.type !== 'Any' ? parseConfig.type : typeof arg

    switch (argType) {
      case 'ByteArray': {
        return { type: 'ByteArray', value: arg }
      }
      case 'Hash160': {
        return sc.ContractParam.hash160(arg).toJson() as Hash160ArgType
      }
      case 'Hash256': {
        return sc.ContractParam.hash256(arg).toJson() as Hash256ArgType
      }
      case 'PublicKey': {
        return sc.ContractParam.publicKey(arg).toJson() as PublicKeyArgType
      }
      case 'String':
      case 'string': {
        return sc.ContractParam.string(arg).toJson() as StringArgType
      }
      case 'Integer':
      case 'number': {
        return sc.ContractParam.integer(arg).toJson() as IntegerArgType
      }
      case 'Boolean':
      case 'boolean': {
        return sc.ContractParam.boolean(typeof arg === 'string' ? arg === 'true' : arg).toJson() as BooleanArgType
      }
      case 'Array':
      case 'Map':
      case 'object': {
        if (Array.isArray(arg)) {
          parseConfig = parseConfig as ArrayConfigArgType
          const typeHints = parseConfig && parseConfig.generic ? parseConfig.generic : undefined

          return { type: 'Array', value: arg.map((arrayArg) => NeonParser.formatRpcArgument(arrayArg, typeHints)) }
        } else if (arg !== null) {
          const mapPairs = Object.keys(arg).map((key) => {
            parseConfig = parseConfig as MapConfigArgType
            const configKey = parseConfig?.genericKey || undefined
            const configItem = parseConfig?.genericItem || undefined

            return {
              key: NeonParser.formatRpcArgument(key, configKey),
              value: NeonParser.formatRpcArgument(arg[key], configItem),
            }
          })

          return { type: 'Map', value: mapPairs }
        }
        // If the variable 'arg' is null, the default case of the switch case should be returned.
      }
      /* eslint "no-fallthrough": "off" */
      default: {
        return sc.ContractParam.any().toJson() as AnyArgType
      }
    }
  },
}

function verifyParseConfigUnion(field: RpcResponseStackItem, parseConfig?: ParseConfig): ParseConfig | undefined {
  if (parseConfig?.type === 'Any' && parseConfig?.union) {
    const configs: ParseConfig[] = parseConfig?.union.filter((config) => {
      const abiType = ABI_TYPES[config.type.toUpperCase() as keyof typeof ABI_TYPES] as any
      return abiType.internal?.toUpperCase() === field.type.toUpperCase()
    })

    if (configs.length > 0) {
      if (field.type === 'Array' && configs[0].type === 'Array') {
        return { type: 'Array', generic: configs[0].generic }
      } else if (field.type === 'Map' && configs[0].type === 'Map') {
        return { type: 'Map', genericKey: configs[0].genericKey, genericItem: configs[0].genericItem }
      } else if (field.type === 'ByteString') {
        if (configs.length === 1) {
          return configs[0]
        } else {
          return { type: 'String' }
        }
      } else {
        return configs[0]
      }
    }

    return undefined
  }

  return parseConfig
}

function parseByteString({ value }: ByteStringArgType, parseConfig?: ParseConfig) {
  const valueToParse = value as string

  const rawValue = NeonParser.base64ToHex(valueToParse)

  if (parseConfig?.type === ABI_TYPES.BYTEARRAY.name || parseConfig?.type === ABI_TYPES.PUBLICKEY.name) {
    return rawValue
  }

  if (parseConfig?.type === ABI_TYPES.HASH160.name) {
    if (rawValue.length !== 40) throw new TypeError(`${rawValue} is not a ${ABI_TYPES.HASH160.name}`)

    return (parseConfig as Hash160ConfigArgType)?.hint === HINT_TYPES.SCRIPTHASHLITTLEENDING.name
      ? rawValue
      : `0x${NeonParser.reverseHex(rawValue)}`
  }

  if (parseConfig?.type === ABI_TYPES.HASH256.name) {
    if (rawValue.length !== 64) throw new TypeError(`${rawValue} is not a ${ABI_TYPES.HASH256.name}`)

    return `0x${NeonParser.reverseHex(rawValue)}`
  }

  let stringValue

  try {
    stringValue = NeonParser.base64ToUtf8(valueToParse)
  } catch (e) {
    return valueToParse
  }

  if (
    (parseConfig as StringConfigArgType)?.hint === HINT_TYPES.ADDRESS.name &&
    (stringValue.length !== 34 ||
      (!stringValue.startsWith('N') && !stringValue.startsWith('A')) ||
      !stringValue.match(/^[A-HJ-NP-Za-km-z1-9]*$/)) // check base58 chars
  ) {
    throw new TypeError(`${valueToParse} is not an ${HINT_TYPES.ADDRESS.name}`)
  }
  return stringValue
}

export { NeonParser }
