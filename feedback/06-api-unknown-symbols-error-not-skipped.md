# Docs say unknown symbols are "silently skipped", the API answers 400 invalid_param
Severity: normal
Area: docs

## Steps to reproduce
1. `curl -i "https://stg.api.dreamdex.io/v0/orderbooks?symbols=SOMI:USDso,WETH:USDso"` (comma-separated, the exact case the docs call out).
2. `curl -i "https://stg.api.dreamdex.io/v0/orderbooks?symbols=FOO:USDso"`
3. `curl -i "https://stg.api.dreamdex.io/v0/tickers?symbols=FOO:USDso"`

## Expected
[Market Data](https://app.testnet.dreamdex.io/docs/developers/http-api/market-data) says the comma-separated form is "parsed as one literal symbol … which matches no market and is silently skipped, so the response is []". It also says "Unknown or malformed symbols are silently skipped rather than erroring, so a serialization mismatch shows up as an empty [] rather than a 4xx". The Trading page says the same about "unknown symbols are silently skipped" for `GET /v0/tickers` and `GET /v0/orders`.

## Actual
All three return **HTTP 400** with `Error-Name: invalid_param`:

```json
{"context":{"invalid_symbols":["SOMI:USDso,WETH:USDso"]},"description":"unknown market symbols: SOMI:USDso,WETH:USDso","name":"invalid_param","status":400}
```

The API behaviour is actually the safer one. But integrators who follow the docs code "empty array = no data" and never handle the 400.

The `context` object is also missing from the documented error format: the Error Handling page lists only `status`, `name` and `description`.

## Evidence
Responses above.

## Environment
HTTP API https://stg.api.dreamdex.io/v0 (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:50 UTC with curl; no wallet, no auth.
