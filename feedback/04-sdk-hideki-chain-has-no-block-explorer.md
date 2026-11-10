# `hidekiTestnet` chain definition has no block explorer, but the docs list one
Severity: normal
Area: SDK

## Steps to reproduce
1. `import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains"` (0.32.1).
2. Read `hidekiTestnet.blockExplorers`.
3. Open https://explorer.testnet.somnia.network/tokyo — the explorer listed on https://app.testnet.dreamdex.io/docs/developers/perps-testnet.

## Expected
`hidekiTestnet.blockExplorers.default` points to the explorer the docs name, so viem and wallets that use the chain object can link transactions.

## Actual
`blockExplorers` is unset. The source comment in `dist/chains/definitions/hidekiTestnet.js` says "No public block explorer is known for Hideki, so that field stays unset", yet the docs page lists `explorer.testnet.somnia.network/tokyo` and that URL answers HTTP 200.
Apps built on the SDK chain object show no explorer link for perps transactions.

## Evidence
- `curl -sL -o /dev/null -w "%{http_code}" https://explorer.testnet.somnia.network/tokyo` → `200`
- `dist/chains/definitions/hidekiTestnet.js`, doc comment above `defineChain`.

## Environment
@somnia-chain/markets-sdk 0.32.1, Node.js 24; Somnia Tokyo testnet (Hideki, chain 50383); read-only, no wallet.
