# Change Log - @cityofzion/neon-dappkit

This log was last generated on Mon, 30 Oct 2023 11:49:17 GMT and should not be manually modified.

## 0.3.1
Mon, 30 Oct 2023 11:49:17 GMT

### Patches

- The "browser" field was added to the package.json so that when the library is being run in the browser, certain polyfills are applied.

## 0.3.0
Mon, 02 Oct 2023 18:41:15 GMT

### Minor changes

- Now the calculateFee function returns a string in the networkFee and systemFee properties.

## 0.2.0
Thu, 28 Sep 2023 13:15:04 GMT

### Minor changes

- Enable multi-signing with various wallets. Use "signTransaction" for signing without invoking. Share the response with another user, who can then call "invokeFunction" later.

## 0.1.0
Wed, 27 Sep 2023 16:59:04 GMT

### Minor changes

- Shorten hexstring methods names to use 'hex' instead of 'hexstring'
- Remove typeChecker.ts file; import new TypeChecker from neon-dappkit-types

## 0.0.8
Thu, 14 Sep 2023 20:35:01 GMT

### Patches

- Add "Struct" type support on NeonParser

## 0.0.7
Tue, 12 Sep 2023 17:08:52 GMT

### Patches

- Added state validation in testInvoke function to catch execution error 

## 0.0.6
Mon, 11 Sep 2023 14:54:03 GMT

### Patches

- Adapt the implementation to the new signature of neon-dappkit-types to return Promises on encrypt, descrypt and decryptFromArray methods
- Fix neon-core imports to use only for types

