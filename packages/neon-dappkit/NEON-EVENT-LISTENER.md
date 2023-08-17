# NeonEventListener

## Initialize NeonEventListener

To use NeonEventListener you can simply call its constructor passing the network you want to use.

```ts
import { NeonEventListener } from '@cityofzion/neon-dappkit'
import { default as Neon } from '@cityofzion/neon-js'

const eventListener = new NeonEventListener(NeonEventListener.MAINNET)
```

You can also pass a custom RPC endpoint:
```ts
const eventListener = new NeonEventListener('http://127.0.0.1:5001')
```

## Usage

### Listen to an event on the blockchain
Everytime the specified event is triggered, the callback will be called
```ts
const contract = '0x123456'
const eventname = 'Transfer'
const callback = (event) => {
    console.log(event)
}

eventListener.addEventListener(contract, eventname, callback)
```

### Remove an event listener
Use this method to unsubscribe from the event, avoiding memory leaks
```ts
eventListener.removeEventListener(contract, eventname, callback)
```
You can also use the method `removeAllEventListenersOfContract` or `removeAllEventListenersOfEvent`.

### Wait for a transaction to be completed and confirm it was successful

On the following example we are waiting for a transaction to be completed, and then we are only confirming it has the
`HALT` state.

```ts
const appLog = await eventListener.waitForApplicationLog(transactionId)

eventListener.confirmTransaction(appLog)
```

You can also confirm the transaction has a specific event, and if the return value of the transaction is true with the
following optional parameters:
```ts
const appLog = await eventListener.waitForApplicationLog(transactionId)

const eventToCheck = {
    contract: '0x123456',
    eventname: 'Transfer'
}
const confirmStackTrue = true
eventListener.confirmTransaction(
    appLog,
    eventToCheck,
    confirmStackTrue)
```

### More Details

For more details on the methods signature, check the auto-generated
[Docs](https://htmlpreview.github.io/?https://raw.githubusercontent.com/CityOfZion/neon-dappkit/master/packages/neon-dappkit-types/docs/interfaces/Neo3EventListener.html)
and the [Source Code](./src/NeonEventListener.ts).