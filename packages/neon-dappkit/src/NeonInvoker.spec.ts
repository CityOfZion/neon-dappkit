import { ContractInvocationMulti } from '@cityofzion/neon-dappkit-types'
import { NeonInvoker, NeonParser, TypeChecker } from './index'
import { wallet, tx } from '@cityofzion/neon-js'
import assert from 'assert'

async function getBalance(invoker: NeonInvoker, address: string) {
  const payerBalanceResp = await invoker.testInvoke({
    invocations: [
      {
        operation: 'balanceOf',
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        args: [{ value: address, type: 'Hash160' }],
      },
    ],
  })
  return NeonParser.parseRpcResponse(payerBalanceResp.stack[0]) / Math.pow(10, 8)
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function toDecimal(num: number, decimal: number) {
  return num / 10 ** decimal
}

describe('NeonInvoker', function () {
  this.timeout(60000)

  it('does invokeFunction', async () => {
    const account = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account,
    })

    const txId = await invoker.invokeFunction({
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
    })

    assert(txId.length > 0, 'has txId')
    await wait(15000)
  })

  it('does invokeFunction with signingCallback', async () => {
    const publicAccount = new wallet.Account('02eecb8c0c3ae4e3c65457581c8c8dc0ecf52f74953166ce84d3c5b67a42a1ee73')
    const privateAccount = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')

    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      signingCallback: async (transaction, details) => {
        const hex = NeonParser.numToHex(details.network, 4, true) + NeonParser.reverseHex(transaction.hash())
        return wallet.sign(hex, privateAccount.privateKey)
      },
      account: publicAccount,
    })

    const txId = await invoker.invokeFunction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: publicAccount.address },
            { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
      signers: [
        {
          account: publicAccount.scriptHash,
          scopes: tx.WitnessScope.CalledByEntry,
          rules: [],
        },
      ],
    })

    assert(txId.length > 0, 'has txId')
    await wait(15000)
  })

  it('can sign and invoke using different NeonInvokers/accounts', async () => {
    const accountPayer = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014') // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv
    const accountOwner = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8') // NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr

    // TEST WITH BOTH ACCOUNTS ON THE SAME INVOKER

    const invokerBoth = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: [accountPayer, accountOwner],
    })

    const txBoth = await invokerBoth.invokeFunction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountOwner.address }, // owner is sending to payer but the payer is paying for the tx
            { type: 'Hash160', value: accountPayer.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
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

    await wait(15000)

    // TEST WITH EACH ACCOUNT ON A DIFFERENT INVOKER

    const invokerPayer = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountPayer,
    })

    const invokerOwner = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountOwner,
    })

    const payerBalance = await getBalance(invokerPayer, accountPayer.address)
    const ownerBalance = await getBalance(invokerOwner, accountOwner.address)

    const bt = await invokerPayer.signTransaction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountOwner.address }, // owner is sending to payer but the payer is paying for the tx
            { type: 'Hash160', value: accountPayer.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
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

    await wait(15000)

    const payerBalance2 = await getBalance(invokerPayer, accountPayer.address)
    const ownerBalance2 = await getBalance(invokerOwner, accountOwner.address)

    assert(
      payerBalance2 > payerBalance + 0.8,
      `payer balance (${payerBalance2}) increased by almost 1 (was ${payerBalance})`,
    )
    assert(
      payerBalance2 < payerBalance + 1,
      `payer balance (${payerBalance2}) increased by almost 1 (was ${payerBalance})`,
    )
    assert.equal(ownerBalance2, ownerBalance - 1, 'owner balance decreased by 1')

    await wait(15000)
  })

  it('can sign and invoke with signingCallback using different NeonInvokers/accounts', async () => {
    const accountSignCallback = new wallet.Account('02eecb8c0c3ae4e3c65457581c8c8dc0ecf52f74953166ce84d3c5b67a42a1ee73')
    const privateAccount = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')

    const accountSignPrivKey = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014') // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv

    const invokerSignCallback = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      signingCallback: async (transaction, details) => {
        const hex = NeonParser.numToHex(details.network, 4, true) + NeonParser.reverseHex(transaction.hash())
        return wallet.sign(hex, privateAccount.privateKey)
      },
      account: accountSignCallback,
    })

    const invokerSignPrivKey = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountSignPrivKey,
    })

    let bt = await invokerSignCallback.signTransaction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountSignCallback.address },
            { type: 'Hash160', value: accountSignPrivKey.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
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

    await wait(15000)

    bt = await invokerSignPrivKey.signTransaction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountSignPrivKey.address },
            { type: 'Hash160', value: accountSignCallback.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
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

    await wait(15000)
  })

  it('add accounts and witnesses to verify smart contracts', async () => {
    const account = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account,
    })

    // A smart contract that always return True on verify
    const verifyTrueSmartContract = '0x7aa88cc764b80cae2267d4fdf63cd09f7e9baeba'

    // NeoToken smart contract, we are not verified
    const verifyFalseSmartContract = '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5'

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
      {
        name: 'Error',
        message: 'Invalid',
      },
    )
  })

  it("can throw an error if the signed transaction doesn't match the invocation", async () => {
    const accountPayer = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014') // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv
    const accountOwner = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8') // NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr

    const invokerPayer = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountPayer,
    })

    const invokerOwner = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountOwner,
    })

    const bt = await invokerPayer.signTransaction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountOwner.address }, // owner is sending to payer but the payer is paying for the tx
            { type: 'Hash160', value: accountPayer.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
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
      {
        name: 'Error',
        message:
          'The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti',
      },
    )
  })

  it('does calculateFee', async () => {
    const account = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
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

    assert(Number(networkFeeOverridden) === toDecimal(20000, 8), 'has networkFee overridden')
    assert(Number(systemFeeOverridden) === toDecimal(10000, 8), 'has systemFee overridden')

    const { networkFee: networkFeeExtra, systemFee: systemFeeExtra } = await invoker.calculateFee({
      extraNetworkFee: 20000,
      extraSystemFee: 10000,
      ...param,
    })

    assert(Number(networkFeeExtra) === Number(networkFee) + toDecimal(20000, 8), 'has networkFee overridden')
    assert(Number(systemFeeExtra) === Number(systemFee) + toDecimal(10000, 8), 'has systemFee overridden')
  })

  it('does testInvoke', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
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
      rpcAddress: NeonInvoker.TESTNET,
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
      {
        name: 'Error',
        message:
          'Execution state is FAULT. Exception: Method "transfer" with 3 parameter(s) doesn\'t exist in the contract 0xd2a4cff31913016155e38e474a2c06d08be276cf.',
      },
    )
  })

  it('handles integer return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'negative_number',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_true',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_false',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: true }],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_true',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_false',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [{ type: 'Boolean', value: true }],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_str',
          args: [],
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
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
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x8b43ab0c83b7d12cf35a0e780072bc314a688796',
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
})
