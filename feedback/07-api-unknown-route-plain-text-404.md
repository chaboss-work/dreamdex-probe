# Unknown routes return plain-text "404 page not found", not the documented JSON error
Severity: normal
Area: API

## Steps to reproduce
1. `curl -i https://stg.api.dreamdex.io/markets`. The path lacks `/v0`, the mistake the docs warn about.
2. `curl -i https://stg.api.dreamdex.io/v0/orderbooks/SOMI:USDso`. The docs say this path returns 404.

## Expected
[Error Handling](https://app.testnet.dreamdex.io/docs/developers/http-api/error-handling) says: "All error responses use a consistent JSON format". That format is `{status, name, description}` plus an `Error-Name` header.

## Actual
`HTTP/1.1 404 Not Found` with `Content-Type: text/plain; charset=utf-8` and the body `404 page not found`. There is no `Error-Name` header. A client that always parses error bodies as JSON throws a parse error instead of reporting the 404.

The same plain-text 404 comes back for any unknown path, for example `/openapi.json` or `/v0/.well-known/oapi.json`.

## Evidence
```
$ curl -s -D - https://stg.api.dreamdex.io/markets
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8

404 page not found
```

## Environment
HTTP API https://stg.api.dreamdex.io/v0 (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:50 UTC with curl; no wallet, no auth.
