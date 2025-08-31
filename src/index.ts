import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import axios from "axios";

const app = express();
app.use(express.json());

// Logging utility function
const logRequest = (type: string, details: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}]`, JSON.stringify(details, null, 2));
};

// Health check endpoint
app.get('/', (req, res) => {
  logRequest('HEALTH_CHECK', { 
    method: req.method, 
    url: req.url, 
    userAgent: req.get('User-Agent'),
    ip: req.ip 
  });
  res.json({ status: 'ok', message: 'Free Coin Price MCP Server is running' });
});

const API_HOST = "https://api.coingecko.com/api/v3"
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const CG_HEADER = {
  "x-cg-demo-api-key": COINGECKO_API_KEY,
  "accept": 'application/json'
}

// Handle MCP requests via POST /mcp
app.post('/mcp', async (req, res) => {
  // Log incoming MCP request
  logRequest('MCP_REQUEST', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Create a fresh MCP server instance for each request (stateless mode)
  const server = new McpServer({ name: 'FreeCoinPrice', version: '1.0.0' });

  // Define a simple "hello" tool with no arguments
  server.tool('hello', 'A simple hello tool', {}, async () => {
    logRequest('TOOL_CALL', { tool: 'hello', args: {} });
    // Return the content as text. MCP expects an array of content blocks.
    const result = { content: [{ type: 'text' as const, text: 'hello' }] };
    logRequest('TOOL_RESPONSE', { tool: 'hello', result });
    return result;
  });

  server.tool('getSupportedCurrencies', 'Get supported currencies from CoinGecko', {}, async () => {
    logRequest('TOOL_CALL', { tool: 'getSupportedCurrencies', args: {} });
    
    try {
      logRequest('EXTERNAL_API_CALL', {
        url: `${API_HOST}/simple/supported_vs_currencies`,
        method: 'GET',
        headers: CG_HEADER,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(
        `${API_HOST}/simple/supported_vs_currencies`, {
        headers: CG_HEADER,
      }
      );

      logRequest('EXTERNAL_API_RESPONSE', {
        url: `${API_HOST}/simple/supported_vs_currencies`,
        status: response.status,
        statusText: response.statusText,
        dataLength: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      });

      const v = JSON.stringify(response.data);
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_RESPONSE', { tool: 'getSupportedCurrencies', result });
      return result;
    } catch (error) {
      logRequest('EXTERNAL_API_ERROR', {
        url: `${API_HOST}/simple/supported_vs_currencies`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      console.error("Error fetching supported currencies:", error);
      const v = JSON.stringify({ error: "Failed to fetch supported currencies" });
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_ERROR_RESPONSE', { tool: 'getSupportedCurrencies', result });
      return result;
    }
  });

  // Define a tool to get coin prices
  server.tool('getCoinPrice', 'Get coin prices from CoinGecko', {
    ids: z.string().optional().describe("Comma-separated list of coin IDs"),
    names: z.string().optional().describe("Comma-separated list of coin names"),
    symbols: z.string().optional().describe("Comma-separated list of coin symbols"),
    vs_currencies: z.string().default("usd").describe("Comma-separated list of target currencies")
  }, async ({ ids,names,symbols ,vs_currencies }) => {
    const args = { ids, names, symbols, vs_currencies };
    logRequest('TOOL_CALL', { tool: 'getCoinPrice', args });
    
    try {
      const params = {
        ids: ids,
        names: names,
        symbols: symbols,
        vs_currencies: vs_currencies
      };

      logRequest('EXTERNAL_API_CALL', {
        url: `${API_HOST}/simple/price`,
        method: 'GET',
        headers: CG_HEADER,
        params,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(
        `${API_HOST}/simple/price`, {
        headers: CG_HEADER,
        params
      }
      );

      logRequest('EXTERNAL_API_RESPONSE', {
        url: `${API_HOST}/simple/price`,
        status: response.status,
        statusText: response.statusText,
        dataLength: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      });

      const v = JSON.stringify(response.data);
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_RESPONSE', { tool: 'getCoinPrice', result });
      return result;
    } catch (error) {
      logRequest('EXTERNAL_API_ERROR', {
        url: `${API_HOST}/simple/price`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      console.error("Error fetching coin prices:", error);
      const v = JSON.stringify({ error: "Failed to fetch coin prices" });
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_ERROR_RESPONSE', { tool: 'getCoinPrice', result });
      return result;
    }
  });

  // Define a tool to get public companies holdings
  server.tool('getPublicCompaniesHoldings', 'Get public companies Bitcoin or Ethereum holdings', {
    coin_id: z.enum(['bitcoin', 'ethereum']).describe("Coin ID - must be either 'bitcoin' or 'ethereum'")
  }, async ({ coin_id }) => {
    const args = { coin_id };
    logRequest('TOOL_CALL', { tool: 'getPublicCompaniesHoldings', args });
    
    try {
      logRequest('EXTERNAL_API_CALL', {
        url: `${API_HOST}/companies/public_treasury/${coin_id}`,
        method: 'GET',
        headers: CG_HEADER,
        coin_id,
        timestamp: new Date().toISOString()
      });

      const response = await axios.get(
        `${API_HOST}/companies/public_treasury/${coin_id}`, {
        headers: CG_HEADER
      }
      );

      logRequest('EXTERNAL_API_RESPONSE', {
        url: `${API_HOST}/companies/public_treasury/${coin_id}`,
        status: response.status,
        statusText: response.statusText,
        dataLength: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      });

      const v = JSON.stringify(response.data);
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_RESPONSE', { tool: 'getPublicCompaniesHoldings', result });
      return result;
    } catch (error) {
      logRequest('EXTERNAL_API_ERROR', {
        url: `${API_HOST}/companies/public_treasury/${coin_id}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      console.error("Error fetching public companies holdings:", error);
      const v = JSON.stringify({ error: "Failed to fetch public companies holdings" });
      const result = { content: [{ type: "text" as const, text: v }] };
      logRequest('TOOL_ERROR_RESPONSE', { tool: 'getPublicCompaniesHoldings', result });
      return result;
    }
  });



  // Create a streamable HTTP transport for this request (no session state)
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  // Clean up if client disconnects early
  res.on('close', () => {
    logRequest('MCP_CONNECTION_CLOSED', {
      timestamp: new Date().toISOString()
    });
    transport.close();
    server.close();
  });

  // Connect the server to the transport and handle the incoming request
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logRequest('SERVER_START', {
    port: PORT,
    timestamp: new Date().toISOString(),
    message: `MCP server listening on port ${PORT}`
  });
});
