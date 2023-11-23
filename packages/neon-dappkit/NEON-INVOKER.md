# NeonInvoker

## Initialize NeonInvoker

To use NeonInvoker you can simply call `NeonInvoker.init`.

To persist changes to the blockchain or sign the transactions you should pass an account to `NeonInvoker.init` using the
`Account` from `@cityofzion/neon-js`. Check the example:
```ts
import { NeonInvoker } from '@cityofzion/neon-dappkit'
import { default as Neon } from '@cityofzion/neon-js'

const account = new Neon.wallet.account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8')

const invoker = await NeonInvoker.init({
  rpcAddress: NeonInvoker.MAINNET,
  account,
})
```

You can also pass an signingCallback to the `NeonInvoker.init` method. It should return a `Promise` of signature string. See [here](./examples/ledger.ts) an example implementation of ledger signature.

If you don't want to sign or persist changes to the blockchain, simply don't pass an account. Check the example:
```ts
import { NeonInvoker } from '@cityofzion/neon-dappkit'

const invoker = await NeonInvoker.init({
  rpcAddress: NeonInvoker.MAINNET,
})
```

You can also pass a custom RPC endpoint to the `NeonInvoker.init` method.

Another example of initialization is:
```ts
const invoker = await NeonInvoker.init({
  rpcAddress: 'http://127.0.0.1:5001',
  account,
})
```

## Usage

### Invoking a SmartContract method on NEO 3 Blockchain

To invoke a SmartContract method you can use `invokeFunction` method.

Neo blockchain expect params with
`{ type, value }` format, and on `type` you should provide one of the types mentioned [here](https://neon.coz.io/wksdk/core/interfaces/Argument.html).


Check [Arguments Documentation](./ARGUMENTS.md)
to know more about the expected value for each argument type.

To invoke a SmartContract, it's important to know the argument types of the method, this information can be found on Dora.
On the example below we are invoking the `transfer` method of the [GAS](https://dora.coz.io/contract/neo3/mainnet/0xd2a4cff31913016155e38e474a2c06d08be276cf) token.

Check it out:

```ts
// ...
const resp = await invoker.invokeFunction({
    invocations: [{
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf', // GAS token
        operation: 'transfer',
        args: [
            { type: 'Address', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
            { type: 'Address', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
            { type: 'Integer', value: 100000000 },
            { type: 'Array', value: [] }
        ]
    }],
    signers: [{
        scopes: 'Global'
    }]
})
```

Options for each `signer`:

- `scopes`: to specify which scopes should be used to sign the transaction, [learn more](https://developers.neo.org/docs/n3/foundation/Transactions#scopes). This property accepts them as a string as seen on the examples, or as a number, which can be imported from `WitnessScope` of `neon-js`.
- `account`: to specify which account's scripthash should be used to sign the transaction, otherwise the wallet will use the user's selected account to sign.
- `allowedContracts`: when the `scopes` property is set as `CustomContracts`, you should use this property to specify which contracts are allowed
- `allowedGroups`: when the `scopes` property is set as `CustomGroups`, you should use this property to specify which groups are allowed
- `rules`: to specify which rules should be used to sign the transaction, [learn more](https://developers.neo.org/docs/n3/foundation/Transactions#witnessrule).

Options for each `invocation`:

- `scriptHash`: the SmartContract ScriptHash
- `operation`: the SmartContract's method name
- `args`: the parameters to be sent to the method, as explained above
- `abortOnFail`: when requesting multiple invocations, you can set `abortOnFail` to true on some invocations so the VM will abort the rest of the calls if this invocation returns `false`

Additional root options:

- `systemFeeOverride`: to choose a specific amount as system fee OR `extraSystemFee` if you simply want to add more value to the minimum system fee.
- `networkFeeOverride`: to choose a specific amount as network fee OR `extraNetworkFee` if you simply want to add more value to the minimum network fee.

Here is a more advanced example:

```ts
// ...
const resp = await invoker.invokeFunction({
    invocations: [{
        // ...
        abortOnFail: true // if this invocation returns false, the VM will abort the rest of the calls
    },
    {
        // ...
    }],
    signers: [{
        scopes: 'Global',
        account: '857a247939db5c7cd3a7bb14791280c09e824bea', // signer account scripthash
    }],
    extraSystemFee: 1000000, // minimum system fee + 1 GAS
    networkFeeOverride: 3000000 // sending 3 GAS instead of the minimum network fee
})
```

### Calling TestInvoke

To retrieve information from a SmartContract without persisting any information on the blockchain you can use `testInvoke` method.

On the example below we are invoking the `balanceOf` method of the `GAS` token.

Is expected for the Wallets to not ask the user for authorization on testInvoke.

Check it out:

```ts
// ...
const resp = await invoker.testInvoke({
    invocations: [{
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf', // GAS token
        operation: 'balanceOf',
        args: [
            { type: 'Address', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' }
        ]
    }],
    signers: [{
        scopes: 'Global'
    }]
})

```

### Traverse iterator

The traverseIterator method allows you to traverse an iterator returned by a SmartContract method.

On the following example we are getting all the candidates from the
[NEO token](https://dora.coz.io/contract/neo3/mainnet/ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5) and then traversing the
iterator to get the first 10 items.

```ts
const resp = await invoker.testInvoke({
    invocations: [
        {
            operation: "getAllCandidates",
            scriptHash: "ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5", // neo token
            args: [],
        },
    ],
    signers: [{ scopes: "CalledByEntry" }],
});

const sessionId = resp.session as string;
const iteratorId = resp.stack[0].id as string;

const resp2 = await invoker.traverseIterator(sessionId, iteratorId, 10)
```

### Calculate Fee

It's important to know how much a transaction will cost before invoking.

The `calculateFee` function facilitates this by allowing users to input the same arguments they would use in the
`invokeFunction`. This process yields detailed information about the `networkFee`, `systemFee`, and the aggregate `total`.

See the example below:

```ts
const resp = await invoker.calculateFee({
    invocations: [{
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'transfer',
        args: [
            { type: 'Hash160', value: account.address },
            { type: 'Hash160', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
        ],
    }],
    signers: [{ scopes: 'CalledByEntry' }],
})

console.log(resp) // will print an object with `networkFee`, `systemFee` and `total`
```

### More Details

For more details on the methods signature, check the auto-generated
[Docs](https://htmlpreview.github.io/?https://raw.githubusercontent.com/CityOfZion/neon-dappkit/master/packages/neon-dappkit-types/docs/interfaces/Neo3Invoker.html),
the [Unit Tests](./src/NeonInvoker.spec.ts) and the [Source Code](./src/NeonInvoker.ts).