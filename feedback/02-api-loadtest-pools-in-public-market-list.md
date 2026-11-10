# Five internal "LOADTEST" perp pools with a dead mark feed are returned by `listPerpMarkets`
Severity: normal
Area: API

## Steps to reproduce
1. With @somnia-chain/markets-sdk 0.32.1 and the Hideki indexer, call `client.listPerpMarkets({ limit: 200 })`.
2. Filter rows with `baseSymbol === "LOADTEST"`.
3. Call `client.getPerpFeedStatus(pool)` for each of them.

## Expected
Load-test pools are hidden from the public market list (or flagged, e.g. a `status`/`hidden` field), so bots and dashboards that iterate every market do not pick them up.

## Actual
Five pools come back, all named LOADTEST, all with `markPriceOk: false`:

| pool | open interest (raw) |
|---|---|
| 0x736850b162802db2b54d766c686e65e1b31eb954 | 0 |
| 0x7d19508851d5397fd0e3b648fe30982bf86268a5 | 0 |
| 0xf909076d4abc6e7993e499b533e2b2a8cfbe4dd4 | 8430000000000000000 |
| 0xb738977760660b455b0ef9e7fa3eec0205c1292d | 0 |
| 0x7982b98b08f9956e6665366ae93c466b44b044a5 | 0 |

`SomniaMarkets.loadMarkets()` keeps them apart with suffixed symbols (`LOADTEST-B954/USDso:USDso`, …), so nothing collides, but a bot that scans all markets gets five symbols that cannot be priced (`getMaxPerpOrderSize` answers `priceable: false`). One of them still carries open interest, so a position sits in a market whose mark feed is down.
`ADLT` (pool 0xe3f6dcda98595764970e5a6ffd167af1d1b35123, mark live, open interest 99e18) looks like another test market and is also listed.

## Evidence
- `out/report.json` rows with `symbol: "LOADTEST"`, run 2026-11-10T22:13:33Z, head block 46947364.

## Environment
@somnia-chain/markets-sdk 0.32.1, viem 2.57, Node.js 24; Somnia Tokyo testnet (Hideki, chain 50383); read-only, no wallet.
