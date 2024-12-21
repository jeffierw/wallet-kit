---
title: Frequently Asked Questions
sidebar_position: 999
---

## Q:  Property '#private' in type 'TransactionBlock' refers to a different member that cannot be accessed from within type 'TransactionBlock'.

A: This error happens when the version of package `@mysten/sui.js` DOES NOT match with the peerDependency version in `@nemoprotocol/wallet-kit`. 

Because our wallet kit **externalizes** the `@mysten/sui.js` package, it is necessary to **make sure the version of `@mysten/sui.js` is the same as the peerDependency version in `@nemoprotocol/wallet-kit`**.

For example, in the following package.json, 

```json
{
    "dependencies": {
        "@mysten/sui.js": "0.41.2",
        "@nemoprotocol/wallet-kit": "0.2.22"
    }
}
```

- The version of `@mysten/sui.js` is `0.41.2`
- The version of `@nemoprotocol/wallet-kit` is `0.2.22` which requires `@mysten/sui.js` version to be `0.45.1`
> You can confirm this by looking into the `peerDependency` section of the package.json of `@nemoprotocol/wallet-kit`

So you need to **upgrade the version of `@mysten/sui.js` to `0.45.1`** in this case.


## Q: Having trouble in bundling due to the typings of `@mysten/bcs`?

The error `Type parameter declaration expected` looks like this:

```
node_modules/@mysten/bcs/dist/bcs.d.ts:105:11 - error TS1139: Type parameter declaration expected.

105     tuple<const Types extends readonly BcsType<any, any>[]>(types: Types, options?: BcsTypeOptions<{ -readonly [K in keyof Types]: Types[K] extends BcsType<infer T_4, any> ? T_4 : never; }, { [K_1 in keyof Types]: Types[K_1] extends BcsType<any, infer T_5> ? T_5 : never; }> | undefined): BcsType<{ -readonly [K_2 in keyof Types]: Types[K_2] extends BcsType<infer T_6, any> ? T_6 : never; }, { [K_3 in keyof Types]: Types[K_3] extends BcsType<any, infer T_7> ? T_7 : never; }>;
```

> Relevant Issue: https://github.com/MystenLabs/sui/tree/main/sdk/typescript/src/types

A: This is because the `const` parameter declarations used in `@mysten/bcs` were added in `typescript` **v5.0**.
**So you need to upgrade the version of `typescript` npm package to 5.0 or higher.**

## Q: When using useSuiProvider, I got TypeError: Cannot read properties of undefined (reading 'transport')

Reproducible Code:

```ts
import { useSuiProvider } from '@nemoprotocol/wallet-kit';
const { getTransactionBlock } = useSuiProvider()
const transactionInfo = await getTransactionBlock({
    digest: String(res.digest),
    options: {
    showObjectChanges: true,
    },
});
// TypeError: Cannot read properties of undefined (reading 'transport'), at getTransactionBlock
```

A: This is because the incorrect deconstruction of `useSuiProvider` function. The correct way to use `useSuiProvider` is as a whole instance:

```diff
import { useSuiProvider } from '@nemoprotocol/wallet-kit';
- const { getTransactionBlock } = useSuiProvider()
+ const suiClient = useSuiProvider()
- const transactionInfo = await getTransactionBlock({
+ const transactionInfo = await suiClient.getTransactionBlock({
          digest: String(res.digest),
          options: {
            showObjectChanges: true,
          },
});
```

Because the output of useSuiProvider() is simply a SuiClient instance, so deconstructing it will lead to a undefined "this" pointer for the getTransactionBlock method.


