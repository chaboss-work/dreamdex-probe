# The same network is called "Somnia Tokyo testnet", "Hideki" and "DreamDEX region"
Severity: normal
Area: docs

## Steps to reproduce
1. Read the bounty rules on DoraHacks: they ask for transactions "on Somnia Tokyo testnet".
2. Read https://app.testnet.dreamdex.io/docs/developers/perps-testnet: "Testnet perps run on the Hideki testnet chain, which the app shows as the DreamDEX region".
3. Read the SDK: the chain export is `hidekiTestnet`, the address book is `SOMNIA_HIDEKI_TESTNET_ADDRESSES`, and the explorer path is `/tokyo`.

## Expected
One name, or one sentence in the developer docs that says Tokyo = Hideki = the DreamDEX region (chain id 50383).

## Actual
Three names for chain 50383, and none of the pages connects them. "Tokyo" appears only in the rules, the explorer URL and an SDK source comment ("the low-latency Tokyo network").
A builder asked for a "Somnia Tokyo testnet" transaction hash has to guess that this is the Hideki chain from the docs.

## Evidence
- DoraHacks bounty page, "Who can submit" and "MVP track" sections.
- Docs page above, first paragraph and Network table.
- `@somnia-chain/markets-sdk/chains` exports.

## Environment
@somnia-chain/markets-sdk 0.32.1; Somnia Tokyo testnet (Hideki, chain 50383).
