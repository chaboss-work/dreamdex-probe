// ws-probe: checks the documented WebSocket behaviour of the dreamDEX public feed (testnet).
// Docs: https://app.testnet.dreamdex.io/docs/developers/websocket-api (operations, real-time feed, errors).
// Read-only: no auth, no orders. Prints every request and the first reply it gets.
import WebSocket from "ws";

const URL = process.env.DREAMDEX_WS ?? "wss://stg.api.dreamdex.io/v0/ws/public";

type Case = { name: string; send: string | object; expect: string };

const cases: Case[] = [
  { name: "ping", send: { operation: "ping" }, expect: 'docs: {"operation":"pong"}' },
  { name: "operation getMarkets", send: { id: 1, operation: "getMarkets" }, expect: "docs: {id:1,status:200,payload:{markets}}" },
  { name: "operation name case-insensitive", send: { id: 2, operation: "GETMARKETS" }, expect: "docs: operationId is case-insensitive" },
  { name: "unknown operation", send: { id: 3, operation: "invalidOp" }, expect: "docs: type=error, errorName=unknown_operation, id=3" },
  { name: "invalid JSON", send: "{not json", expect: "docs: errorName=invalid_request" },
  { name: "missing operation field", send: { id: 5 }, expect: "docs: errorName=invalid_request ('missing operation field')" },
  { name: "op with missing path param", send: { id: 6, operation: "getMarketSymbolTrades" }, expect: "docs: errorName=invalid_parameters" },
  { name: "subscribe unknown channel", send: { operation: "subscribe", channel: "fills", params: {} }, expect: "docs: errorName=unknown_channel" },
  { name: "subscribe orderbook unknown symbol", send: { operation: "subscribe", channel: "orderbook", params: { symbols: ["FOO:USDso"] } }, expect: "docs: errorName=subscription_failed" },
  { name: "subscribe ohlcv bad timeframe", send: { operation: "subscribe", channel: "ohlcv", params: { symbol: "SOMI:USDso", timeframe: "7m" } }, expect: "docs: errorName=subscription_failed" },
  { name: "subscribe order without symbol", send: { operation: "subscribe", channel: "order", params: { orderId: "0x1234567890abcdef" } }, expect: "docs example (Client Messages) uses only orderId" },
  { name: "subscribe order with symbol + malformed id", send: { operation: "subscribe", channel: "order", params: { symbol: "SOMI:USDso", orderId: "not-an-id" } }, expect: "docs: subscription_failed for malformed orderId" },
  { name: "unsubscribe not subscribed", send: { operation: "unsubscribe", channel: "trades", params: { symbols: ["WETH:USDso"] } }, expect: "docs: errorName=not_subscribed" },
  { name: "subscribe orderbook valid", send: { operation: "subscribe", channel: "orderbook", params: { symbols: ["SOMI:USDso"] } }, expect: "docs: subscribed, then snapshot" },
];

function short(s: string, n = 420) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function run() {
  const ws = new WebSocket(URL);
  await new Promise<void>((res, rej) => {
    ws.once("open", () => res());
    ws.once("error", rej);
  });
  console.log(`connected ${URL}`);
  const inbox: string[] = [];
  ws.on("message", (d) => inbox.push(d.toString()));
  const results: { name: string; sent: string; expect: string; got: string[] }[] = [];
  for (const c of cases) {
    inbox.length = 0;
    const raw = typeof c.send === "string" ? c.send : JSON.stringify(c.send);
    ws.send(raw);
    await new Promise((r) => setTimeout(r, 1500));
    const got = inbox.slice(0, 3).map((m) => short(m));
    results.push({ name: c.name, sent: raw, expect: c.expect, got });
    console.log(`\n# ${c.name}\n> ${raw}\n  ${c.expect}`);
    for (const g of got) console.log(`< ${g}`);
    if (!got.length) console.log("< (no reply within 1.5 s)");
  }
  ws.close();
  const fs = await import("node:fs");
  fs.mkdirSync("out", { recursive: true });
  fs.writeFileSync("out/ws-probe.json", JSON.stringify({ url: URL, at: new Date().toISOString(), results }, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
