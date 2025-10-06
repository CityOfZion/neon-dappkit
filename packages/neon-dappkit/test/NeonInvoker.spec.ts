import { ChildProcess, spawn, execSync } from 'child_process'
import { ContractInvocationMulti } from '@cityofzion/neon-dappkit-types'
import { NeonEventListener, NeonInvoker, NeonParser, TypeChecker } from '../src'
import assert from 'assert'
import * as path from 'path'
import { tx, u } from '@cityofzion/neon-js'
import { wallet } from '@cityofzion/neon-core'
import {
  wait,
  neoGoPath,
  getDataDir,
  getBalance,
  toDecimal,
  transferInvocation,
  rpcAddress,
  gasScriptHash,
  waitTime,
  neonEventListenerOptions,
  neoScriptHash,
} from './helper'

describe('NeonInvoker', function () {
  this.timeout(60000)
  let childProcess: ChildProcess
  let account1: wallet.Account
  let account2: wallet.Account
  const neonEventListener = new NeonEventListener(rpcAddress, neonEventListenerOptions)
  const verifiableContract = '0x1b0146e719219b77e70b654aeb23f82b25f8abca'
  const testReturnContract = '0x5d564a6ee553234ff7a32c7cc2e188d3086d4892'
  const testReturnMapContract = '0x3b2244fc8c13644048040c8e4aa6562365658def'

  beforeEach(async function () {
    const neoGo = neoGoPath()
    const dataDir = getDataDir()

    childProcess = spawn(
      neoGo,
      ['node', '--config-file', `${dataDir}/protocol.unit_testnet.single.yml`, '--relative-path', dataDir],
      {},
    )
    await wait(waitTime)

    account1 = new wallet.Account('c7134d6fd8e73d819e82755c64c93788d8db0961929e025a53363c4cc02a6962')
    account2 = new wallet.Account('450d6c2a04b5b470339a745427bae6828400cf048400837d73c415063835e005')

    // Giving 100 GAS to account1 and account2
    execSync(`${neoGo} util sendtx -r ${rpcAddress} ${path.resolve(path.join(getDataDir(), 'givewallet1.json'))}`)
    execSync(`${neoGo} util sendtx -r ${rpcAddress} ${path.resolve(path.join(getDataDir(), 'givewallet2.json'))}`)

    await wait(waitTime)

    // Deploying smart contracts
    execSync(
      `${neoGo} util sendtx -r ${rpcAddress} ${path.resolve(path.join(getDataDir(), 'deployVerifiable.json'))}`,
    ).toString()
    execSync(
      `${neoGo} util sendtx -r ${rpcAddress} ${path.resolve(path.join(getDataDir(), 'deployReturnTest.json'))}`,
    ).toString()
    execSync(
      `${neoGo} util sendtx -r ${rpcAddress} ${path.resolve(path.join(getDataDir(), 'deployReturnMapTest.json'))}`,
    ).toString()

    await wait(waitTime)

    return true
  })

  afterEach('Tear down', async function () {
    return childProcess.kill()
  })

  it('does invokeFunction', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
      account: account1,
    })
    const receiver = new wallet.Account()

    const txId = await invoker.invokeFunction(transferInvocation(gasScriptHash, account1, receiver, '100'))

    assert(txId.length > 0, 'has txId')
    await wait(waitTime)
  })

  it('does invokeFunction with signingCallback', async () => {
    const privateAccount = account1
    const publicAccount = new wallet.Account(privateAccount.publicKey)

    const invoker = await NeonInvoker.init({
      rpcAddress,
      signingCallback: async (transaction, details) => {
        const hex = NeonParser.numToHex(details.network, 4, true) + NeonParser.reverseHex(transaction.hash())
        return wallet.sign(hex, privateAccount.privateKey)
      },
      account: publicAccount,
    })

    const txId = await invoker.invokeFunction({
      ...transferInvocation(gasScriptHash, publicAccount, new wallet.Account(), '100'),
      signers: [
        {
          account: publicAccount.scriptHash,
          scopes: tx.WitnessScope.CalledByEntry,
          rules: [],
        },
      ],
    })

    assert(txId.length > 0, 'has txId')
    await wait(waitTime)
  })

  it('can sign and invoke using different NeonInvokers/accounts', async () => {
    const accountPayer = account1
    const accountOwner = account2

    // TEST WITH BOTH ACCOUNTS ON THE SAME INVOKER

    const invokerBoth = await NeonInvoker.init({
      rpcAddress,
      account: [accountPayer, accountOwner],
    })

    const txBoth = await invokerBoth.invokeFunction({
      // owner is sending GAS to payer, but the payer is paying for the tx
      ...transferInvocation(gasScriptHash, accountOwner, accountPayer, '100'),
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
    })

    assert(txBoth.length > 0, 'has txId')

    await wait(waitTime)

    // TEST WITH EACH ACCOUNT ON A DIFFERENT INVOKER

    const invokerPayer = await NeonInvoker.init({
      rpcAddress,
      account: accountPayer,
    })

    const invokerOwner = await NeonInvoker.init({
      rpcAddress,
      account: accountOwner,
    })

    const payerBalance = await getBalance(invokerPayer, accountPayer.address)
    const ownerBalance = await getBalance(invokerOwner, accountOwner.address)

    const amount = 50000000
    const bt = await invokerPayer.signTransaction({
      //  owner is sending GAS to payer, but the payer is paying for the tx
      ...transferInvocation(gasScriptHash, accountOwner, accountPayer, amount.toString()),
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
    })

    const txId = await invokerOwner.invokeFunction(bt)

    assert(txId.length > 0, 'has txId')

    await wait(waitTime)

    const payerBalanceAfter = await getBalance(invokerPayer, accountPayer.address)
    const ownerBalanceAfter = await getBalance(invokerOwner, accountOwner.address)

    const totalFees = Number(bt.systemFee) + Number(bt.networkFee)

    assert(
      payerBalance - totalFees + amount === payerBalanceAfter,
      `payer balance (was ${payerBalance}) should be ${payerBalance - totalFees + amount} but is ${payerBalanceAfter}`,
    )
    assert.equal(
      ownerBalanceAfter,
      ownerBalance - amount,
      `owner balance (was ${ownerBalance}) should be ${ownerBalance - totalFees + amount} but is ${ownerBalanceAfter}`,
    )

    await wait(waitTime)
  })

  it('can sign and invoke with signingCallback using different NeonInvokers/accounts', async () => {
    const privateAccount = account1
    const accountSignCallback = new wallet.Account(account1.publicKey)

    const accountSignPrivKey = account2

    const invokerSignCallback = await NeonInvoker.init({
      rpcAddress,
      signingCallback: async (transaction, details) => {
        const hex = NeonParser.numToHex(details.network, 4, true) + NeonParser.reverseHex(transaction.hash())
        return wallet.sign(hex, privateAccount.privateKey)
      },
      account: accountSignCallback,
    })

    const invokerSignPrivKey = await NeonInvoker.init({
      rpcAddress,
      account: accountSignPrivKey,
    })

    let bt = await invokerSignCallback.signTransaction({
      ...transferInvocation(gasScriptHash, accountSignCallback, accountSignPrivKey, '100000000'),
      signers: [
        {
          account: accountSignCallback.scriptHash,
          scopes: 'CalledByEntry',
        },
        {
          account: accountSignPrivKey.scriptHash,
          scopes: 'CalledByEntry',
        },
      ],
    })

    let txId = await invokerSignPrivKey.invokeFunction(bt)

    assert(txId.length > 0, 'has txId')

    await wait(waitTime)

    bt = await invokerSignPrivKey.signTransaction({
      ...transferInvocation(gasScriptHash, accountSignPrivKey, accountSignCallback, '100000000'),
      signers: [
        {
          account: accountSignPrivKey.scriptHash,
          scopes: 'CalledByEntry',
        },
        {
          account: accountSignCallback.scriptHash,
          scopes: 'CalledByEntry',
        },
      ],
    })

    txId = await invokerSignCallback.invokeFunction(bt)

    assert(txId.length > 0, 'has txId')

    const appLog = await neonEventListener.waitForApplicationLog(txId)
    assert(
      appLog.executions[0].stack[0].value === true,
      `transfer was not successful (${appLog.executions[0].stack[0].value})`,
    )
  })

  it('add accounts and witnesses to verify smart contracts', async () => {
    const account = account1
    const invoker = await NeonInvoker.init({
      rpcAddress,
      account,
    })

    // A smart contract that always return True on verify
    const verifyTrueSmartContract = verifiableContract

    // NeoToken smart contract, we are not verified
    const verifyFalseSmartContract = neoScriptHash

    const txIdVerifyTrue = await invoker.invokeFunction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'totalSupply',
          args: [],
        },
      ],
      signers: [
        {
          account: account.scriptHash,
          scopes: 'CalledByEntry',
        },
        {
          account: verifyTrueSmartContract,
          scopes: 'CalledByEntry',
        },
      ],
      // There is currently a problem with the networkfee when using a contract as a signer, so some extra GAS will be used https://github.com/neo-project/neo/issues/2805
      extraNetworkFee: 200000,
    })

    assert(txIdVerifyTrue.length > 0, 'has txId')

    await assert.rejects(
      invoker.invokeFunction({
        invocations: [
          {
            scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
            operation: 'totalSupply',
            args: [],
          },
        ],
        signers: [
          {
            account: account.scriptHash,
            scopes: 'CalledByEntry',
          },
          {
            account: verifyFalseSmartContract,
            scopes: 'CalledByEntry',
          },
        ],
      }),
    )
  })

  it("can throw an error if the signed transaction doesn't match the invocation", async () => {
    const accountPayer = account1
    const accountOwner = account2

    const invokerPayer = await NeonInvoker.init({
      rpcAddress,
      account: accountPayer,
    })

    const invokerOwner = await NeonInvoker.init({
      rpcAddress,
      account: accountOwner,
    })

    const bt = await invokerPayer.signTransaction({
      // owner is sending to payer but the payer is paying for the tx
      ...transferInvocation(gasScriptHash, accountOwner, accountPayer, '100000000'),
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
    })

    await assert.rejects(
      invokerOwner.invokeFunction({
        ...bt,
        invocations: [
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
        ],
      }),
    )
  })

  it('does calculateFee', async () => {
    const account = account1
    const invoker = await NeonInvoker.init({
      rpcAddress,
      account,
    })

    const param: ContractInvocationMulti = {
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
          scopes: tx.WitnessScope.CalledByEntry,
          rules: [],
        },
      ],
    }

    const { networkFee, systemFee, total } = await invoker.calculateFee(param)

    assert(Number(networkFee) > 0, 'has networkFee')
    assert(Number(systemFee) > 0, 'has systemFee')
    assert(
      total === Number(networkFee) + Number(systemFee),
      `has totalFee -- ${networkFee} -- ${systemFee} -- ${total} -- ${Number(networkFee) + Number(systemFee)}`,
    )

    const { networkFee: networkFeeOverridden, systemFee: systemFeeOverridden } = await invoker.calculateFee({
      networkFeeOverride: 20000,
      systemFeeOverride: 10000,
      ...param,
    })

    assert(
      parseFloat(networkFeeOverridden) === toDecimal(20000, 8),
      `networkFee override is not equal (${parseFloat(networkFeeOverridden)} !== ${toDecimal(20000, 8)})`,
    )
    assert(
      parseFloat(systemFeeOverridden) === toDecimal(10000, 8),
      `systemFee override is not equal (${parseFloat(systemFeeOverridden)} !== ${toDecimal(10000, 8)})`,
    )

    const { networkFee: networkFeeExtra, systemFee: systemFeeExtra } = await invoker.calculateFee({
      extraNetworkFee: 20000,
      extraSystemFee: 10000,
      ...param,
    })

    assert(
      parseFloat(networkFeeExtra).toFixed(8) === (parseFloat(networkFee) + toDecimal(20000, 8)).toFixed(8),
      `extra networkFee is not equal (${parseFloat(networkFeeExtra).toFixed(8)} !== ${(
        parseFloat(networkFee) + toDecimal(20000, 8)
      ).toFixed(8)})`,
    )

    assert(
      parseFloat(systemFeeExtra).toFixed(8) === (parseFloat(systemFee) + toDecimal(10000, 8)).toFixed(8),
      `extra systemFee is not equal (${parseFloat(systemFeeExtra).toFixed(8)} !== ${(
        parseFloat(systemFee) + toDecimal(10000, 8)
      ).toFixed(8)})`,
    )
  })

  it('does testInvoke', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'symbol',
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeByteString(resp.stack[0])) {
      assert.equal(resp.stack[0].value, 'R0FT', 'correct symbol')
    } else {
      assert.fail('stack return is not ByteString')
    }
  })

  it('can throw an error if testInvoke state is FAULT', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    await assert.rejects(
      invoker.testInvoke({
        invocations: [
          {
            scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
            operation: 'transfer',
            args: [
              { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
              { type: 'Integer', value: '100000000' },
              { type: 'Array', value: [] },
            ],
          },
        ],
      }),
    )
  })

  it('handles integer return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'negative_number',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_same_int',
          args: [{ type: 'Integer', value: '1234' }],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeInteger(resp.stack[0])) {
      assert.equal(resp.stack[0].value, '-100')
    } else {
      assert.fail('stack return is not Integer')
    }

    if (TypeChecker.isStackTypeInteger(resp.stack[1])) {
      assert.equal(resp.stack[1].value, '1234')
    } else {
      assert.fail('stack return is not Integer')
    }
  })

  it('handles boolean return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'bool_true',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'bool_false',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: true }],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: false }],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeBoolean(resp.stack[0])) {
      assert.equal(resp.stack[0].value, true)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[1])) {
      assert.equal(resp.stack[1].value, false)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[2])) {
      assert.equal(resp.stack[2].value, true)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[3])) {
      assert.equal(resp.stack[3].value, false)
    } else {
      assert.fail('stack return is not Boolean')
    }
  })

  it('handles boolean return (again)', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'bool_true',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'bool_false',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: true }],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: false }],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeBoolean(resp.stack[0])) {
      assert.equal(resp.stack[0].value, true)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[1])) {
      assert.equal(resp.stack[1].value, false)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[2])) {
      assert.equal(resp.stack[2].value, true)
    } else {
      assert.fail('stack return is not Boolean')
    }
    if (TypeChecker.isStackTypeBoolean(resp.stack[3])) {
      assert.equal(resp.stack[3].value, false)
    } else {
      assert.fail('stack return is not Boolean')
    }
  })

  it('handles array return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'positive_numbers',
          args: [],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeArray(resp.stack[0])) {
      assert.deepEqual(resp.stack[0].value, [
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
      ])
    } else {
      assert.fail('stack return is not Array')
    }
  })

  it('handles bytestring return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'return_str',
          args: [],
        },
        {
          scriptHash: testReturnContract,
          operation: 'return_bytes',
          args: [],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeByteString(resp.stack[0])) {
      assert.deepEqual(resp.stack[0].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu')
    } else {
      assert.fail('stack return is not ByteString')
    }

    if (TypeChecker.isStackTypeByteString(resp.stack[1])) {
      assert.deepEqual(resp.stack[1].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu')
    } else {
      assert.fail('stack return is not ByteString')
    }
  })

  it('handles array return (again)', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'positive_numbers',
          args: [],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeArray(resp.stack[0])) {
      assert.deepEqual(resp.stack[0].value, [
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
      ])
    } else {
      assert.fail('stack return is not Array')
    }
  })

  it('handles map return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnMapContract,
          operation: 'main',
          args: [],
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (TypeChecker.isStackTypeMap(resp.stack[0])) {
      assert.deepEqual(resp.stack[0].value, [
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
      ])
    } else {
      assert.fail('stack return is not Map')
    }
  })

  it('checks if the bytearray arg value is hex or base64', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
      account: account1,
    })

    const byteArrayCim = (bytearrayArg: string) => {
      return {
        invocations: [
          {
            scriptHash: testReturnContract,
            operation: 'return_same_bytes',
            args: [{ type: 'ByteArray', value: bytearrayArg }],
          },
        ],
      } as ContractInvocationMulti
    }

    // Will turn hex into base64
    let validHexValue = 'a0b1c3'
    let hexArgTxResult = await invoker.testInvoke(byteArrayCim(validHexValue))
    if (!TypeChecker.isStackTypeByteString(hexArgTxResult.stack[0])) {
      throw new Error('hexArgTxResult: stack return is not ByteString')
    }
    let hexArgTxValue = hexArgTxResult.stack[0].value
    assert.equal(hexArgTxValue, u.hex2base64(validHexValue), 'hexArgTxValue is not equal to base64 parsed value')

    validHexValue = 'A0B1C3'
    hexArgTxResult = await invoker.testInvoke(byteArrayCim(validHexValue))
    if (!TypeChecker.isStackTypeByteString(hexArgTxResult.stack[0])) {
      throw new Error('hexArgTxResult: stack return is not ByteString')
    }
    hexArgTxValue = hexArgTxResult.stack[0].value
    assert.equal(hexArgTxValue, u.hex2base64(validHexValue), 'hexArgTxValue is not equal to base64 parsed value')

    // Will use and return base64
    const validBase64Value = 'nJInjs09a2A='
    const base64ArgTxResult = await invoker.testInvoke(byteArrayCim(validBase64Value))
    if (!TypeChecker.isStackTypeByteString(base64ArgTxResult.stack[0])) {
      throw new Error('base64ArgTxResult: stack return is not ByteString')
    }
    const base64ArgTxValue = base64ArgTxResult.stack[0].value
    assert.equal(base64ArgTxValue, validBase64Value, 'base64ArgTxValue is not equal to base64 value')

    // Will consider as hex if both are possible and parse it to base64
    const validBase64AndHexValue = 'abcd'
    const base64AndHexArgTxResult = await invoker.testInvoke(byteArrayCim(validBase64AndHexValue))
    if (!TypeChecker.isStackTypeByteString(base64AndHexArgTxResult.stack[0])) {
      throw new Error('base64ArgTxResult: stack return is not ByteString')
    }
    const base64AndHexArgTxValue = base64AndHexArgTxResult.stack[0].value
    assert.equal(
      base64AndHexArgTxValue,
      u.hex2base64(validBase64AndHexValue),
      'base64AndHexArgTxValue is not equal to base64 parsed value',
    )

    // Technally, 'aBCd' is a valid hex value, however,
    // we chose to consider a string to have lower and upper case characters as a invalid hex value
    // so this means that it will be considered as base64
    const validUpperLowerValue = 'aBCd'
    const upperLowerArgTxResult = await invoker.testInvoke(byteArrayCim(validUpperLowerValue))
    if (!TypeChecker.isStackTypeByteString(upperLowerArgTxResult.stack[0])) {
      throw new Error('upperLowerArgTxResult: stack return is not ByteString')
    }
    const upperLowerArgTxValue = upperLowerArgTxResult.stack[0].value
    assert.equal(upperLowerArgTxValue, validUpperLowerValue, 'upperLowerArgTxValue is not equal to base64 parsed value')

    // Using an array with all 3 previous values should return the same values as expected above
    const arrayArgTxResult = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: testReturnContract,
          operation: 'return_same_array',
          args: [
            {
              type: 'Array',
              value: [
                { type: 'ByteArray', value: validHexValue },
                { type: 'ByteArray', value: validBase64Value },
                { type: 'ByteArray', value: validBase64AndHexValue },
              ],
            },
          ],
        },
      ],
    })
    if (!TypeChecker.isStackTypeArray(arrayArgTxResult.stack[0])) {
      throw new Error('arrayArgTxResult: stack return is not Array')
    }
    const argTxValue = arrayArgTxResult.stack[0].value
    assert.equal(argTxValue.length, 3, 'arrayArgTxValue length is not 3')
    if (!TypeChecker.isStackTypeByteString(argTxValue[0])) {
      throw new Error('argTxValue[0].value: stack return is not ByteString')
    }
    assert.equal(
      argTxValue[0].value,
      u.hex2base64(validHexValue),
      'arrayArgTxValue[0] is not equal to base64 parsed value',
    )
    if (!TypeChecker.isStackTypeByteString(argTxValue[1])) {
      throw new Error('argTxValue[1].value: stack return is not ByteString')
    }
    assert.equal(argTxValue[1].value, validBase64Value, 'arrayArgTxValue[1] is not equal to base64 value')
    if (!TypeChecker.isStackTypeByteString(argTxValue[2])) {
      throw new Error('argTxValue[2].value: stack return is not ByteString')
    }
    assert.equal(
      argTxValue[2].value,
      u.hex2base64(validBase64AndHexValue),
      'arrayArgTxValue[2] is not equal to base64 parsed value',
    )
  })

  it('tests invalid bytearray args', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress,
      account: account1,
    })

    const byteArrayCim = (bytearrayArg: string) => {
      return {
        invocations: [
          {
            scriptHash: testReturnContract,
            operation: 'return_same_bytes',
            args: [{ type: 'ByteArray', value: bytearrayArg }],
          },
        ],
      } as ContractInvocationMulti
    }

    let invalidValue = 'abc'
    await assert.rejects(
      invoker.testInvoke(byteArrayCim(invalidValue)),
      `Invalid bytearray value '${invalidValue}' should throw an error`,
    )
    invalidValue = 'çãmq'
    await assert.rejects(
      invoker.testInvoke(byteArrayCim(invalidValue)),
      `Invalid bytearray value '${invalidValue}' should throw an error`,
    )
  })
})
