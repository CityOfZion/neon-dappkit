import { NeonSigner, SignMessageVersion } from './index'
import { wallet } from '@cityofzion/neon-js'
import assert from 'assert'

describe('NeonSigner', function () {
  it('can sign and verify', async () => {
    const acc = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const signer = new NeonSigner(acc)

    const signed = await signer.signMessage({
      version: SignMessageVersion.DEFAULT,
      message: 'my random message',
    })

    assert(signed.salt.length > 0)
    assert(signed.messageHex.length > 0)
    assert(signed.data.length > 0)
    assert(signed.publicKey.length > 0)

    const verified = await signer.verifyMessage(signed)

    assert(verified)
  })

  it('can sign using classic version and verify', async () => {
    const acc = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const signer = new NeonSigner(acc)

    const signed = await signer.signMessage({
      version: SignMessageVersion.CLASSIC,
      message: 'my random message',
    })

    assert(signed.salt.length > 0)
    assert(signed.messageHex.length > 0)
    assert(signed.data.length > 0)
    assert(signed.publicKey.length > 0)

    const verified = await signer.verifyMessage(signed)

    assert(verified)
  })

  it('can sign with no salt and verify', async () => {
    const acc = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const signer = new NeonSigner(acc)

    const signed = await signer.signMessage({
      version: SignMessageVersion.WITHOUT_SALT,
      message: 'my random message',
    })

    assert(signed.salt === undefined)
    assert(signed.messageHex.length > 0)
    assert(signed.data.length > 0)
    assert(signed.publicKey.length > 0)

    const verified = await signer.verifyMessage(signed)

    assert(verified)
  })

  it('can verify', async () => {
    const signer = new NeonSigner()
    const verified = await signer.verifyMessage({
      publicKey: '031757edb62014dea820a0b33a156f6a59fc12bd966202f0e49357c81f26f5de34',
      data: 'aeb234ed1639e9fcc95a102633b1c70ca9f9b97e9592cc74bfc40cbc7fefdb19ae8c6b49ebd410dbcbeec6b5906e503d528e34cd5098cc7929dbcbbaf23c5d77',
      salt: '052a55a8d56b73b342a8e41da3050b09',
      messageHex:
        '010001f0a0303532613535613864353662373362333432613865343164613330353062303965794a68624763694f694a49557a49314e694973496e523563434936496b705856434a392e65794a6c654841694f6a45324e444d304e7a63324e6a4d73496d6c68644349364d5459304d7a4d354d5449324d33302e7253315f73735230364c426778744831504862774c306d7a6557563950686d5448477a324849524f4a4f340000',
    })

    assert(verified)
  })

  it('can verify when failing', async () => {
    const signer = new NeonSigner()
    const verified = await signer.verifyMessage({
      publicKey: '031757edb62014dea820a0b33a156f6a59fc12bd966202f0e49357c81f26f5de34',
      data: '4fe1b478cf76564b2133bdff9ba97d8a360ce36d0511918931cda207c2ce589dfc07ec5d8b93ce7c3b70fc88b676cc9e08f9811bf0d5b5710a20f10c58191bfb',
      salt: '733ceb4d4e8ffdc83ecc6e35c4498999',
      messageHex:
        '010001f05c3733336365623464346538666664633833656363366533356334343938393939436172616c686f2c206d756c65712c206f2062616775697520656820697373756d65726d6f2074616978206c696761646f206e61206d697373e36f3f0000',
    })

    assert(!verified)
  })

  it('can encrypt and decrypt messages from the corresponding public key', async () => {
    const account = new wallet.Account()
    const signer = new NeonSigner(account)
    const messageOriginal = 'Some plaintext for encryption'

    const messageEncrypted = await signer.encrypt(messageOriginal, [account.publicKey])
    const messageDecrypted = await signer.decrypt(messageEncrypted[0])

    for (const value of Object.values(messageEncrypted[0])) {
      assert(!messageOriginal.includes(value))
    }
    assert(messageDecrypted === messageOriginal)
  })

  it('can NOT encrypt and decrypt messages from different public keys', async () => {
    const account = new wallet.Account()
    const anotherAccount = new wallet.Account()
    const signer = new NeonSigner(account)
    const messageOriginal = 'Some plaintext for encryption'

    const messageEncrypted = await signer.encrypt(messageOriginal, [anotherAccount.publicKey])
    await assert.rejects(
      async () => await signer.decrypt(messageEncrypted[0]),
      /invalid payload: hmac misalignment/,
      'Decrypt failed with a different public key',
    )
  })

  it('can encrypt and decrypt messages from an array that has the corresponding public key', async () => {
    const account = new wallet.Account()
    const anotherAccount1 = new wallet.Account()
    const anotherAccount2 = new wallet.Account()
    const anotherAccount3 = new wallet.Account()

    const signer = new NeonSigner(account)
    const messageOriginal = 'Some plaintext for encryption'
    const publicKeys = [
      anotherAccount3.publicKey,
      anotherAccount2.publicKey,
      anotherAccount1.publicKey,
      account.publicKey,
    ]

    const messageEncrypted = await signer.encrypt(messageOriginal, publicKeys)
    const messageDecrypted = await signer.decryptFromArray(messageEncrypted)

    assert(messageDecrypted.message === messageOriginal)
    assert(messageDecrypted.keyIndex === publicKeys.length - 1)

    const anotherSigner = new NeonSigner(anotherAccount1)
    const anotherMessageDecrypted = await anotherSigner.decryptFromArray(messageEncrypted)
    assert(anotherMessageDecrypted.message === messageOriginal)
    assert(anotherMessageDecrypted.keyIndex !== messageDecrypted.keyIndex)
    assert(anotherMessageDecrypted.keyIndex === publicKeys.length - 2)
  })

  it("can NOT encrypt and decrypt messages from an array that doesn't have the corresponding public key", async () => {
    const account = new wallet.Account()
    const anotherAccount1 = new wallet.Account()
    const anotherAccount2 = new wallet.Account()
    const anotherAccount3 = new wallet.Account()

    const signer = new NeonSigner(account)
    const messageOriginal = 'Some plaintext for encryption'
    const publicKeys = [anotherAccount3.publicKey, anotherAccount2.publicKey, anotherAccount1.publicKey]

    const messageEncrypted = await signer.encrypt(messageOriginal, publicKeys)

    assert.rejects(
      async () => await signer.decryptFromArray(messageEncrypted),
      /Decrypt failed. Event not found in decryptFromArray result/,
      'Decrypt failed',
    )
  })
})
