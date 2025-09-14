#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

const { DEPLOYMENT_ID } = process.env;
const API_BASE_URL = 'https://www.agent5ive.com/api/deployed-agents';

if (!DEPLOYMENT_ID) {
  console.error('Error: DEPLOYMENT_ID environment variable is not set.');
  process.exit(1);
}

const server = new McpServer({
  name: "agent5ive-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
  },
});

server.tool(
  "get_agent_purpose",
  "Get the details and purpose of the deployed agent.",
  {},
  async () => {
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

server.tool(
  "interact_with_agent",
  "Interact with the deployed agent.",
  {
    message: z.string().describe("The message to send to the agent."),
    history: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).optional().describe("The conversation history."),
  },
  async ({ message, history = [] }) => {
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agent5ive MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
