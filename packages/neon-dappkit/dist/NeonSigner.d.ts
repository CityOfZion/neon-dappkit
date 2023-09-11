import { Neo3Signer, SignMessagePayload, SignedMessage, SignMessageVersion, EncryptedPayload, DecryptFromArrayResult } from '@cityofzion/neon-dappkit-types';
import type * as NeonTypes from '@cityofzion/neon-core';
export { SignMessageVersion };
export declare class NeonSigner implements Neo3Signer {
    account?: NeonTypes.wallet.Account;
    constructor(account?: NeonTypes.wallet.Account);
    signMessage(message: SignMessagePayload): Promise<SignedMessage>;
    signMessageClassic(message: string): SignedMessage;
    signMessageDefault(message: string): SignedMessage;
    signMessageWithoutSalt(message: string): SignedMessage;
    private classicFormat;
    verifyMessage(verifyArgs: SignedMessage): Promise<boolean>;
    /**
     * returns the address of the account
     */
    getAccountAddress(): string | null;
    encrypt(message: string, publicKeys: string[]): Promise<EncryptedPayload[]>;
    decrypt(payload: EncryptedPayload): Promise<string>;
    decryptFromArray(payloads: EncryptedPayload[]): Promise<DecryptFromArrayResult>;
}
