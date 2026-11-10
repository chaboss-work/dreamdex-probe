// dreamdex-probe: read-only consistency checks for dreamDEX perps on the Somnia Hideki testnet.
// Compares the developer docs, the indexer (via @somnia-chain/markets-sdk) and the chain itself,
// and writes every disagreement to out/report.json and out/report.md.
import { mkdirSync, writeFileSync } from "node:fs";
import { SOMNIA_HIDEKI_TESTNET_ADDRESSES, SomniaMarkets } from "@somnia-chain/markets-sdk";
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains";
import { createPublicClient, getAddress, http, parseAbi, type Address, type Chain } from "viem";
import {
  DOCS_BASE_DECIMALS,
  DOCS_CHAIN,
  DOCS_CONTRACTS,
  DOCS_QUOTE_DECIMALS,
  DOCS_URL,
} from "./docs-snapshot.js";

type Severity = "info" | "warn" | "error";
type Finding = { id: string; severity: Severity; title: string; detail: string; evidence?: unknown };

const findings: Finding[] = [];
const note = (f: Finding) => {
  if (findings.some((x) => x.id === f.id)) return;
  findings.push(f);
  console.log(`[${f.severity}] ${f.id}: ${f.title}`);
};
const same = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
/** Retry flaky network reads (the indexer sits in Tokyo and sometimes drops connections). */
async function retry<T>(label: string, fn: () => Promise<T>, tries = 4, timeoutMs = 45_000): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= tries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`${label}: timeout ${timeoutMs} ms`)), timeoutMs)),
      ]);
    } catch (e) {
      last = e;
      console.log(`  retry ${i}/${tries} ${label}: ${String(e).split(/\r?\n/)[0].slice(0, 140)}`);
      await new Promise((r) => setTimeout(r, 2_000 * i));
    }
  }
  throw last;
}
const json = (v: unknown) =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x)));

