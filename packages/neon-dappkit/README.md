<p align="center">
  <img
    src=".github/resources/images/coz.png"
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
[guide](./packages/neon-dappkit/WALLET-CONNECT.md).

## Installation
```sh
npm i @CityOfZion/neon-dappkit
```

## Getting Started

Neon-Dappkit has 4 main components:
- [NeonInvoker](./packages/neon-dappkit/NEON-INVOKER.md): SmartContract Invocation Tool.
- [NeonParser](./packages/neon-dappkit/NEON-PARSER.md): Powerful Parser for Neo3 Types.
- [NeonSigner](./packages/neon-dappkit/NEON-SIGNER.md): Signs, Verifies, Encrypts and Decrypts data.
- [NeonEventListener](./packages/neon-dappkit/NEON-EVENT-LISTENER.md): Listen to events from the Neo3 Blockchain.


## Quick Example

```ts
import { NeonInvoker, NeonParser } from "@CityOfZion/neon-dappkit";

const invoker = await NeonInvoker.init({
    rpcAddress: NeonInvoker.TESTNET,
})

const rawResp = await invoker.testInvoke({
    invocations: [
        {
            scriptHash: '0x123456',
            operation: 'myMethod',
            args: [123, 'Test'].map(NeonParser.formatRpcArgument)
        },
    ],
})

const resp = NeonParser.parseRpcResponse(rawResp.stack[0])
```

