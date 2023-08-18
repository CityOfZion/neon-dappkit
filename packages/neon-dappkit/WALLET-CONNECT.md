# Using Neon-DappKit and WalletConnectSDK together

## With NeonInvoker
Pre-requisites:
- Setup WalletConnectSDK following the [documentation](https://github.com/CityOfZion/wallet-connect-sdk)
- Setup NeonInvoker following the [documentation](./NEON-INVOKER.md)

Now you can use the `Neo3Invoker` interface to abstract which implementation you are using. Check the example:
```ts
import { NeonInvoker, Neo3Invoker } from '@cityofzion/neon-dappkit'

let neonInvoker: Neo3Invoker
let wcSdk: Neo3Invoker

async function init() {
    // initialize neonInvoker and wcSdk
}

function getInvoker(): Neo3Invoker {
  if (wcSdk.isConnected()) {
    return wcSdk
  } else {
    return neonInvoker
  }
}

async function getBalance() {
  const invoker = getInvoker()
  
  const resp = await invoker.testInvoke({
        invocations: [{
            scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf', // GAS token
            operation: 'balanceOf',
            args: [
                { type: 'Address', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' }
            ]
        }],
        signers: []
    })
}
```

## With NeonSigner
Pre-requisites:
- Setup WalletConnectSDK following the [documentation](https://github.com/CityOfZion/wallet-connect-sdk)
- Setup NeonSigner following the [documentation](./NEON-SIGNER.md)

Now you can use the `Neo3Signer` interface to abstract which implementation you are using. Check the example:
```ts
import { NeonSigner, Neo3Signer } from '@cityofzion/neon-dappkit'

let neonSigner: Neo3Signer
let wcSdk: Neo3Signer

async function init() {
    // initialize neonSigner and wcSdk
}

function getSigner(): Neo3Signer {
  if (wcSdk.isConnected()) {
    return wcSdk
  } else {
    return neonSigner
  }
}

async function signMessage() {
  const signer = getSigner()
  
  const signedMsg = await signer.signMessage({ message: 'Hello World' })
}
```