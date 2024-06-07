# NeonSigner

## Initialize NeonSigner

To use NeonSigner you can simply call its constructor.

To sign messages or decrypt data you should pass an account to the constructor using the `Account` from
`@cityofzion/neon-js`. Check the example:
```ts
import { NeonSigner } from '@cityofzion/neon-dappkit'
import { default as Neon } from '@cityofzion/neon-js'

const account = new Neon.wallet.account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')

const signer = new NeonSigner(account)
```

If you don't want to sign messages or decrypt data, simply don't pass an account. Check the example:
```ts
import { NeonSigner } from '@cityofzion/neon-dappkit'

const signer = new NeonSigner()
```

## Usage

### Sign and Verify message
The process of signing and then verifying a message is useful to prove that the user owns a specific account and have
truly signed your specific message. 
```ts
// 1) sign a message
const mySignedMessage = await signer.signMessage({ message: 'My message', version: 2 })
// the signed message contains messageHex, data, publicKey and salt

// 2) store or share these information to be verified later or by someone else

// 3) check if the signature is valid, if the method returns true, it is certain that that specific publicKey signed that messageHex
const valid = await signer.verifyMessage(mySignedMessage)
```
You can use different **versions**, the default is `2`, but you can use `3` to sign a message without salt, and `1` to
use the legacy version.

### Encrypt and Decrypt data

```ts
// 1) encrypt data using the public key of the recipient, so only the recipient can decrypt it with his private key
// this method receives an array of public keys, so you can encrypt the data for multiple recipients
// and it returns an array of encrypted messages, one for each recipient public key
const encryptedMessages = signer.encrypt("Data to be encrypted", [recipientPublicKey])

// 2) select which encrypted message you want to use
const encryptedMessage = encryptedMessages[0]

// 3) on the other side, the recipient can decrypt the data using his private key
const messageDecrypted = signer.decrypt(encryptedMessage)
```
On the example above, we used the `decrypt` with a single encrypted message, which is faster, but you can use
`decryptFromArray` to pass multiple encrypted messages, and the recipient will try to decrypt until it finds the correct
one.
```ts
// 1) encrypt data using the public key of many recipients
const encryptedMessages = signer.encrypt("Data to be encrypted", [
    jackPublicKey, rickPublicKey, bobPublicKey
])

// 2) on the other side, one of the recipients can decrypt the data using his private key
const messageDecrypted = signer.decryptFromArray(encryptedMessages)
```
This method is slower than the `decrypt` method, so you should use it only if you are not sure which encrypted message
is the correct one.

### More Details

For more details on the methods signature, check the [Unit Tests](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/test/NeonSigner.spec.ts).
