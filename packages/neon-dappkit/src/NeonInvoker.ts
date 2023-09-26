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
    const accountArr = this.normalizeAccountArray(this.options.account)
    const script = this.buildScriptHex(cim)

    const rpcResult = await new rpc.RPCClient(this.options.rpcAddress).invokeScript(
      u.HexString.fromHex(script),
      accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined,
    )
    if (rpcResult.state === 'FAULT') throw Error(`Execution state is FAULT. Exception: ${rpcResult.exception}`)

    return { ...rpcResult, stack: rpcResult.stack as RpcResponseStackItem[] }
  }

  async invokeFunction(cimOrBt: ContractInvocationMulti | BuiltTransaction): Promise<string> {
    const accountArr = this.normalizeAccountArray(this.options.account)
    const transaction = await this.buildTransactionFromCimOrBt(cimOrBt, accountArr)
    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const signedTransaction = await this.signTransactionByAccounts(transaction, accountArr)
    return await rpcClient.sendRawTransaction(signedTransaction)
  }

  async signTransaction(cimOrBt: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction> {
    const accountArr = this.normalizeAccountArray(this.options.account)
    const transaction = await this.buildTransactionFromCimOrBt(cimOrBt, accountArr)
    const signedTransaction = await this.signTransactionByAccounts(transaction, accountArr)
    const signedTransactionJson = signedTransaction.toJson()

    return {
      ...cimOrBt,
      hash: signedTransactionJson.hash,
      script: u.base642hex(signedTransactionJson.script),
      nonce: signedTransactionJson.nonce,
      version: signedTransactionJson.version,
      size: signedTransactionJson.size,
      validUntilBlock: signedTransactionJson.validuntilblock,
      witnesses: signedTransactionJson.witnesses,
      networkFee: signedTransactionJson.netfee,
      systemFee: signedTransactionJson.sysfee,
    }
  }

  async calculateFee(cimOrBt: ContractInvocationMulti): Promise<CalculateFee> {
    const accountArr = this.normalizeAccountArray(this.options.account)
    const transaction = await this.buildTransactionFromCimOrBt(cimOrBt, accountArr)

    return {
      networkFee: transaction.networkFee,
      systemFee: transaction.systemFee,
      total: Number(transaction.networkFee.add(transaction.systemFee).toDecimal(8)),
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

  static convertParams(args: ExtendedArg[] | undefined): NeonTypes.sc.ContractParam[] {
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

  static buildSigner(optionsAccount: NeonTypes.wallet.Account | undefined, signerEntry?: Signer): NeonTypes.tx.Signer {
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

  static buildMultipleSigner(
    optionAccounts: NeonTypes.wallet.Account[],
    signers: Signer[] = [],
  ): NeonTypes.tx.Signer[] {
    const allSigners: NeonTypes.tx.Signer[] = []
    for (let i = 0; i < Math.max(signers.length, optionAccounts.length); i++) {
      allSigners.push(this.buildSigner(optionAccounts?.[i], signers?.[i]))
    }
    return allSigners
  }

  private normalizeAccountArray(
    acc: NeonTypes.wallet.Account | NeonTypes.wallet.Account[] | undefined,
  ): NeonTypes.wallet.Account[] {
    if (!acc) {
      return []
    }

    if (Array.isArray(acc)) {
      return acc
    }

    return [acc]
  }

  private buildScriptHex(cim: ContractInvocationMulti): string {
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

  private async signTransactionByAccounts(
    transaction: NeonTypes.tx.Transaction,
    accountArr: NeonTypes.wallet.Account[],
  ): Promise<NeonTypes.tx.Transaction> {
    let txClone = new tx.Transaction(transaction)

    for (const account of accountArr) {
      if (this.options.signingCallback) {
        transaction.addWitness(
          new tx.Witness({
            invocationScript: '',
            verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
          }),
        )

        const facade = await api.NetworkFacade.fromConfig({
          node: this.options.rpcAddress,
        })

        txClone = await facade.sign(transaction, {
          signingCallback: this.options.signingCallback,
        })
      } else {
        txClone.sign(account, this.options.networkMagic)
      }
    }

    return txClone
  }

  private async buildTransactionFromCimOrBt(
    cimOrBt: ContractInvocationMulti | BuiltTransaction,
    accountArr: NeonTypes.wallet.Account[],
  ): Promise<NeonTypes.tx.Transaction> {
    const cimHexString = this.buildScriptHex(cimOrBt)
    const signers = NeonInvoker.buildMultipleSigner(accountArr, cimOrBt.signers)

    if ('script' in cimOrBt) {
      if (cimOrBt.script !== cimHexString) {
        throw new Error(
          'The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti',
        )
      }

      return new tx.Transaction({
        validUntilBlock: cimOrBt.validUntilBlock,
        version: cimOrBt.version,
        nonce: cimOrBt.nonce,
        script: cimOrBt.script,
        systemFee: cimOrBt.systemFee,
        networkFee: cimOrBt.networkFee,
        witnesses: cimOrBt.witnesses.map((witness) => tx.Witness.fromJson(witness)),
        signers,
      })
    }

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    const transaction = new tx.Transaction({
      script: u.HexString.fromHex(cimHexString),
      validUntilBlock: currentHeight + this.options.validBlocks,
      signers,
    })

    const systemFee = await this.getSystemFee(cimOrBt)
    const networkFee = await this.getNetworkFee(cimOrBt, rpcClient, accountArr, transaction)
    transaction.networkFee = networkFee
    transaction.systemFee = systemFee

    return transaction
  }

  private async getNetworkFee(
    cim: ContractInvocationMulti,
    rpcClient: NeonTypes.rpc.RPCClient,
    accountArr: NeonTypes.wallet.Account[],
    transaction: NeonTypes.tx.Transaction,
  ): Promise<NeonTypes.u.BigInteger> {
    if (cim.networkFeeOverride) {
      return u.BigInteger.fromNumber(cim.networkFeeOverride)
    }

    const txClone = new tx.Transaction(transaction)
    // Add one witness for each signer, using the first account as placeholder if there is no account for the respective signer
    // This is needed to calculate the network fee, since the signer is considered to calculate the fee and we need
    // the same number of witnesses as signers, otherwise the fee calculation will fail
    txClone.signers.forEach((signer) => {
      const account = accountArr.find((account) => account.scriptHash === signer.account.toString()) ?? accountArr[0]
      if (!account) throw new Error('You need to provide at least one account to calculate the network fee.')

      txClone.addWitness(
        new tx.Witness({
          invocationScript: '',
          verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
        }),
      )
    })

    const networkFee = await api.smartCalculateNetworkFee(txClone, rpcClient)

    return networkFee.add(cim.extraNetworkFee ?? 0)
  }

  private async getSystemFee(cimOrBt: ContractInvocationMulti): Promise<NeonTypes.u.BigInteger> {
    if (cimOrBt.systemFeeOverride) {
      return u.BigInteger.fromNumber(cimOrBt.systemFeeOverride)
    }

    const { gasconsumed } = await this.testInvoke(cimOrBt)
    const systemFee = u.BigInteger.fromNumber(gasconsumed)

    return systemFee.add(cimOrBt.extraSystemFee ?? 0)
  }
}

export { typeChecker }
