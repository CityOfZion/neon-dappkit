import { NeonParser } from '.'
import { describe, it } from 'mocha'
import * as assert from 'assert'
import { RpcResponseStackItem } from '@cityofzion/neon-dappkit-types'

describe('NeonParser', function () {
  this.timeout(60000)

  it('converts Base64 to Hex and revert it', async () => {
    assert.equal(
      NeonParser.reverseHex(NeonParser.base64ToHex('ateeXCdGd+AdYKWa5w8SikaAqlk=')),
      '59aa80468a120fe79aa5601de07746275c9ed76a',
    )
  })

  it('converts address to script hash', async () => {
    assert.equal(
      NeonParser.accountInputToScripthash('NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr'),
      '857a247939db5c7cd3a7bb14791280c09e824bea',
    )
  })

  it('parses Address', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.asciiToBase64('NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs'),
    }

    const address = NeonParser.parseRpcResponse(rpcResponse, { type: 'String', hint: 'Address' })
    assert.deepEqual(address, 'NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs')
  })

  it('parses invalid Address', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      // Address will end up too short
      value: NeonParser.hexToBase64('Nnnnnnnnnnnnnnnn'),
    }
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'String', hint: 'Address' }))

    // Address will be too big
    rpcResponse.value = NeonParser.strToBase64('NnnnnnnnnnnnnnnnNnnnnnnnnnnnnnnnNnnnnnnnnnnnnnnn')
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'String', hint: 'Address' }))

    // Address shouldn't start with a letter that isn't 'A' or 'N'
    rpcResponse.value = NeonParser.strToBase64('BNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs')
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'String', hint: 'Address' }))

    // Address shouldn't have invalid base58 characters
    rpcResponse.value = NeonParser.strToBase64('NNLI44dJNXtDNSBkofB48aTVYtb1zZrNEL')
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'String', hint: 'Address' }))
  })

  it('parses ScriptHash and ScriptHashLittleEndian', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.hexToBase64('61479ab68fd5c2c04b254f382d84ddf2f5c67ced'),
    }

    const scriptHash = NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash160', hint: 'ScriptHash' })
    assert.deepEqual(scriptHash, '0xed7cc6f5f2dd842d384f254bc0c2d58fb69a4761')

    const scriptHashLilEndian = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Hash160',
      hint: 'ScriptHashLittleEndian',
    })
    assert.deepEqual(scriptHashLilEndian, '61479ab68fd5c2c04b254f382d84ddf2f5c67ced')
  })

  it('parses invalid ScriptHash and ScriptHashLittleEndian', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      // ScriptHash will end up too short
      value: NeonParser.hexToBase64('61479ab68fd5c2c04b25'),
    }
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash160', hint: 'ScriptHash' }))
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash160', hint: 'ScriptHashLittleEndian' }))

    // ScriptHash will be too big
    rpcResponse.value = NeonParser.hexToBase64('61479ab68fd5c2c04b254f382d84ddf2f5c67ced111111111111')
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash160', hint: 'ScriptHash' }))
    assert.throws(() => NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash160', hint: 'ScriptHashLittleEndian' }))
  })

  it('parses BlockHash or TransactionId', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.hexToBase64(
        NeonParser.reverseHex('0x6c513de791b17ddadec205a07301229ac890d71c16c1d5a0320c655fb69214fc'.substring(2)),
      ),
    }

    const blockHash = NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash256', hint: 'BlockHash' })
    const transactionId = NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash256', hint: 'TransactionId' })
    assert.deepEqual(transactionId, '0x6c513de791b17ddadec205a07301229ac890d71c16c1d5a0320c655fb69214fc')
    assert.deepEqual(blockHash, transactionId)

    // There isn't a different on how they are returned right now
    const hash256 = NeonParser.parseRpcResponse(rpcResponse, { type: 'Hash256' })
    assert.deepEqual(hash256, blockHash)
  })

  it('parses ByteString without parseConfig', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.asciiToBase64('Testing'),
    }

    const stringValue = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(stringValue, 'Testing')

    const bytesValue = NeonParser.parseRpcResponse(rpcResponse, { type: 'ByteArray' })
    assert.deepEqual(bytesValue, '54657374696e67')
  })

  it('parses PublicKey', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.hexToBase64('03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c'),
    }

    const scriptHash = NeonParser.parseRpcResponse(rpcResponse, { type: 'PublicKey' })
    assert.deepEqual(scriptHash, '03cdb067d930fd5adaa6c68545016044aaddec64ba39e548250eaea551172e535c')
  })

  it('parses Integer', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Integer',
      value: '18',
    }

    const integer = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(integer, 18)
  })

  it('parses single type Array', async () => {
    let rpcResponse: RpcResponseStackItem = {
      type: 'Array',
      value: [
        {
          type: 'Integer',
          value: '10',
        },
        {
          type: 'Integer',
          value: '20',
        },
        {
          type: 'Integer',
          value: '30',
        },
      ],
    }
    let array = NeonParser.parseRpcResponse(rpcResponse, { type: 'Array', generic: { type: 'Integer' } })
    assert.deepEqual(array, [10, 20, 30])

    rpcResponse = {
      type: 'Array',
      value: [
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('test'),
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('array'),
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('return'),
        },
      ],
    }
    array = NeonParser.parseRpcResponse(rpcResponse, { type: 'Array', generic: { type: 'String' } })
    assert.deepEqual(array, ['test', 'array', 'return'])

    // Will also work if you don't send a parseConfig and expects the ByteString results to be a String
    assert.deepEqual(array, NeonParser.parseRpcResponse(rpcResponse))

    rpcResponse = {
      type: 'Array',
      value: [
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('test'),
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('array'),
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('return'),
        },
      ],
    }
    array = NeonParser.parseRpcResponse(rpcResponse, { type: 'Array', generic: { type: 'ByteArray' } })
    assert.deepEqual(array, ['74657374', '6172726179', '72657475726e'])
  })

  it('parses Union', async () => {
    let rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.strToBase64('test'),
    }
    let union = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Any',
      union: [{ type: 'String' }, { type: 'Integer' }],
    })
    assert.deepEqual(union, 'test')

    rpcResponse = {
      type: 'Integer',
      value: '12',
    }
    union = NeonParser.parseRpcResponse(rpcResponse, { type: 'Any', union: [{ type: 'String' }, { type: 'Integer' }] })
    assert.deepEqual(union, 12)

    rpcResponse = {
      type: 'ByteString',
      value: NeonParser.hexToBase64('61479ab68fd5c2c04b254f382d84ddf2f5c67ced'),
    }
    union = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Any',
      union: [{ type: 'Hash160', hint: 'ScriptHash' }, { type: 'Integer' }],
    })
    assert.deepEqual(union, '0xed7cc6f5f2dd842d384f254bc0c2d58fb69a4761')
  })

  it('parses same internal types with Union', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'ByteString',
      value: NeonParser.strToBase64('test'),
    }

    // It's not possible to definitly know the correct return of the same internal type, currently, it's only a ByteString problem,
    // so whenever there are multiple ByteStrings on a union it will be considerer as a String
    const str = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Any',
      union: [{ type: 'Hash160', hint: 'ScriptHash' }, { type: 'Hash256', hint: 'BlockHash' }, { type: 'Integer' }],
    })
    assert.deepEqual(str, 'test')
  })

  it('parses multiple types Array', async () => {
    let rpcResponse: RpcResponseStackItem = {
      type: 'Array',
      value: [
        {
          type: 'Integer',
          value: '10',
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('test'),
        },
        {
          type: 'ByteString',
          value: NeonParser.strToBase64('parser'),
        },
      ],
    }
    let array = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Array',
      generic: {
        type: 'Any',
        union: [
          {
            type: 'Integer',
          },
          {
            type: 'String',
          },
        ],
      },
    })
    assert.deepEqual(array, [10, 'test', 'parser'])

    rpcResponse = {
      type: 'Array',
      value: [
        {
          type: 'Integer',
          value: '10',
        },
        {
          type: 'ByteString',
          value: 'Tk5MaTQ0ZEpOWHRETlNCa29mQjQ4YVRWWXRiMXpack5Fcw',
        },
        {
          type: 'ByteString',
          value: 'TlozcHFuYzFoTU44RUhXNTVabkNudThCMndvb1hKSEN5cg==',
        },
      ],
    }
    array = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Array',
      generic: {
        type: 'Any',
        union: [
          {
            type: 'Integer',
          },
          {
            type: 'String',
            hint: 'Address',
          },
        ],
      },
    })
    assert.deepEqual(array, [10, 'NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs', 'NZ3pqnc1hMN8EHW55ZnCnu8B2wooXJHCyr'])
  })

  it('parses single type Map', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('unit'),
          },
          value: {
            type: 'ByteString',
            value: NeonParser.strToBase64('test'),
          },
        },
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('neo'),
          },
          value: {
            type: 'ByteString',
            value: NeonParser.strToBase64('parser'),
          },
        },
      ],
    }
    const map = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Map',
      genericKey: { type: 'String' },
      genericItem: { type: 'String' },
    })
    assert.deepEqual(map, { unit: 'test', neo: 'parser' })
    // Will also work if you don't send a parseConfig and expects the ByteString results to be a String
    assert.deepEqual(map, NeonParser.parseRpcResponse(rpcResponse))
  })

  it('parses multiple types Map', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('unit'),
          },
          value: {
            type: 'ByteString',
            value: NeonParser.strToBase64('test'),
          },
        },
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('neo'),
          },
          value: {
            type: 'Integer',
            value: '123',
          },
        },
        {
          key: {
            type: 'Integer',
            value: '789',
          },
          value: {
            type: 'Integer',
            value: '123',
          },
        },
      ],
    }
    const map = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Map',
      genericKey: { type: 'Any', union: [{ type: 'String' }, { type: 'Integer' }] },
      genericItem: { type: 'Any', union: [{ type: 'String' }, { type: 'Integer' }] },
    })
    assert.deepEqual(map, { unit: 'test', neo: 123, 789: 123 })
  })

  it('parses Boolean', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Boolean',
      value: true,
    }

    let bool = NeonParser.parseRpcResponse(rpcResponse, { type: 'Boolean' })
    assert.deepEqual(bool, true)
    bool = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(bool, true)

    rpcResponse.value = false
    bool = NeonParser.parseRpcResponse(rpcResponse, { type: 'Boolean' })
    assert.deepEqual(bool, false)
    bool = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(bool, false)
  })

  it('parses Iterator', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'InteropInterface',
      interface: 'IIterator',
      id: 'e93e82f7-629b-4b4b-9fae-054d18bd32e2',
    }

    // currently can't parse an iterator
    const iterator = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(iterator, undefined)
  })

  it('parses Array inside Map', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('test'),
          },
          value: {
            type: 'Array',
            value: [
              { type: 'ByteString', value: NeonParser.strToBase64('abc') },
              { type: 'ByteString', value: NeonParser.strToBase64('def') },
              { type: 'ByteString', value: NeonParser.strToBase64('ghi') },
            ],
          },
        },
        {
          key: {
            type: 'ByteString',
            value: NeonParser.strToBase64('neo'),
          },
          value: {
            type: 'Integer',
            value: '123',
          },
        },
      ],
    }

    const map = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(map, { test: ['abc', 'def', 'ghi'], neo: 123 })

    const mapWithConfig = NeonParser.parseRpcResponse(rpcResponse, {
      type: 'Map',
      genericKey: { type: 'String' },
      genericItem: { type: 'Any', union: [{ type: 'Integer' }, { type: 'Array', generic: { type: 'ByteArray' } }] },
    })
    assert.deepEqual(mapWithConfig, { test: ['616263', '646566', '676869'], neo: 123 })
  })

  it('parses Map inside Array', async () => {
    const rpcResponseArray: RpcResponseStackItem = {
      type: 'Array',
      value: [
        { type: 'ByteString', value: NeonParser.strToBase64('abc') },
        {
          type: 'Map',
          value: [
            {
              key: { type: 'ByteString', value: NeonParser.strToBase64('neon') },
              value: { type: 'ByteString', value: NeonParser.strToBase64('parser') },
            },
            {
              key: { type: 'ByteString', value: NeonParser.strToBase64('unit') },
              value: { type: 'ByteString', value: NeonParser.strToBase64('test') },
            },
          ],
        },
        { type: 'ByteString', value: NeonParser.strToBase64('def') },
      ],
    }
    let array = NeonParser.parseRpcResponse(rpcResponseArray)
    assert.deepEqual(array, ['abc', { neon: 'parser', unit: 'test' }, 'def'])

    array = NeonParser.parseRpcResponse(rpcResponseArray, {
      type: 'Array',
      generic: {
        type: 'Any',
        union: [
          { type: 'String' },
          { type: 'Map', genericKey: { type: 'String' }, genericItem: { type: 'ByteArray' } },
        ],
      },
    })
    assert.deepEqual(array, ['abc', { neon: '706172736572', unit: '74657374' }, 'def'])
  })

  it('parses raw when UTF8 parsing fails', async () => {
    const rpcResponse: RpcResponseStackItem = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'ByteString',
            value: 'bmFtZQ==',
          },
          value: {
            type: 'ByteString',
            value: 'TElaQVJE',
          },
        },
        {
          key: {
            type: 'ByteString',
            value: 'c2VlZA==',
          },
          value: {
            type: 'ByteString',
            value: 'dphNnS0kGxelyR4Q8ntrbA==',
          },
        },
      ],
    }

    const parsed = NeonParser.parseRpcResponse(rpcResponse)
    assert.deepEqual(parsed, { name: 'LIZARD', seed: 'dphNnS0kGxelyR4Q8ntrbA==' })
  })

  it('parses numbers', async () => {
    let numberArg = NeonParser.formatRpcArgument(0)
    let expectedResult = { type: 'Integer', value: '0' }
    assert.deepStrictEqual(numberArg, expectedResult)

    numberArg = NeonParser.formatRpcArgument(1)
    expectedResult = { type: 'Integer', value: '1' }
    assert.deepStrictEqual(numberArg, expectedResult)

    numberArg = NeonParser.formatRpcArgument(123)
    expectedResult = { type: 'Integer', value: '123' }
    assert.deepStrictEqual(numberArg, expectedResult)

    numberArg = NeonParser.formatRpcArgument(-10)
    expectedResult = { type: 'Integer', value: '-10' }
    assert.deepStrictEqual(numberArg, expectedResult)
  })

  it('parses boolean', async () => {
    let booleanArg = NeonParser.formatRpcArgument(true)
    let expectedResult = { type: 'Boolean', value: true }
    assert.deepStrictEqual(booleanArg, expectedResult)

    booleanArg = NeonParser.formatRpcArgument(false)
    expectedResult = { type: 'Boolean', value: false }
    assert.deepStrictEqual(booleanArg, expectedResult)
  })

  it('parses string', async () => {
    let stringArg = NeonParser.formatRpcArgument('unit test')
    let expectedResult = { type: 'String', value: 'unit test' }
    assert.deepStrictEqual(stringArg, expectedResult)

    stringArg = NeonParser.formatRpcArgument('1234')
    expectedResult = { type: 'String', value: '1234' }
    assert.deepStrictEqual(stringArg, expectedResult)
  })

  it('parses ByteArray', async () => {
    let byteArrayValue = NeonParser.strToHexstring('unit test')
    let byteArrayArg = NeonParser.formatRpcArgument(byteArrayValue, { type: 'ByteArray' })
    let expectedResult = { type: 'ByteArray', value: byteArrayValue }
    assert.deepStrictEqual(byteArrayArg, expectedResult)

    byteArrayValue = NeonParser.strToHexstring('another value 1234')
    byteArrayArg = NeonParser.formatRpcArgument(byteArrayValue, { type: 'ByteArray' })
    expectedResult = { type: 'ByteArray', value: byteArrayValue }
    assert.deepStrictEqual(byteArrayArg, expectedResult)

    // Not passing a config will endup returning a String instead of a ByteArray
    byteArrayArg = NeonParser.formatRpcArgument(byteArrayValue)
    expectedResult = { type: 'ByteArray', value: byteArrayValue }
    assert.notDeepStrictEqual(byteArrayArg, expectedResult)
  })

  it('parses Hash160', async () => {
    let hash160Arg = NeonParser.formatRpcArgument('0xd2a4cff31913016155e38e474a2c06d08be276cf', { type: 'Hash160' })
    let expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' }
    assert.deepStrictEqual(hash160Arg, expectedResult)

    hash160Arg = NeonParser.formatRpcArgument('d2a4cff31913016155e38e474a2c06d08be276cf', { type: 'Hash160' })
    expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' }
    assert.deepStrictEqual(hash160Arg, expectedResult)

    // Not passing a config will endup returning a String instead of a Hash160
    hash160Arg = NeonParser.formatRpcArgument('d2a4cff31913016155e38e474a2c06d08be276cf')
    expectedResult = { type: 'Hash160', value: 'd2a4cff31913016155e38e474a2c06d08be276cf' }
    assert.notDeepStrictEqual(hash160Arg, expectedResult)
  })

  it('parses Hash256', async () => {
    let hash256Arg = NeonParser.formatRpcArgument(
      '0xd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be',
      { type: 'Hash256' },
    )
    let expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' }
    assert.deepStrictEqual(hash256Arg, expectedResult)

    hash256Arg = NeonParser.formatRpcArgument('d2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be', {
      type: 'Hash256',
    })
    expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' }
    assert.deepStrictEqual(hash256Arg, expectedResult)

    // Not passing a config will endup returning a String instead of a Hash256
    hash256Arg = NeonParser.formatRpcArgument('d2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be')
    expectedResult = { type: 'Hash256', value: 'd2b24b57ea05821766877241a51e17eae06ed66a6c72adb5727f8ba701d995be' }
    assert.notDeepStrictEqual(hash256Arg, expectedResult)
  })

  it('parses PublicKey', async () => {
    let publicKeyArg = NeonParser.formatRpcArgument(
      '035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a',
      { type: 'PublicKey' },
    )
    const expectedResult = {
      type: 'PublicKey',
      value: '035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a',
    }
    assert.deepStrictEqual(publicKeyArg, expectedResult)

    publicKeyArg = NeonParser.formatRpcArgument('035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a')
    assert.notDeepStrictEqual(publicKeyArg, expectedResult)
  })

  it('parses array of primitive types', async () => {
    let arrayArg = NeonParser.formatRpcArgument([1, 2, 3], { type: 'Array', generic: { type: 'Integer' } })
    let arrayArgNoConfig = NeonParser.formatRpcArgument([1, 2, 3])
    let expectedResult: any = {
      type: 'Array',
      value: [
        { type: 'Integer', value: '1' },
        { type: 'Integer', value: '2' },
        { type: 'Integer', value: '3' },
      ],
    }
    assert.deepStrictEqual(arrayArg, expectedResult)
    assert.deepStrictEqual(arrayArg, arrayArgNoConfig)

    arrayArg = NeonParser.formatRpcArgument([true, false], { type: 'Array', generic: { type: 'Boolean' } })
    arrayArgNoConfig = NeonParser.formatRpcArgument([true, false])
    expectedResult = {
      type: 'Array',
      value: [
        { type: 'Boolean', value: true },
        { type: 'Boolean', value: false },
      ],
    }
    assert.deepStrictEqual(arrayArg, expectedResult)
    assert.deepStrictEqual(arrayArg, arrayArgNoConfig)

    arrayArg = NeonParser.formatRpcArgument(['unit', 'test'], { type: 'Array', generic: { type: 'String' } })
    arrayArgNoConfig = NeonParser.formatRpcArgument(['unit', 'test'])
    expectedResult = {
      type: 'Array',
      value: [
        { type: 'String', value: 'unit' },
        { type: 'String', value: 'test' },
      ],
    }
    assert.deepStrictEqual(arrayArg, expectedResult)
    assert.deepStrictEqual(arrayArg, arrayArgNoConfig)

    arrayArg = NeonParser.formatRpcArgument(['756e6974', '74657374'], { type: 'Array', generic: { type: 'ByteArray' } })
    arrayArgNoConfig = NeonParser.formatRpcArgument(['unit', 'test'])
    expectedResult = {
      type: 'Array',
      value: [
        { type: 'ByteArray', value: '756e6974' },
        { type: 'ByteArray', value: '74657374' },
      ],
    }
    assert.deepStrictEqual(arrayArg, expectedResult)
    assert.notDeepStrictEqual(arrayArg, arrayArgNoConfig)
  })

  it('parses map of primitive types', async () => {
    let mapArg = NeonParser.formatRpcArgument({}, { type: 'Map' })
    let mapArgNoConfig = NeonParser.formatRpcArgument({})
    let expectedResult = {
      type: 'Map',
      value: [] as any[],
    }
    assert.deepStrictEqual(mapArg, expectedResult)
    assert.deepStrictEqual(mapArg, mapArgNoConfig)

    mapArg = NeonParser.formatRpcArgument(
      { unit: 'test', neon: 'parser', neo3: 'parser' },
      { type: 'Map', genericKey: { type: 'String' }, genericItem: { type: 'String' } },
    )
    mapArgNoConfig = NeonParser.formatRpcArgument({ unit: 'test', neon: 'parser', neo3: 'parser' })
    expectedResult = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'String',
            value: 'unit',
          },
          value: {
            type: 'String',
            value: 'test',
          },
        },
        {
          key: {
            type: 'String',
            value: 'neon',
          },
          value: {
            type: 'String',
            value: 'parser',
          },
        },
        {
          key: {
            type: 'String',
            value: 'neo3',
          },
          value: {
            type: 'String',
            value: 'parser',
          },
        },
      ],
    }
    assert.deepStrictEqual(mapArg, expectedResult)
    assert.deepStrictEqual(mapArg, mapArgNoConfig)

    mapArg = NeonParser.formatRpcArgument(
      { true: true, false: false },
      { type: 'Map', genericKey: { type: 'Boolean' }, genericItem: { type: 'Boolean' } },
    )
    mapArgNoConfig = NeonParser.formatRpcArgument({ true: true, false: false })
    expectedResult = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'Boolean',
            value: true,
          },
          value: {
            type: 'Boolean',
            value: true,
          },
        },
        {
          key: {
            type: 'Boolean',
            value: false,
          },
          value: {
            type: 'Boolean',
            value: false,
          },
        },
      ],
    }
    assert.deepStrictEqual(mapArg, expectedResult)
    assert.notDeepStrictEqual(mapArg, mapArgNoConfig)

    mapArg = NeonParser.formatRpcArgument(
      { 98765: 12345 },
      { type: 'Map', genericKey: { type: 'Integer' }, genericItem: { type: 'Integer' } },
    )
    mapArgNoConfig = NeonParser.formatRpcArgument({ 98765: 12345 })
    expectedResult = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'Integer',
            value: '98765',
          },
          value: {
            type: 'Integer',
            value: '12345',
          },
        },
      ],
    }
    assert.deepStrictEqual(mapArg, expectedResult)
    assert.notDeepStrictEqual(mapArg, mapArgNoConfig)

    mapArg = NeonParser.formatRpcArgument(
      { '627974654172726179': NeonParser.strToHexstring('unit test') },
      { type: 'Map', genericKey: { type: 'ByteArray' }, genericItem: { type: 'ByteArray' } },
    )
    mapArgNoConfig = NeonParser.formatRpcArgument({ '627974654172726179': NeonParser.strToHexstring('unit test') })
    expectedResult = {
      type: 'Map',
      value: [
        {
          key: {
            type: 'ByteArray',
            value: '627974654172726179',
          },
          value: {
            type: 'ByteArray',
            value: '756e69742074657374',
          },
        },
      ],
    }
    assert.deepStrictEqual(mapArg, expectedResult)
    assert.notDeepStrictEqual(mapArg, mapArgNoConfig)
  })

  it('parses Any', async () => {
    let anyArg = NeonParser.formatRpcArgument(12345, { type: 'Any' })
    let expectedResult: any = {
      type: 'Integer',
      value: '12345',
    }
    assert.deepStrictEqual(anyArg, expectedResult)

    anyArg = NeonParser.formatRpcArgument(false, { type: 'Any' })
    expectedResult = {
      type: 'Boolean',
      value: false,
    }
    assert.deepStrictEqual(anyArg, expectedResult)

    anyArg = NeonParser.formatRpcArgument('unit test', { type: 'Any' })
    expectedResult = {
      type: 'String',
      value: 'unit test',
    }
    assert.deepStrictEqual(anyArg, expectedResult)

    anyArg = NeonParser.formatRpcArgument([1, 2], { type: 'Any' })
    expectedResult = {
      type: 'Array',
      value: [
        { type: 'Integer', value: '1' },
        { type: 'Integer', value: '2' },
      ],
    }
    assert.deepStrictEqual(anyArg, expectedResult)

    anyArg = NeonParser.formatRpcArgument(null, { type: 'Any' })
    expectedResult = { type: 'Any', value: null }
    assert.deepStrictEqual(anyArg, expectedResult)
  })
})
