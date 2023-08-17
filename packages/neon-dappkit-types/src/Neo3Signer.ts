/**
 * A version enum that indicates how a message should be signed
 */
export enum Version {
  LEGACY = 1,
  DEFAULT,
  WITHOUT_SALT
}

/**
 * A simple type that defines the SignMessage payload, where Version.LEGACY is deprecated and Version.DEFAULT is NeoFS compatible and uses SALT, and Version.WITHOUT_SALT is NeoFS compatible and does not use SALT
 */
export type SignMessagePayload = {
  message: string,
  version?: Version
}

/**
 * A simple type that defines the Signed Message format
 */
export type SignedMessage = {
  /**
   * signer's public key
   */
  publicKey: string

  /**
   * encrypted message
   */
  data: string

  /**
   * salt used to encrypt
   */
  salt?: string

  /**
   * message hex
   */
  messageHex: string
}

export interface EncryptedPayload {
  randomVector: string
  cipherText: string
  dataTag: string
  ephemPublicKey: string
}

/**
 * A simple interface that defines the Signing and Verifying methods
 */
export interface Neo3Signer {
  /**
   * Signs a message
   * @param params the params to send the request
   * @return the signed message object
   */
  signMessage(params: SignMessagePayload): Promise<SignedMessage>

  /**
   * Checks if the signedMessage is true
   * @param params an object that represents a signed message
   * @return true if the signedMessage is acknowledged by the account
   */
  verifyMessage (params: SignedMessage): Promise<boolean>

  /**
   * returns the address of the account, not as safe as using signMessage and getting the publicKey
   */
  getAccountAddress (): string | null


  /**
   * Encrypts a message using the Elliptic Curve Integrated Encryption Scheme with the secp256r1 curve
   * @param message message to be encrypted
   * @param publicKeys a list of public keys to encrypt the message with
   * @returns an array with the same lenght as the array of public keys, each element is an EncryptedPayload
   */
  encrypt(message: string, publicKeys: string[]) : EncryptedPayload[]
  
  /**
   * Decrypts a message encrypted using the Elliptic Curve Integrated Encryption Scheme with the secp256r1 curve
   * @param payload an object that was encrypted with the public key corresponding to the account
   * @returns the decrypted message
   */
  decrypt(payload: EncryptedPayload) : string

  /**
   * Tries to find the first payload that can be decrypted from an array of objects that were encrypted using the Elliptic Curve Integrated Encryption Scheme with the secp256r1 curve
   * @param payloads an array of objects that were encrypted with the public keys
   * @returns an object with the decrypted message of the first payload that could be decrypted and the index indicating which encrypted message from the array was decrypt
   * @throws an error if none of the public keys used to encrypt correspond to the account
   */
  decryptFromArray(payloads: EncryptedPayload[]) : { message: string, keyIndex: number }
}
