# CCXT page uses "SOMI/USDC", the adapter exposes "SOMI/USDso" and has no testnet; its spec links are dead
Severity: normal
Area: docs

## Steps to reproduce
1. Read [Libraries → CCXT](https://app.testnet.dreamdex.io/docs/developers/libraries/ccxt). Every example uses `'SOMI/USDC'`.
2. Read the adapter on the documented branch: https://raw.githubusercontent.com/somnia-chain/ccxt/add-dreamdex-exchange/ts/src/dreamdex.ts
3. `curl -i https://api.dreamdex.io/v0/.well-known/oapi.json` and `.../async.json`, then the same two on `stg.api.dreamdex.io`.

## Expected
- The examples use a symbol that exists.
- There is a way to point the adapter at testnet (`urls.test` / `setSandboxMode(true)`). The HTTP API docs say "To target testnet, substitute the staging base URL", and the builder bounty runs on testnet only.
- The adapter's `urls.doc` links resolve.

## Actual
- **The symbol in the examples doesn't exist.** `parseMarket` builds `symbol = base + '/' + quote` from the API currency codes with `commonCurrencies: {}`. `GET /v0/markets` returns `SOMI:USDso`, so the unified symbol is `SOMI/USDso`. `SOMI/USDC` does not exist, and the Market Data page itself says the quote is always USDso.
- **No testnet.** `urls.api.rest` is hard-coded to `https://api.dreamdex.io`, `chainId` to 5031, and `sandbox` is `false`. There is no `urls.test`, so the adapter cannot be used on Shannon testnet without patching it.
- **Dead spec links.** Both `urls.doc` entries (`/v0/.well-known/oapi.json` and `/v0/.well-known/async.json`) return `404 page not found` on mainnet and testnet. So the OpenAPI spec that the WebSocket Operations page relies on ("utilising the same operations as provided by the OpenAPI spec", "OpenAPI operationId") is not reachable anywhere.

## Evidence
- Adapter source lines: `'commonCurrencies': {}`, `'rest': 'https://api.dreamdex.io'`, `'chainId': 5031`, `'sandbox': false`, `const symbol = base + '/' + quote;`.
- The four 404 responses above.

## Environment
CCXT fork `somnia-chain/ccxt`, branch `add-dreamdex-exchange`, read 2026-11-11; APIs checked the same day with curl.
