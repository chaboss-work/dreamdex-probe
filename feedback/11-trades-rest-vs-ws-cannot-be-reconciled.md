# Trades from REST and from the WebSocket "trades" channel use different ids and fields, so they cannot be reconciled
Severity: normal
Area: API

## Steps to reproduce
1. `curl "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/trades?limit=5"`
2. On the public WebSocket, send `{"operation":"subscribe","channel":"trades","params":{"symbols":["SOMI:USDso"],"limit":100}}` and read the snapshot.

## Expected
The feed has no sequence number, so the Real-Time Feed page tells bots to "periodically reconcile against REST". That needs a trade id both sides share, ideally with the same field names too.

## Actual
REST trade:

```json
{"amount":"25","cost":"4.055","id":"627189298506152343990:793209995169538308524","price":"0.1622","side":"sell","symbol":"SOMI:USDso","timestamp":1794364305741,"txHash":"0x410645fc…"}
```

WebSocket trade, same market, same minute:

```json
{"id":"1794364265927-0","price":"0.1621","quantity":"25","side":"sell","timestamp":1794364265741}
```

The differences:
- The `id` formats differ (`<orderId>:<orderId>` vs `<ms>-<n>`), so the same fill cannot be matched.
- REST calls the size `amount`, the feed calls it `quantity`.
- The feed has no `txHash` and no `cost`.

The docs describe a reconnect flow where a REST backfill is deduplicated against the live feed. With these schemas that dedupe is guesswork on price and timestamp.

## Evidence
Responses above.

## Environment
HTTP API https://stg.api.dreamdex.io/v0 and public WebSocket wss://stg.api.dreamdex.io/v0/ws/public (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:55 UTC; no wallet, no auth.
