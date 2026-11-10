# SDK PERPS.md says only BTC and ETH perps are live; the testnet has 40 perp markets
Severity: normal
Area: docs

## Steps to reproduce
1. `npm install @somnia-chain/markets-sdk@0.32.1` (the version the docs and the app use).
2. Open `node_modules/@somnia-chain/markets-sdk/docs/PERPS.md`, line 3.
3. Run `npm run probe` in this repo, or call `client.listPerpMarkets({ limit: 200 })` against the Hideki indexer.

## Expected
The SDK's perps guide describes the markets that are live, or links to a place that lists them.

## Actual
Line 3 of `docs/PERPS.md` reads: "Perps are live on testnet: `BTC/USDSO:USDSO` and `ETH/USDSO:USDSO`".
`listPerpMarkets` returns 40 perp markets on chain 50383 (crypto, commodities such as XAU, XAG and WTI, and equities such as TSLA, GOOGL and AMD).
A developer who reads the SDK guide first will hardcode two symbols and miss the rest.

## Evidence
- `docs/PERPS.md` line 3 in the 0.32.1 tarball: https://registry.npmjs.org/@somnia-chain/markets-sdk/-/markets-sdk-0.32.1.tgz
- Market list: `out/report.md` / `out/report.json` from `npm run probe` (Markets table).

## Environment
@somnia-chain/markets-sdk 0.32.1, viem 2.57, Node.js 24; Somnia Tokyo testnet (Hideki, chain 50383); read-only, no wallet.
