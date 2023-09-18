import {
  ContractInvocationMulti,
  Signer,
  Neo3Invoker,
  Arg,
  InvokeResult,
  RpcResponseStackItem,
  BuiltTransaction,
} from '@cityofzion/neon-dappkit-types'
import { tx, u, rpc, sc, api, wallet } from '@cityofzion/neon-js'
import type * as NeonTypes from '@cityofzion/neon-core'
import * as typeChecker from './typeChecker'

export type CalculateFee = {
  networkFee: NeonTypes.u.BigInteger
  systemFee: NeonTypes.u.BigInteger
  total: number
}

export type ExtendedArg = Arg | { type: 'Address'; value: string } | { type: 'ScriptHash'; value: string }

export type InitOptions = {
  rpcAddress: string
  account?: NeonTypes.wallet.Account | NeonTypes.wallet.Account[]
  signingCallback?: api.SigningFunction
}

export type Options = InitOptions & {
  networkMagic: number
  validBlocks: number
}
export class NeonInvoker implements Neo3Invoker {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private constructor(public options: Options) {}

  async testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)
    const script = NeonInvoker.buildScriptHex(cim)

    const rpcResult = await new rpc.RPCClient(this.options.rpcAddress).invokeScript(
      u.HexString.fromHex(script),
      accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined,
    )
    if (rpcResult.state === 'FAULT') throw Error(`Execution state is FAULT. Exception: ${rpcResult.exception}`)

    return { ...rpcResult, stack: rpcResult.stack as RpcResponseStackItem[] }
  }
  async invokeFunction(cim: ContractInvocationMulti | BuiltTransaction): Promise<string> {
    const trx = await this.cimOrBtToSignedTx(cim)
    return await this.invokeTx(trx)
  }

  async signTransaction(cim: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction> {
    return NeonInvoker.cimAndTxToBt(cim, await this.cimOrBtToSignedTx(cim))
  }

  private async cimToTx(cim: ContractInvocationMulti): Promise<NeonTypes.tx.Transaction> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)

    const script = NeonInvoker.buildScriptHex(cim)

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    const trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + this.options.validBlocks,
      signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
    })

    if (cim.systemFeeOverride) {
      trx.systemFee = u.BigInteger.fromNumber(cim.systemFeeOverride)
    } else {
      const { gasconsumed } = await this.testInvoke(cim)
      const systemFee = u.BigInteger.fromNumber(gasconsumed) // TODO: isn't this gasconsumed for both system and network fee?
      trx.systemFee = systemFee.add(cim.extraSystemFee ?? 0)
    }

    if (cim.networkFeeOverride) {
      trx.networkFee = u.BigInteger.fromNumber(cim.networkFeeOverride)
    } else {
      const networkFee = await this.smartCalculateNetworkFee(trx, rpcClient)
      trx.networkFee = networkFee.add(cim.extraNetworkFee ?? 0)
    }

    return trx
  }

  private async smartCalculateNetworkFee(
      trx: NeonTypes.tx.Transaction,
      rpcClient: NeonTypes.rpc.RPCClient
  ): Promise<NeonTypes.u.BigInteger> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)
    const trxClone = new tx.Transaction(trx)

    // TODO: do I need to add all the witnesses only to calculate fee?
    // R: Probably not, but I'm not sure.
    for (const account of accountArr) {
      if (account) {
        trxClone.addWitness(
            new tx.Witness({
              invocationScript: '',
              verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
            }),
        )
      }
    }

    // This is not working when
    return await api.smartCalculateNetworkFee(trxClone, rpcClient)
  }

  private async signTx(trx: NeonTypes.tx.Transaction): Promise<NeonTypes.tx.Transaction> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)

    for (const i in accountArr) {
      const account = accountArr[i]
      if (account) {
        if (this.options.signingCallback) {
          trx.addWitness(
            new tx.Witness({
              invocationScript: '',
              verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
            }),
          )

          const facade = await api.NetworkFacade.fromConfig({
            node: this.options.rpcAddress,
          })

          trx = await facade.sign(trx, {
            signingCallback: this.options.signingCallback,
          })
        } else {
          trx.sign(account, this.options.networkMagic)
        }
      }
    }

    return trx
  }

  private async invokeTx(trx: NeonTypes.tx.Transaction): Promise<string> {
    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    return await rpcClient.sendRawTransaction(trx)
  }

  private async cimOrBtToSignedTx(cim: ContractInvocationMulti | BuiltTransaction): Promise<NeonTypes.tx.Transaction> {
    let trx: NeonTypes.tx.Transaction
    if (NeonInvoker.isBt(cim)) {
      const bt: BuiltTransaction = cim
      if (u.base642hex(bt.script) !== NeonInvoker.buildScriptHex(bt)) {
        throw new Error(
          'The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti',
        )
      }
      trx = NeonInvoker.btToTx(bt)
    } else {
      trx = await this.cimToTx(cim)
    }
    return await this.signTx(trx)
  }

  private static isBt(cim: ContractInvocationMulti | BuiltTransaction): cim is BuiltTransaction {
    return (<BuiltTransaction>cim).script !== undefined
  }

  private static btToTx(bt: BuiltTransaction): NeonTypes.tx.Transaction {
    const trx = Object.assign(bt, { sender: '', attributes: [] })
    return tx.Transaction.fromJson(trx as NeonTypes.tx.TransactionJson)
  }

  private static cimAndTxToBt(cim: ContractInvocationMulti, trx: NeonTypes.tx.Transaction): BuiltTransaction {
    return Object.assign(cim, trx.toJson(), { signers: cim.signers }) as BuiltTransaction
  }

  async calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee> {
    const tx = await this.cimToTx(cim)

    return {
      networkFee: tx.networkFee,
      systemFee: tx.systemFee,
      total: Number(tx.networkFee.add(tx.systemFee).toDecimal(8)),
    }
  }

  async traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<RpcResponseStackItem[]> {
    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const result = await rpcClient.traverseIterator(sessionId, iteratorId, count)

    return result.map((item): RpcResponseStackItem => ({ value: item.value as any, type: item.type as any }))
  }

  static async init(options: InitOptions): Promise<NeonInvoker> {
    const networkMagic = await this.getMagicOfRpcAddress(options.rpcAddress)
    return new NeonInvoker({ ...options, validBlocks: 100, networkMagic })
  }

  static async getMagicOfRpcAddress(rpcAddress: string): Promise<number> {
    const resp = await new rpc.RPCClient(rpcAddress).getVersion()
    return resp.protocol.network
  }

  private static buildScriptHex(cim: ContractInvocationMulti): string {
    const sb = new sc.ScriptBuilder()

    cim.invocations.forEach((c) => {
      sb.emitContractCall({
        scriptHash: c.scriptHash,
        operation: c.operation,
        args: NeonInvoker.convertParams(c.args),
      })

      if (c.abortOnFail) {
        sb.emit(0x39)
      }
    })

    return sb.build()
  }

  private static convertParams(args: ExtendedArg[] | undefined): NeonTypes.sc.ContractParam[] {
    return (args ?? []).map((a) => {
      if (a.type === undefined) throw new Error('Invalid argument type')
      if (a.value === undefined) throw new Error('Invalid argument value')

      switch (a.type) {
        case 'Any':
          return sc.ContractParam.any(a.value)
        case 'String':
          return sc.ContractParam.string(a.value)
        case 'Boolean':
          return sc.ContractParam.boolean(a.value)
        case 'PublicKey':
          return sc.ContractParam.publicKey(a.value)
        case 'ScriptHash':
          return sc.ContractParam.hash160(u.HexString.fromHex(a.value))
        case 'Address':
        case 'Hash160':
          return sc.ContractParam.hash160(a.value)
        case 'Hash256':
          return sc.ContractParam.hash256(a.value)
        case 'Integer':
          return sc.ContractParam.integer(a.value)
        case 'Array':
          return sc.ContractParam.array(...this.convertParams(a.value))
        case 'Map':
          return sc.ContractParam.map(
            ...a.value.map((map) => ({
              key: this.convertParams([map.key])[0],
              value: this.convertParams([map.value])[0],
            })),
          )
        case 'ByteArray':
          return sc.ContractParam.byteArray(u.hex2base64(a.value))
      }
    })
  }

  private static buildSigner(optionsAccount: NeonTypes.wallet.Account | undefined, signerEntry?: Signer): NeonTypes.tx.Signer {
    let scopes = signerEntry?.scopes ?? 'CalledByEntry'
    if (typeof scopes === 'number') {
      scopes = tx.toString(scopes)
    }

    const account = signerEntry?.account ?? optionsAccount?.scriptHash
    if (!account) throw new Error('You need to provide at least one account to sign.')

    return tx.Signer.fromJson({
      scopes,
      account,
      allowedcontracts: signerEntry?.allowedContracts,
      allowedgroups: signerEntry?.allowedGroups,
      rules: signerEntry?.rules,
    })
  }

  private static buildMultipleSigner(
    optionAccounts: (NeonTypes.wallet.Account | undefined)[],
    signers?: Signer[],
  ): NeonTypes.tx.Signer[] | undefined {
    const response: NeonTypes.tx.Signer[] = []
    for (let i = 0; i < Math.max(signers?.length ?? 0, optionAccounts.length ?? 0); i++) {
      response.push(this.buildSigner(optionAccounts?.[i], signers?.[i]))
    }
    return response
  }

  private static normalizeArray<T>(objOrArray: T | T[] | undefined): (T | undefined)[] {
    if (Array.isArray(objOrArray)) {
      return objOrArray
    } else {
      return [objOrArray]
    }
  }
}

export { typeChecker }
