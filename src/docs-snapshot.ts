// Values copied from https://app.testnet.dreamdex.io/docs/developers/perps-testnet on 2026-11-10.
// The probe compares them with what the chain and the indexer actually return.
export const DOCS_URL = "https://app.testnet.dreamdex.io/docs/developers/perps-testnet";

export const DOCS_CHAIN = {
  chainId: 50383,
  rpc: "https://api.hideki2.infra.testnet.somnia.network",
  ws: "wss://api.hideki2.infra.testnet.somnia.network/ws",
  indexer: "https://hideki-dev.smk.somnia.host/v1/graphql",
};

export const DOCS_CONTRACTS = {
  marginBank: "0x478769E1177C0773c43A593DCCc4Ad15F15F1394",
  collateral: "0xed7993A74dAe1e6656B704A424DcD8711aAf4F72",
  perpPoolFactory: "0xE631fAEE547baeE07353E290f0562ea67d856560",
  liquidationEngine: "0xA66d3C24Ad4a389d863846905D8173e1017e9F4D",
  insuranceFund: "0x50826894D47C6D4f3BeA38BFDC7Dc5c5be171b80",
  voucherDistributor: "0x2ACD9EFdA721450906bfE1bef3edE269636E42C4",
  operatorPermissionsRegistry: "0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a",
} as const;

/** "Base decimals" table from the same page. */
export const DOCS_BASE_DECIMALS: Record<string, number> = {
  ADA: 6, HYPE: 6, PUMP: 6, XRP: 6,
  XLM: 7,
  BTC: 8, DOGE: 8, ZEC: 8,
  SOL: 9, SUI: 9, TAO: 9,
  "1000PEPE": 18, AVAX: 18, BNB: 18, ETH: 18, LINK: 18, LIT: 18, VVV: 18, WLD: 18, ZRO: 18,
  NEAR: 24,
};

/** Documented price scale: "price always has 18 decimals, because every market's collateral, USDso, does." */
export const DOCS_QUOTE_DECIMALS = 18;
