import {
    ApplicationExecution,
    Neo3ApplicationLog,
    Neo3Event,
    Neo3EventListener,
    Neo3EventListenerCallback,
    Notification,
    RpcResponseStackItem,
    TypeChecker
} from '@cityofzion/neon-dappkit-types'
import { rpc } from '@cityofzion/neon-js'
import type * as NeonTypes from '@cityofzion/neon-core'

export type NeonEventListenerOptions = {
  debug?: boolean | undefined
  waitForEventMs?: number | undefined
}

export class NeonEventListener implements Neo3EventListener {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private blockPollingLoopActive = false
  private listeners = new Map<string, Map<string, Neo3EventListenerCallback[]>>()

  private readonly rpcClient: NeonTypes.rpc.RPCClient

  constructor(
    rpcUrl: string,
    private options: NeonEventListenerOptions | undefined = undefined,
  ) {
    this.rpcClient = new rpc.RPCClient(rpcUrl)
  }

  addEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void {
    const listenersOfContract = this.listeners.get(contract)
    if (!listenersOfContract) {
      this.listeners.set(contract, new Map([[eventname, [callback]]]))
    } else {
      listenersOfContract.set(eventname, [...(listenersOfContract.get(eventname) ?? []), callback])
    }
    if (!this.blockPollingLoopActive) {
      this.blockPollingLoopActive = true
      this.blockPollingLoop()
    }
  }

  removeEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void {
    const listenersOfContract = this.listeners.get(contract)
    if (listenersOfContract) {
      let listenersOfEvent = listenersOfContract.get(eventname)
      if (listenersOfEvent) {
        listenersOfEvent = listenersOfEvent.filter((l) => l !== callback)
        listenersOfContract.set(eventname, listenersOfEvent)
        if (listenersOfEvent.length === 0) {
          listenersOfContract.delete(eventname)
          if (listenersOfContract.size === 0) {
            this.listeners.delete(contract)
            if (this.listeners.size === 0) {
              this.blockPollingLoopActive = false
            }
          }
        }
      }
    }
  }

  removeAllEventListenersOfContract(contract: string) {
    this.listeners.delete(contract)
    if (this.listeners.size === 0) {
      this.blockPollingLoopActive = false
    }
  }

  removeAllEventListenersOfEvent(contract: string, eventname: string) {
    const listenersOfContract = this.listeners.get(contract)
    if (listenersOfContract) {
      listenersOfContract.delete(eventname)
      if (listenersOfContract.size === 0) {
        this.listeners.delete(contract)
        if (this.listeners.size === 0) {
          this.blockPollingLoopActive = false
        }
      }
    }
  }

  /**
   * Waits for the transaction to be completed and returns the application log
   * @param txId id od the transaction
   * @param timeout the timeout in milliseconds, if not provided, the default timeout is 30 seconds
   */
  async waitForApplicationLog(txId: string, timeout: number = 30000): Promise<Neo3ApplicationLog> {
    const maxAttempts = 20
    const waitMs = Math.floor(timeout / maxAttempts)

    const initialTime = Date.now()

    let error = new Error("Couldn't get application log")
    do {
      try {
        const log = await this.rpcClient.getApplicationLog(txId)
        return this.neonApplogToNeo3ApplicationLog(log)
      } catch (e) {
        error = e
      }
      await this.wait(waitMs)
    } while (Date.now() < initialTime + timeout)

    throw error
  }

  confirmHalt(txResult: Neo3ApplicationLog) {
    if (txResult?.executions[0]?.state !== 'HALT')
      throw new Error('Transaction failed. VMState: ' + txResult?.executions[0]?.state)
  }

  confirmStackTrue(txResult: Neo3ApplicationLog) {
    if (
      !txResult ||
      !txResult.executions ||
      txResult.executions.length === 0 ||
      !txResult.executions[0].stack ||
      txResult.executions[0].stack.length === 0
    ) {
      throw new Error('Transaction failed. No stack found in transaction result')
    }
    const stack  = txResult.executions[0].stack[0]

    if (!TypeChecker.isStackTypeBoolean(stack) || stack.value !== true) {
      throw new Error('Transaction failed. Stack value is not true')
    }
  }

  getNotificationState(txResult: Neo3ApplicationLog, eventToCheck: Neo3Event): Notification | undefined {
    return txResult?.executions[0].notifications.find((e) => {
        return e.contract === eventToCheck.contract && e.eventname === eventToCheck.eventname })
  }

  confirmTransaction(
    txResult: Neo3ApplicationLog,
    eventToCheck?: Neo3Event | undefined,
    confirmStackTrue = false,
  ): void {
    this.confirmHalt(txResult)
    if (confirmStackTrue) {
      this.confirmStackTrue(txResult)
    }
    if (eventToCheck) {
      const state = this.getNotificationState(txResult, eventToCheck)
      if (!state) {
        throw new Error('Transaction failed. Event not found in transaction result')
      }
    }
  }

  private async blockPollingLoop(): Promise<void> {
    let height = await this.rpcClient.getBlockCount()

    while (this.blockPollingLoopActive) {
      await this.wait(this.options?.waitForEventMs ?? 4000)

      try {
        this.options?.debug && console.log('Checking block ' + height)

        if (height > (await this.rpcClient.getBlockCount())) {
          this.options?.debug && console.log('Block height is ahead of node. Waiting for node to catch up...')
          continue
        }

        const block = await this.rpcClient.getBlock(height - 1, true)

        for (const transaction of block.tx) {
          if (!transaction.hash) {
            this.options?.debug && console.log('Transaction hash not found. Skipping transaction')
            continue
          }

          const neonLog = await this.rpcClient.getApplicationLog(transaction.hash)
          const log = this.neonApplogToNeo3ApplicationLog(neonLog)

          for (const notification of log.executions[0].notifications) {
            const listenersOfContract = this.listeners.get(notification.contract)
            if (!listenersOfContract) {
              this.options?.debug && console.log('No listeners for contract ' + notification.contract)
              continue
            }

            const listenersOfEvent = listenersOfContract.get(notification.eventname)
            if (!listenersOfEvent) {
              this.options?.debug && console.log('No listeners for event ' + notification.eventname)
              continue
            }

            for (const listener of listenersOfEvent) {
              try {
                this.options?.debug && console.log('Calling listener')
                listener(notification)
              } catch (e) {
                this.options?.debug && console.error(e)
              }
            }
          }
        }

        height++ // this is important to avoid skipping blocks when the code throws exceptions
      } catch (error) {
        this.options?.debug && console.error(error)
      }
    }

    this.options?.debug && console.log('Block polling loop stopped')
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private neonApplogToNeo3ApplicationLog(log: NeonTypes.rpc.ApplicationLogJson): Neo3ApplicationLog {
      const executions = log.executions.map(execution => {
          return {
              trigger: execution.trigger,
              state: execution.vmstate,
              gasconsumed: execution.gasconsumed,
              stack: execution.stack.map(si => {
                  return {type: si.type, value: si.value} as RpcResponseStackItem
              }),
              notifications: execution.notifications.map(notification => {
                  return {
                      contract: notification.contract,
                      eventname: notification.eventname,
                      state: {type: notification.state.type, value: notification.state.value}
                  } as Notification
              })
          } as ApplicationExecution
      })
      return {
          txid: log.txid,
          executions
      } as Neo3ApplicationLog
  }

}
