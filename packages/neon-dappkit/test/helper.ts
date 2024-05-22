import { ContractInvocationMulti } from '@cityofzion/neon-dappkit-types'
import { NeonInvoker, NeonParser } from '../src/index'
import * as path from 'path'
import { wallet } from '@cityofzion/neon-core'

export const rpcAddress = 'http://127.0.0.1:30222'
export const gasScriptHash = '0xd2a4cff31913016155e38e474a2c06d08be276cf'
export const neoScriptHash = '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5'
export const waitTime = 1000
export const neonEventListenerOptions = {
  waitForApplicationLog: { maxAttempts: 10, waitMs: 100 },
  waitForEventMs: 100,
}

export function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function neoGoPath() {
  return path.resolve(path.join(__dirname, '..', 'neogo', 'neogo'))
}

export function getDataDir() {
  return path.resolve(path.join(__dirname, '..', 'data'))
}

export function toDecimal(num: number, decimal: number) {
  return num / 10 ** decimal
}

export function transferInvocation(
  smartContract: string,
  sender: wallet.Account,
  receiver: wallet.Account,
  amount: string,
): ContractInvocationMulti {
  return {
    invocations: [
      {
        scriptHash: smartContract,
        operation: 'transfer',
        args: [
          { type: 'Hash160', value: sender.address },
          { type: 'Hash160', value: receiver.address },
          { type: 'Integer', value: amount },
          { type: 'String', value: 'test' },
        ],
      },
    ],
  }
}

export async function getBalance(invoker: NeonInvoker, address: string) {
  const payerBalanceResp = await invoker.testInvoke({
    invocations: [
      {
        operation: 'balanceOf',
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        args: [{ value: address, type: 'Hash160' }],
      },
    ],
  })
  return NeonParser.parseRpcResponse(payerBalanceResp.stack[0])
}
