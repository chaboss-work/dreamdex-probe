# WebSocket operation with a missing path parameter returns market_not_found, not invalid_parameters
Severity: normal
Area: API

## Steps to reproduce
On `wss://stg.api.dreamdex.io/v0/ws/public` send `{"id":6,"operation":"getMarketSymbolTrades"}`, with no `params.symbol`.

## Expected
Per [WebSocket Errors](https://app.testnet.dreamdex.io/docs/developers/websocket-api/errors), the answer should be `invalid_parameters`, documented as "Missing/invalid path or query parameters" with the example message "missing required path parameter: symbol".

## Actual
```json
{"id":6,"status":404,"errorName":"market_not_found","payload":{"description":"market not found: ","name":"market_not_found","status":404}}
```

The missing parameter is replaced with an empty string and looked up as a market. The client is told the market does not exist, instead of being told it forgot a parameter.

## Evidence
Output of `npx tsx src/ws-probe.ts` in this repo.

## Environment
Public WebSocket wss://stg.api.dreamdex.io/v0/ws/public (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:55 UTC with Node.js 24 + ws 8; no wallet, no auth.
