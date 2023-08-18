import { Neo3ApplicationLog, Neo3Event, Neo3EventListener, Neo3EventListenerCallback, Neo3EventWithState } from '@cityofzion/neon-dappkit-types';
export type NeonEventListenerOptions = {
    debug?: boolean | undefined;
    waitForApplicationLog?: {
        maxAttempts?: number | undefined;
        waitMs?: number | undefined;
    } | undefined;
};
export declare class NeonEventListener implements Neo3EventListener {
    private options;
    static MAINNET: string;
    static TESTNET: string;
    private blockPollingLoopActive;
    private listeners;
    private readonly rpcClient;
    constructor(rpcUrl: string, options?: NeonEventListenerOptions | undefined);
    addEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void;
    removeEventListener(contract: string, eventname: string, callback: Neo3EventListenerCallback): void;
    removeAllEventListenersOfContract(contract: string): void;
    removeAllEventListenersOfEvent(contract: string, eventname: string): void;
    waitForApplicationLog(txId: string): Promise<Neo3ApplicationLog>;
    confirmHalt(txResult: Neo3ApplicationLog): void;
    confirmStackTrue(txResult: Neo3ApplicationLog): void;
    getNotificationState(txResult: Neo3ApplicationLog, eventToCheck: Neo3Event): Neo3EventWithState | undefined;
    confirmTransaction(txResult: Neo3ApplicationLog, eventToCheck?: Neo3Event | undefined, confirmStackTrue?: boolean): void;
    private blockPollingLoop;
    private wait;
}
