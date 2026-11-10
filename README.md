# dreamdex-probe

Read-only consistency probe for **dreamDEX perps on the Somnia Hideki testnet** (chain 50383),
built on [`@somnia-chain/markets-sdk`](https://www.npmjs.com/package/@somnia-chain/markets-sdk) 0.32.1 —
the SDK version the dreamDEX app runs.

It reads the same market from three places and reports every disagreement:

| Source | How it is read |
|---|---|
| Developer docs | values snapshotted in [`src/docs-snapshot.ts`](src/docs-snapshot.ts) from the [Perps on Testnet for Developers](https://app.testnet.dreamdex.io/docs/developers/perps-testnet) page |
| Indexer | `client.listPerpMarkets()` through the SDK (GraphQL at `hideki-dev.smk.somnia.host`) |
| Chain | `client.getPerpSystemConfig()`, `client.getPerpFeedStatus()`, and raw `getOrderBookParameters()` / ERC-20 `decimals()` calls over the public RPC |

Checks per run:

- system contracts (MarginBank, collateral, factory, liquidation engine, insurance fund) vs the docs table;
- base decimals of every live market vs the docs "Base decimals" table and vs the token contract;
- quote decimals and quote token vs the documented USDso;
- `tickSize` / `minQuantity` / `lotSize` from the indexer vs the pool contract;
- live mark price (`markPriceOk`) per market;
- markets in the docs that the indexer does not list, and live markets the docs do not mention.

No private key is needed and no transaction is sent.

## Run

```bash
npm install
npm run probe
```

Output: `out/report.md` (human-readable) and `out/report.json` (every row and finding, bigints as strings).
A sample run is in [`examples/report-2026-11-10.md`](examples/report-2026-11-10.md).

The indexer is hosted in Tokyo and sometimes drops connections; every read is retried with a timeout.

## Findings

Confirmed findings are written up one per file in [`feedback/`](feedback/), in the dreamDEX Perps Builder Bounty format:

| # | Area | Finding |
|---|---|---|
| 01 | docs | "Base decimals" table misses 14 of the 40 live perp markets |
| 02 | API | five internal LOADTEST pools with a dead mark feed are in `listPerpMarkets` |
| 03 | docs | SDK `PERPS.md` says only BTC and ETH perps are live |
| 04 | SDK | `hidekiTestnet` has no `blockExplorers`, though the docs list one |
| 05 | docs | one network, three names: Somnia Tokyo / Hideki / DreamDEX region |

What matched: system contract addresses (`getPerpSystemConfig`), base decimals of all 21 documented symbols, quote decimals (18) and quote token (USDso) of every market, and `tickSize` / `minQuantity` / `lotSize` between the indexer and the pools.

## License

MIT
