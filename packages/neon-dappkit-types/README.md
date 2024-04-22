<p align="center">
  <img
    src="/.github/resources/images/coz.png"
    width="200px;">
</p>

<p align="center">
  Neon-DappKit is the easiest way to build a dApp on Neo3.
  <br/> Made with ❤ by <b>COZ.IO</b>
</p>

# Neon-DappKit

Neon-DappKit is the easiest way to build a dApp on Neo3. Suitable to connect Web Applications, Off-chain JS Servers and
React-Native Apps to the Neo3 Blockchain.

> [WalletConnectSDK](https://github.com/CityOfZion/wallet-connect-sdk) uses Neon-DappKit Types, so  you can easily swap
between Neon-DappKit implementation and WalletConnectSDK on the fly and reuse code, check the
[guide](/packages/neon-dappkit/WALLET-CONNECT.md).

## Installation
```sh
npm i @cityofzion/neon-dappkit-types
```

<details>
<summary>👉 For Vite Users</summary>

In the vite.config.ts file you must change the global value like this:
```ts
import {defineConfig} from 'vite'

export default defineConfig({
    //your config here
    define: {
        global: 'globalThis',
        process: {
            version: 'globalThis'
        }
        //...
    },
})
```
</details>

## Getting Started

Neon-Dappkit has 4 main components:
- [NeonInvoker](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/NEON-INVOKER.md): SmartContract Invocation Tool.
- [NeonParser](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/NEON-PARSER.md): Powerful Parser for Neo3 Types.
- [NeonSigner](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/NEON-SIGNER.md): Signs, Verifies, Encrypts and Decrypts data.
- [NeonEventListener](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/NEON-EVENT-LISTENER.md): Listen to events from the Neo3 Blockchain.

Check out some examples in [examples folder](https://github.com/CityOfZion/neon-dappkit/blob/main/packages/neon-dappkit/examples)


## Quick Example

```ts
import { NeonInvoker, NeonParser, TypeChecker } from '@CityOfZion/neon-dappkit'
import {ContractInvocationMulti} from '@cityofzion/neon-dappkit-types'

const invoker = await NeonInvoker.init({
    rpcAddress: NeonInvoker.TESTNET,
})

const invocation: ContractInvocationMulti = {
    invocations: [
        {
            scriptHash: '0x309b6b2e0538fe4095ecc48e81bb4735388432b5',
            operation: 'getMetaData',
            args: [
                {
                    type: 'Hash160',
                    value: '0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5'
                }
            ]
        }
    ],
}

const testInvokeResult = await invoker.testInvoke(invocation)

console.log(`Invocation state returned: ${testInvokeResult.state}`)
console.log(`Estimated GAS consumed on involke: ${testInvokeResult.gasconsumed} GAS`) // Using testInvoke ensures zero GAS consumption, unlike invokeFunction.
console.log(`Dapp method returned a map: ${TypeChecker.isStackTypeMap(testInvokeResult.stack[0])}`) 
console.log(`Dapp method data returned: ${JSON.stringify(NeonParser.parseRpcResponse(testInvokeResult.stack[0]), null, 2)}`)
```

