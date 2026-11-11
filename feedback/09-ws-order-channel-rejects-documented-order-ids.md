# WebSocket "order" channel rejects both documented orderId formats; only a decimal id is accepted
Severity: major
Area: docs

## Steps to reproduce
Connect to `wss://stg.api.dreamdex.io/v0/ws/public` and send, one at a time:
1. `{"operation":"subscribe","channel":"order","params":{"orderId":"0x1234567890abcdef"}}`. This is the example under Real-Time Feed → Client Messages → "Subscribe to order updates".
2. `{"operation":"subscribe","channel":"order","params":{"symbol":"SOMI:USDso","orderId":"0x1234567890abcdef"}}`. This follows the Order Lifecycle Tracking example (`"0xYourOrderId"`).
3. `{"operation":"subscribe","channel":"order","params":{"symbol":"SOMI:USDso","orderId":"01KC1F8N2NBP5GEYKE66CRJ34A"}}`. This is the id format used in the `getMarketSymbolOrder` example on the Operations page.
4. `{"operation":"subscribe","channel":"order","params":{"symbol":"SOMI:USDso","orderId":"1"}}`

## Expected
The documented order tracking flow works. You extract `orderId` from the OrderPlaced event or the prepared-order response, subscribe with it, and receive `order:update` events.

## Actual
Requests 1–3 all fail with the same generic message, with no reason given:

```json
{"type":"error","errorName":"subscription_failed","message":"subscription failed to channel: order"}
```

Only request 4, a plain decimal number, subscribes:

```json
{"channel":"order","type":"subscribed","symbol":"SOMI:USDso","orderId":"1"}
```

So:
- the Client Messages example leaves out the required `symbol`;
- both documented id formats, hex `0x…` and ULID, are rejected. On-chain order ids are uint128, and the API apparently wants them in decimal, which no page says;
- the error does not say which parameter is wrong.

A bot that follows the docs can never subscribe to its own orders. The docs also rule out a fallback: "There is no account-wide order or fills channel."

## Evidence
Output of `npx tsx src/ws-probe.ts` in this repo, plus the messages above.

## Environment
Public WebSocket wss://stg.api.dreamdex.io/v0/ws/public (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:55 UTC with Node.js 24 + ws 8; no wallet, no auth.
