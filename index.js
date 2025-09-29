import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import axios from "axios";

const { DEPLOYMENT_ID } = process.env;
const API_BASE_URL = 'https://www.agent5ive.com/api/deployed-agents';

if (!DEPLOYMENT_ID) {
  console.error('Error: DEPLOYMENT_ID environment variable is not set.');
  // process.exit(1); // Don't exit if not in HTTP mode
}

function createServer() {
  const server = new McpServer({
    name: "agent5ive-mcp-server",
    version: "1.0.0",
  });

  // Register tools
  server.registerTool(
    "get_agent_purpose",
    {
      description: "Get the details and purpose of the deployed agent.",
      inputSchema: z.object({}),
    },
    async () => {
      if (!DEPLOYMENT_ID) {
        return {
          content: [{ type: "text", text: "Error: DEPLOYMENT_ID is not set." }],
          isError: true,
        };
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/${DEPLOYMENT_ID}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "interact_with_agent",
    {
      description: "Interact with the deployed agent.",
      inputSchema: z.object({
        message: z.string().describe("The message to send to the agent."),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional().describe("The conversation history."),
      }),
    },
    async ({ message, history = [] }) => {
      if (!DEPLOYMENT_ID) {
        return {
          content: [{ type: "text", text: "Error: DEPLOYMENT_ID is not set." }],
          isError: true,
        };
      }
      const payload = {
        messages: [
          ...history,
          {
            role: 'user',
            content: message,
          },
        ],
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/${DEPLOYMENT_ID}`, payload);
        return {
          content: [
            {
              type: "text",
              text: response.data.content,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.response?.data?.error || error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

async function main() {
  const useHttp = process.argv.includes("--http");

  if (useHttp) {
    if (!DEPLOYMENT_ID) {
      console.error('Error: DEPLOYMENT_ID environment variable is not set for HTTP mode.');
      process.exit(1);
    }
    const app = express();
    const PORT = process.env.PORT || 8081;

    app.use(cors({
      origin: '*',
      exposedHeaders: ['Mcp-Session-Id', 'mcp-protocol-version'],
      allowedHeaders: ['Content-Type', 'mcp-session-id'],
    }));
    app.use(express.json());

    app.all('/mcp', async (req, res) => {
      try {
        const server = createServer();
        const transport = new StreamableHTTPServerTransport({});
        res.on('close', () => {
          transport.close();
          server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          });
        }
      }
    });

    app.listen(PORT, () => {
      console.log(`MCP HTTP Server listening on port ${PORT}`);
    });
  } else {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Agent5ive MCP Server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
