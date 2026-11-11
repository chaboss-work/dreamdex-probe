# /volume accepts seconds and negative timestamps and silently returns zero volume
Severity: normal
Area: API

## Steps to reproduce
1. `curl "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/volume?until=$(( $(date +%s) - 3600 ))"`. Here `until` is in **seconds**, a very common mistake because most APIs use seconds.
2. `curl "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/volume?since=-5&until=1000"`
3. `curl "https://stg.api.dreamdex.io/v0/markets/SOMI:USDso/volume?until=1000"`

## Expected
An `invalid_param` error for timestamps that cannot be milliseconds of a real trading period, such as times before the market existed or negative values. The endpoint already rejects an `until` newer than 30 minutes and ranges over 40 days in the same way.

## Actual
All three return **200** with zero volume:

```json
{"baseVolume":"0","baseVolumeRaw":"0","quoteVolume":"0","quoteVolumeRaw":"0","since":1189560710,"symbol":"SOMI:USDso","until":1794360710}
{"baseVolume":"0","baseVolumeRaw":"0","quoteVolume":"0","quoteVolumeRaw":"0","since":-5,"symbol":"SOMI:USDso","until":1000}
{"baseVolume":"0","baseVolumeRaw":"0","quoteVolume":"0","quoteVolumeRaw":"0","since":-604799000,"symbol":"SOMI:USDso","until":1000}
```

A volume aggregator that sends seconds gets "0 volume" for every market instead of an error, and that is exactly the integration this endpoint is built for. The default call with no parameters returns real volume (`baseVolume` "1449357.99"), so the zeros come only from the unit mistake.

## Evidence
Responses above.

## Environment
HTTP API https://stg.api.dreamdex.io/v0 (testnet, Somnia Shannon 50312), checked 2026-11-11 ~00:50 UTC with curl; no wallet, no auth.
