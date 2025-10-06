import {InvokeBase, Notification} from "./Neo3Invoker";

/**
 * An interface that defines the event contract and event name
 */
export interface Neo3Event {
  contract: string
  eventname: string
}

/**
 * The event listener callback
 */
export type Neo3EventListenerCallback = (event: Notification) => void

/**
 * An interface that defines an application execution format
 */
export interface ApplicationExecution extends InvokeBase {
    trigger: string
}

/**
 * An interface that defines the application log format
 */
export interface Neo3ApplicationLog {
  txid: string
  executions: ApplicationExecution[]
}

/**
 * The entry point of the library
 */
export interface Neo3EventListener {
  /**
   * Adds an event listener for the specified contract and event name
   * @param contract
   * @param eventname
   * @param callback
   */
  addEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void

  /**
   * Removes an event listener for the specified contract and event name
   * @param contract
   * @param eventname
   * @param callback
   */
  removeEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void

  /**
   * Waits for the transaction to be completed and returns the application log
   * @param txId id od the transaction
   * @param timeout the timeout in milliseconds
   */
  waitForApplicationLog(txId: string, timeout?: number): Promise<Neo3ApplicationLog>

  /**
   * Checks if the transaction was completed successfully
   * Throws an error if the transaction failed
   * @param txResult the Neo3ApplicationLog object
   * @param eventToCheck the Neo3Event object to check if it is present in the application log
   * @param confirmStackTrue if true, checks if the stack contains true as the first element
   */
  confirmTransaction(
    txResult: Neo3ApplicationLog,
    eventToCheck?: Neo3Event | undefined,
    confirmStackTrue?: boolean | undefined,
  ): void
}
