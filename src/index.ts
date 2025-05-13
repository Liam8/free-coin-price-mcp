import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import axios from "axios";

const app = express();
app.use(express.json());

const API_HOST = "https://api.coingecko.com/api/v3"
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const CG_HEADER = {
  "x-cg-demo-api-key": COINGECKO_API_KEY,
  "accept": 'application/json'
}

// Handle MCP requests via POST /mcp
app.post('/mcp', async (req, res) => {
  // Create a fresh MCP server instance for each request (stateless mode)
  const server = new McpServer({ name: 'FreeCoinPrice', version: '1.0.0' });

  // Define a simple "hello" tool with no arguments
  server.tool('hello', /* args schema */ {}, async () => {
    // Return the content as text. MCP expects an array of content blocks.
    return { content: [{ type: 'text', text: 'hello' }] };
  });

  server.tool('getSupportedCurrencies', /* args schema */ {}, async () => {
    try {
      const response = await axios.get(
        `${API_HOST}/simple/supported_vs_currencies`, {
        headers: CG_HEADER,
      }
      );
      const v = JSON.stringify(response.data);
      return { content: [{ type: "text", text: v }] };
    } catch (error) {
      console.error("Error fetching supported currencies:", error);
      const v = JSON.stringify({ error: "Failed to fetch supported currencies" });
      return { content: [{ type: "text", text: v }] };
    }
  });

  // Define a tool to get coin prices
  server.tool('getCoinPrice', /* args schema */ {
    ids: z.string().optional().describe("Comma-separated list of coin IDs"),
    names: z.string().optional().describe("Comma-separated list of coin names"),
    symbols: z.string().optional().describe("Comma-separated list of coin symbols"),
    vs_currencies: z.string().default("usd").describe("Comma-separated list of target currencies")
  }, async ({ ids,names,symbols ,vs_currencies }) => {
    try {
      const response = await axios.get(
        `${API_HOST}/simple/price`, {
        headers: CG_HEADER,
        params: {
          ids: ids,
          names: names,
          symbols: symbols,
          vs_currencies: vs_currencies
        }
      }
      );
      const v = JSON.stringify(response.data);
      return { content: [{ type: "text", text: v }] };
    } catch (error) {
      console.error("Error fetching coin prices:", error);
      const v = JSON.stringify({ error: "Failed to fetch coin prices" });
      return { content: [{ type: "text", text: v }] };
    }
  });

  // Define a tool to get the list of all coins
  // server.tool('getCoinList', /* args schema */ {}, async () => {
  //   try {
  //     const response = await axios.get(
  //       `${API_HOST}/coins/list`, {
  //       headers: CG_HEADER
  //     }
  //     );
  //     const v = JSON.stringify(response.data);
  //     return { content: [{ type: "text", text: v }] };
  //   } catch (error) {
  //     console.error("Error fetching coin list:", error);
  //     const v = JSON.stringify({ error: "Failed to fetch coin list" });
  //     return { content: [{ type: "text", text: v }] };
  //   }
  // });

  // Create a streamable HTTP transport for this request (no session state)
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  // Clean up if client disconnects early
  res.on('close', () => {
    transport.close();
    server.close();
  });

  // Connect the server to the transport and handle the incoming request
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Start listening
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
