# Docs "Base decimals" table misses 14 of the 40 live perp markets
Severity: normal
Area: docs

## Steps to reproduce
1. Open https://app.testnet.dreamdex.io/docs/developers/perps-testnet, section "Scale quantity by the base asset's decimals".
2. Run `npm run probe` in this repo (or `client.listPerpMarkets({ limit: 200 })` with @somnia-chain/markets-sdk 0.32.1).
3. Compare the symbols in the table with the `baseSymbol` of every market row.

## Expected
The table covers every live market, or says it lists only some of them.

## Actual
The table has 21 symbols (ADA … NEAR). The indexer lists 40 perp markets. These live markets are not in the table: WTI, XAG, XAU, GOOGL, TSLA, HYNX, MSTR, MRVL, LITE, INTC, HOOD, COIN, AMD, ADLT (plus five LOADTEST pools, see 02).
All of them use 18 base decimals today, so nothing breaks yet. But the page says a wrong scale fails with an unrelated `InsufficientCollateral()` revert, and a reader who trusts the table has no value for commodities and equities.
Every value that is in the table matches the chain: the probe found no decimals mismatch for the 21 listed symbols.

## Evidence
- `out/report.md` from run 2026-11-10T22:13:33Z, head block 46947364: findings `docs-missing-*`.
- Market rows with `baseDecimals` in `out/report.json`.

## Environment
@somnia-chain/markets-sdk 0.32.1, viem 2.57, Node.js 24; Somnia Tokyo testnet (Hideki, chain 50383); read-only, no wallet.