const POOL_ABI = parseAbi([
  "function getOrderBookParameters() view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize)",
]);
const ERC20_ABI = parseAbi([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);

async function main() {
  const startedAt = new Date().toISOString();
  // The SDK's chain object is typed against a slightly different viem build than the one installed
  // here (prepareTransactionRequest phases differ); at runtime it is a plain viem Chain.
  const chain = hidekiTestnet as unknown as Chain;
  const rpc = createPublicClient({ chain, transport: http(DOCS_CHAIN.rpc) });
  const markets = new SomniaMarkets({
    chain,
    indexerUrl: DOCS_CHAIN.indexer,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
  });
  const client = markets.client;

  const chainId = await rpc.getChainId();
  const head = await rpc.getBlockNumber();
  console.log(`chain ${chainId}, head block ${head}`);
  if (chainId !== DOCS_CHAIN.chainId) {
    note({ id: "chain-id", severity: "error", title: "RPC chain id differs from the docs", detail: `docs ${DOCS_CHAIN.chainId}, RPC ${chainId}` });
  }

  // 1. Market list from the indexer
  const perps = await retry("listPerpMarkets", () => client.listPerpMarkets({ limit: 200 }));
  console.log(`indexer lists ${perps.length} perp markets`);
  const rows: Record<string, unknown>[] = [];

  // 2. System contracts: docs table vs getPerpSystemConfig for every MarginBank seen
  const banks = [...new Set(perps.map((m) => getAddress(m.marginBank)))];
  for (const bank of banks) {
    try {
      const cfg = await retry("getPerpSystemConfig", () => client.getPerpSystemConfig(bank));
      const expect: [string, string | undefined, string][] = [
        ["marginBank", cfg.marginBank, DOCS_CONTRACTS.marginBank],
        ["collateral", cfg.collateralToken, DOCS_CONTRACTS.collateral],
        ["perpPoolFactory", cfg.perpPoolFactory, DOCS_CONTRACTS.perpPoolFactory],
        ["liquidationEngine", cfg.liquidationEngine, DOCS_CONTRACTS.liquidationEngine],
        ["insuranceFund", cfg.insuranceFund, DOCS_CONTRACTS.insuranceFund],
      ];
      for (const [name, onchain, docs] of expect) {
        if (!same(onchain, docs)) {
          note({
            id: `system-${name}`,
            severity: "warn",
            title: `${name} on chain differs from the docs table`,
            detail: `docs ${docs}, getPerpSystemConfig(${bank}) returns ${onchain ?? "nothing"}`,
            evidence: json(cfg),
          });
        }
      }
      rows.push({ kind: "systemConfig", bank, ...json(cfg) });
    } catch (e) {
      note({ id: "system-config-read", severity: "error", title: `getPerpSystemConfig(${bank}) failed`, detail: String(e) });
    }
  }

  // 3. SDK address book vs the documented perps collateral (the docs warn they differ)
  const sdkCollateral = (SOMNIA_HIDEKI_TESTNET_ADDRESSES as any).collateral as string | undefined;
  rows.push({ kind: "sdkAddressBook", collateral: sdkCollateral, docsPerpCollateral: DOCS_CONTRACTS.collateral });

  // 4. Per market: decimals, book parameters, mark feed
  const seenSymbols = new Set<string>();
  const feedFailures: string[] = [];
  for (const m of perps) {
    const sym = m.baseSymbol ?? m.id;
    const tag = seenSymbols.has(sym) ? `${sym}@${m.poolAddress.slice(0, 8)}` : sym;
    seenSymbols.add(sym);
    console.log(`market ${tag} pool ${m.poolAddress}`);
    const row: Record<string, unknown> = {
      kind: "market",
      symbol: sym,
      pool: m.poolAddress,
      baseDecimals: m.baseDecimals,
      quoteDecimals: m.quoteDecimals,
      tickSize: m.tickSize,
      lotSize: m.lotSize,
      minQuantity: m.minQuantity,
      initialMarginBps: m.initialMarginBps,
      quoteToken: m.quoteToken,
      markPriceIndexer: m.markPrice,
      markPriceUpdatedAt: m.markPriceUpdatedAt,
      fundingWindowSec: m.fundingWindowSec,
      fundingIntervalSec: m.fundingIntervalSec,
    };

    const docDec = DOCS_BASE_DECIMALS[sym];
    if (docDec === undefined) {
      note({ id: `docs-missing-${sym}`, severity: "info", title: `${sym} is live but missing from the docs decimals table`, detail: `indexer baseDecimals ${m.baseDecimals}` });
    } else if (docDec !== m.baseDecimals) {
      note({ id: `decimals-${sym}`, severity: "warn", title: `${sym} base decimals: docs ${docDec}, indexer ${m.baseDecimals}`, detail: "Orders sized from the docs table would be off by a power of ten." });
    }
    if (m.quoteDecimals !== DOCS_QUOTE_DECIMALS) {
      note({ id: `quote-decimals-${sym}`, severity: "warn", title: `${sym} quote decimals ${m.quoteDecimals}, docs say prices always use 18`, detail: "" });
    }
    if (!same(m.quoteToken, DOCS_CONTRACTS.collateral)) {
      note({ id: `quote-token-${sym}`, severity: "warn", title: `${sym} quoteToken is not the documented USDso`, detail: `market row ${m.quoteToken}, docs ${DOCS_CONTRACTS.collateral}` });
    }

    // base token decimals straight from the token contract
    if (!m.baseIsNative) {
      try {
        const dec = await retry("decimals", () => rpc.readContract({ address: m.baseToken, abi: ERC20_ABI, functionName: "decimals" }), 3);
        row.baseTokenDecimalsOnchain = dec;
        if (dec !== m.baseDecimals) {
          note({ id: `token-decimals-${sym}`, severity: "warn", title: `${sym}: token decimals() ${dec} != indexer baseDecimals ${m.baseDecimals}`, detail: m.baseToken });
        }
      } catch (e) {
        row.baseTokenDecimalsOnchain = `error: ${String(e).slice(0, 120)}`;
      }
    }

    // book parameters straight from the pool
    try {
      const [tick, minQ, lot] = await retry("getOrderBookParameters", () => rpc.readContract({ address: m.poolAddress as Address, abi: POOL_ABI, functionName: "getOrderBookParameters" }), 3);
      Object.assign(row, { tickSizeOnchain: tick, minQuantityOnchain: minQ, lotSizeOnchain: lot });
      const pairs: [string, string, bigint][] = [
        ["tickSize", m.tickSize, tick],
        ["minQuantity", m.minQuantity, minQ],
        ["lotSize", m.lotSize, lot],
      ];
      for (const [name, idx, chain] of pairs) {
        if (BigInt(idx) !== chain) {
          note({ id: `${name}-${sym}`, severity: "warn", title: `${sym} ${name}: indexer ${idx}, pool ${chain}`, detail: m.poolAddress });
        }
      }
      if (minQ % lot !== 0n) {
        note({ id: `minq-lot-${sym}`, severity: "info", title: `${sym} minQuantity is not a multiple of lotSize`, detail: `minQuantity ${minQ}, lotSize ${lot}` });
      }
    } catch (e) {
      row.bookParams = `error: ${String(e).slice(0, 160)}`;
    }

    // mark feed
    try {
      const feed = await retry("getPerpFeedStatus", () => client.getPerpFeedStatus(m.poolAddress as Address), 3);
      Object.assign(row, { markPriceOk: feed.markPriceOk, markPriceOnchain: feed.markPrice, openInterest: feed.openInterest, indexUpdatedAt: feed.indexUpdatedAt });
      if (!feed.markPriceOk) {
        note({ id: `mark-stale-${sym}`, severity: "info", title: `${sym} mark price is not live (markPriceOk=false)`, detail: "getMaxPerpOrderSize answers priceable:false while this lasts." });
      }
    } catch (e) {
      row.feed = `error after retries: ${String(e).split(/\r?\n/)[0].slice(0, 160)}`;
      feedFailures.push(sym);
    }
    rows.push(json(row));
  }

  if (feedFailures.length) {
    note({ id: "feed-read-flaky", severity: "info", title: `getPerpFeedStatus failed after 3 attempts for ${feedFailures.length} of ${perps.length} markets`, detail: `${feedFailures.join(", ")}. The public RPC timed out (getBlockNumber); rerun to fill these rows.` });
  }
  for (const sym of Object.keys(DOCS_BASE_DECIMALS)) {
    if (!seenSymbols.has(sym)) {
      note({ id: `docs-extra-${sym}`, severity: "info", title: `${sym} is in the docs decimals table but the indexer lists no such perp market`, detail: "" });
    }
  }

  const report = { tool: "dreamdex-probe", startedAt, docs: DOCS_URL, chainId, headBlock: head.toString(), sdk: "@somnia-chain/markets-sdk@0.32.1", findings, rows };
  mkdirSync("out", { recursive: true });
  writeFileSync("out/report.json", JSON.stringify(json(report), null, 2));
  const md = [
    `# dreamdex-probe report`,
    ``,
    `- Run: ${startedAt}, chain ${chainId}, head block ${head}`,
    `- Docs snapshot: ${DOCS_URL}`,
    `- Perp markets in the indexer: ${perps.length}`,
    ``,
    `## Findings (${findings.length})`,
    ...findings.map((f) => `- **${f.severity}** \`${f.id}\` ${f.title}${f.detail ? ` — ${f.detail}` : ""}`),
    ``,
    `## Markets`,
    `| symbol | baseDec | quoteDec | tick | lot | minQty | IM bps | mark ok |`,
    `|---|---|---|---|---|---|---|---|`,
    ...rows
      .filter((r) => r.kind === "market")
      .map((r) => `| ${r.symbol} | ${r.baseDecimals} | ${r.quoteDecimals} | ${r.tickSize} | ${r.lotSize} | ${r.minQuantity} | ${r.initialMarginBps} | ${r.markPriceOk ?? "?"} |`),
  ].join("\n");
  writeFileSync("out/report.md", md + "\n");
  console.log(`\n${findings.length} findings -> out/report.md`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
