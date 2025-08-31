# Coin Price MCP

[![smithery badge](https://smithery.ai/badge/@Liam8/free-coin-price-mcp)](https://smithery.ai/server/@Liam8/free-coin-price-mcp)

## Available Tools

### getCoinPrice
Get coin prices from CoinGecko API.

**Parameters:**
- `ids` (optional): Comma-separated list of coin IDs
- `names` (optional): Comma-separated list of coin names  
- `symbols` (optional): Comma-separated list of coin symbols
- `vs_currencies` (optional, default: "usd"): Comma-separated list of target currencies

### getSupportedCurrencies
Get supported currencies from CoinGecko API.

**Parameters:** None

### getPublicCompaniesHoldings
Get public companies' Bitcoin or Ethereum holdings from CoinGecko API.

**Parameters:**
- `coin_id` (required): Must be either 'bitcoin' or 'ethereum'

This endpoint allows you to query public companies' Bitcoin or Ethereum holdings. The responses are sorted in descending order based on total holdings.
