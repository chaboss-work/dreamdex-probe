# HTTP and WebSocket APIs have no perps: testnet lists only 3 spot markets
Severity: normal
Area: docs

## Steps to reproduce
1. `curl https://stg.api.dreamdex.io/v0/markets` and `curl https://api.dreamdex.io/v0/markets`.
2. Compare with `client.listPerpMarkets()` from @somnia-chain/markets-sdk on the Hideki chain. It returns 40 perp markets (see `examples/report-2026-11-10.md`).

## Expected
The bounty asks builders to "stress-test the dreamDEX Perps API and SDK". The HTTP API page says the REST interface lets integrators "list the currently-available markets". Every market row has a `kind` field. So either perps appear with a perp `kind`, or the docs say plainly that perps are available only through the SDK and indexer for now.

## Actual
- Testnet returns exactly three markets, all `"kind":"spot"`: `WBTC:USDso`, `WETH:USDso` and `SOMI:USDso`.
- The HTTP API docs list only two environments: Mainnet (5031) and Somnia Shannon (50312). There is no entry for the Hideki / Tokyo chain (50383), where perps run.
- No page says that the HTTP API, the WebSocket feed and the CCXT adapter don't cover perps. A builder who starts from the "HTTP API" or "CCXT" pages for the perps bounty finds no perps and no explanation.

## Evidence
`GET /v0/markets` on testnet: `{"markets":[{"kind":"spot","symbol":"WBTC:USDso",…},{"kind":"spot","symbol":"WETH:USDso",…},{"kind":"spot","symbol":"SOMI:USDso",…}]}`

## Environment
HTTP API https://stg.api.dreamdex.io/v0 (testnet) and https://api.dreamdex.io/v0 (mainnet), checked 2026-11-11 ~00:50 UTC; SDK 0.32.1 against Hideki 50383 for comparison.
