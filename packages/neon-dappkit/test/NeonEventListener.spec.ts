import { ChildProcess, spawn } from 'child_process'
import { NeonEventListener, NeonInvoker, NeonParser } from '../src'
import assert from 'assert'
import {
    ContractInvocationMulti,
    Neo3ApplicationLog,
    Neo3EventListenerCallback,
    Notification,
    TypeChecker,
} from '@cityofzion/neon-dappkit-types'
import { wallet } from '@cityofzion/neon-core'
import {
  wait,
  neoGoPath,
  getDataDir,
  transferInvocation,
  waitTime,
  rpcAddress,
  gasScriptHash,
  neonEventListenerOptions,
} from './helper'

describe('NeonEventListener', function () {
  this.timeout(60000)
  let childProcess: ChildProcess
  const eventListener = new NeonEventListener(rpcAddress, neonEventListenerOptions)
  let accountWithGas: wallet.Account

  function gasTransferInvocation(
    sender: wallet.Account,
    receiver: wallet.Account,
    amount: string,
  ): ContractInvocationMulti {
    return transferInvocation(gasScriptHash, sender, receiver, amount)
  }

  beforeEach(async function () {
    const neoGo = neoGoPath()
    const dataDir = getDataDir()

    childProcess = spawn(
      neoGo,
      ['node', '--config-file', `${dataDir}/protocol.unit_testnet.single.yml`, '--relative-path', dataDir],
      {},
    )
    await wait(waitTime)

    accountWithGas = new wallet.Account(
      await wallet.decrypt('6PYM8VdX3hY4B51UJxmm8D41RQMbpJT8aYHibyQ67gjkUPmvQgu51Y5UQR', 'one', { n: 2, r: 1, p: 1 }),
    )

    await wait(waitTime)

    return true
  })

  afterEach('Tear down', async function () {
    return childProcess.kill()
  })

  it('does execute neoGo', async () => {
    assert(childProcess !== undefined, 'child process running neo-go is set')
  })

  it('adds an eventListener', async () => {
    const eventName = 'Transfer'

    const eventPromise = new Promise<Notification>((resolve) => {
      const callBack = (notification: Notification) => {
        resolve(notification)

        eventListener.removeAllEventListenersOfEvent(gasScriptHash, eventName)
      }

      eventListener.addEventListener(gasScriptHash, eventName, callBack)
    })

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    const notification = await eventPromise

    assert(notification.contract === gasScriptHash, 'Notification should be sent by NeoToken')
    assert(notification.eventname === eventName, `Notification should be ${eventName}`)
    assert(notification.state !== undefined, 'Notification should return value')
    assert(TypeChecker.isStackTypeArray(notification.state), 'Notification value should be an array')
  })

  it('adds eventListeners on the same event', async () => {
    const eventName = 'Transfer'

    const eventPromise1 = new Promise<Notification>((resolve) => {
      const callBack1 = (notification: Notification) => {
        resolve(notification)

        eventListener.removeAllEventListenersOfEvent(gasScriptHash, eventName)
      }

      eventListener.addEventListener(gasScriptHash, eventName, callBack1)
    })

    const eventPromise2 = new Promise<Notification>((resolve) => {
      const callBack2 = (notification: Notification) => {
        resolve(notification)

        eventListener.removeAllEventListenersOfEvent(gasScriptHash, eventName)
      }

      eventListener.addEventListener(gasScriptHash, eventName, callBack2)
    })

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    const notification1 = await eventPromise1
    const notification2 = await eventPromise2

    assert(notification1.contract === notification2.contract, 'Notification contract should be the same')
    assert(notification1.eventname === notification2.eventname, 'Notification event name should be the same')
    assert(notification1.state === notification2.state, 'Notification state should be the same')
  })

  it('adds eventListener to an event that does not exist', async () => {
    eventListener.addEventListener(gasScriptHash, 'DoesNotExist', (arg) => arg)

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)

    eventListener.removeAllEventListenersOfContract(gasScriptHash)
  })

  it('adds eventListener to a smart contract that does not exist', async () => {
    const fakeScriptHash = '0x0123456789012345678901234567890123456789'
    eventListener.addEventListener(fakeScriptHash, 'DoesNotExist', (arg) => arg)

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)

    eventListener.removeAllEventListenersOfContract(fakeScriptHash)
  })

  it('adds eventListener that callback throws an error', async () => {
    const eventName = 'Transfer'

    const eventPromise = new Promise<Notification>((resolve, reject) => {
      const callBack = () => {
        reject('Error')
        eventListener.removeAllEventListenersOfEvent(gasScriptHash, eventName)
        throw 'Error'
      }

      eventListener.addEventListener(gasScriptHash, eventName, callBack)
    })

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await assert.rejects(async () => eventPromise)
  })

  it('removes an eventListener', async () => {
    const eventName = 'Transfer'
    let called = 0

    const callBack: Neo3EventListenerCallback = (notification: Notification) => {
      assert(notification)
      called += 1
    }

    eventListener.addEventListener(gasScriptHash, eventName, callBack)

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    let txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, 'Callback should be called once')

    eventListener.removeEventListener(gasScriptHash, eventName, callBack)
    txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, "Callback isn't called after removeEventListener")
  })

  it('removes all eventListeners of a contract', async () => {
    const eventName = 'Transfer'
    let called = 0

    const callBack: Neo3EventListenerCallback = (notification: Notification) => {
      assert(notification)
      called += 1
    }

    eventListener.addEventListener(gasScriptHash, eventName, callBack)

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    let txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, 'Callback should be called once')

    eventListener.removeAllEventListenersOfContract(gasScriptHash)
    txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, "Callback isn't called after removeEventListener")
  })

  it('removes all eventListeners of an event', async () => {
    const eventName = 'Transfer'
    let called = 0

    const callBack: Neo3EventListenerCallback = (notification: Notification) => {
      assert(notification)
      called += 1
    }

    eventListener.addEventListener(gasScriptHash, eventName, callBack)

    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })

    let txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, 'Callback should be called once')

    eventListener.removeAllEventListenersOfEvent(gasScriptHash, eventName)
    txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    assert(txId, 'Transaction ID should be returned')

    await wait(waitTime)
    assert(called === 1, "Callback isn't called after removeEventListener")
  })

  it('waits for the application log', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))

    const applicationLog = await eventListener.waitForApplicationLog(txId)

    assert(applicationLog.txid === txId, 'Transaction ID should be the same')
    assert(applicationLog.executions.length === 1, 'There should be one execution')
    assert(applicationLog.executions[0].trigger === 'Application', 'Trigger should be Application')
    assert(applicationLog.executions[0].state === 'HALT', 'VMState should be HALT')
    assert(applicationLog.executions[0].gasconsumed !== undefined, 'Gas consumed should be returned')
    assert(applicationLog.executions[0].stack.length === 1, 'Stack should be returned')
    assert(applicationLog.executions[0].stack[0].type === 'Boolean', 'Stack type should be a boolean')
    assert(applicationLog.executions[0].stack[0].value === true, 'Stack value should be true')
    assert(applicationLog.executions[0].notifications.length === 1, 'Notification should be returned')
    assert(
      applicationLog.executions[0].notifications[0].contract === gasScriptHash,
      'Notification should be sent by GasToken',
    )
    assert(applicationLog.executions[0].notifications[0].eventname === 'Transfer', 'Notification should be Transfer')
    assert(
      applicationLog.executions[0].notifications[0].state.type === 'Array',
      'Notification state should be an array',
    )
    assert(applicationLog.executions[0].notifications[0].state.value, 'Transfer notification should be emitted')
  })

  it('exceeds the time to await for the application log', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))

    await assert.rejects(eventListener.waitForApplicationLog(txId, 1))
  })

  it('confirms Halt', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    const applicationLog = await eventListener.waitForApplicationLog(txId)

    eventListener.confirmHalt(applicationLog)
  })

  it('confirms Halt on a fault state', async () => {
    const applicationLog: Neo3ApplicationLog = {
      txid: '',
      executions: [
        {
          trigger: 'Application',
          state: 'FAULT',
          gasconsumed: '0',
          notifications: [],
          exception:"",
          stack: []
        },
      ],
    }

    assert.throws(() => eventListener.confirmHalt(applicationLog))
  })

  it('confirms stack true', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    const applicationLog = await eventListener.waitForApplicationLog(txId)

    eventListener.confirmStackTrue(applicationLog)

    const txIdFalse = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '-100'))
    const applicationLogFalse = await eventListener.waitForApplicationLog(txIdFalse)

    await assert.rejects(async () => {
      eventListener.confirmStackTrue(applicationLogFalse)
    })
  })

  it('confirms stack true on an empty stack', async () => {
    const applicationLog: Neo3ApplicationLog = {
      txid: '',
      executions: [],
    }

    assert.throws(() => eventListener.confirmStackTrue(applicationLog))
  })

  it('gets the notification state', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    const applicationLog = await eventListener.waitForApplicationLog(txId)

    const notificationState = eventListener.getNotificationState(applicationLog, {
      contract: gasScriptHash,
      eventname: 'Transfer',
    })

    assert(notificationState !== undefined, 'Notification state should be returned')
    assert(TypeChecker.isStackTypeArray(notificationState.state), 'Notification state should be an array')

    const senderStack = notificationState.state.value[0]
    assert(TypeChecker.isStackTypeByteString(senderStack), 'Sender should be a byte string')
    assert(
      NeonParser.reverseHex(NeonParser.base64ToHex(senderStack.value)) === sender.scriptHash,
      'Sender should be the first element',
    )

    const receiverStack = notificationState.state.value[1]
    assert(TypeChecker.isStackTypeByteString(receiverStack), 'Receiver should be a byte string')
    assert(
      NeonParser.reverseHex(NeonParser.base64ToHex(receiverStack.value)) === receiver.scriptHash,
      'Receiver should be the second element',
    )

    const amountStack = notificationState.state.value[2]
    assert(TypeChecker.isStackTypeInteger(amountStack), 'Amount should be an integer')
    assert(amountStack.value === '100', 'Amount should be the third element')
  })

  it('confirms a transaction', async () => {
    const sender = accountWithGas
    const receiver = new wallet.Account()

    const neoInvoker = await NeonInvoker.init({ rpcAddress, account: sender })
    const txId = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '100'))
    const applicationLog = await eventListener.waitForApplicationLog(txId)

    eventListener.confirmTransaction(applicationLog)
    eventListener.confirmTransaction(applicationLog, { contract: gasScriptHash, eventname: 'Transfer' })
    eventListener.confirmTransaction(applicationLog, { contract: gasScriptHash, eventname: 'Transfer' }, true)

    const txIdFalse = await neoInvoker.invokeFunction(gasTransferInvocation(sender, receiver, '-100'))
    const applicationLogFalse = await eventListener.waitForApplicationLog(txIdFalse)

    eventListener.confirmTransaction(applicationLogFalse)
    await assert.rejects(async () => {
      eventListener.confirmTransaction(applicationLogFalse, { contract: gasScriptHash, eventname: 'Transfer' })
    })
    await assert.rejects(async () => {
      eventListener.confirmTransaction(applicationLogFalse, { contract: gasScriptHash, eventname: 'Transfer' }, true)
    })
  })
})
