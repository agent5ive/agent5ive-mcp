# Agent5ive MCP Server

[![smithery badge](https://smithery.ai/badge/@agent5ive/agent5ive-mcp)](https://smithery.ai/server/@agent5ive/agent5ive-mcp)

This package provides a Model Context Protocol (MCP) server for interacting with deployed Agent5ive agents. It allows you to connect your MCP-compatible clients (like Claude Desktop) to your Agent5ive agents to leverage their capabilities as tools.

## Installation

### Installing via Smithery

To install agent5ive-mcp automatically via [Smithery](https://smithery.ai/server/@agent5ive/agent5ive-mcp):

```bash
npx -y @smithery/cli install @agent5ive/agent5ive-mcp
```

### Manual Installation
To use this MCP server, you can run it directly with `npx` or install it globally:

```bash
npm install -g agent5ive-mcp
```

## Usage

To run the server, you need to provide the `DEPLOYMENT_ID` of your Agent5ive agent as an environment variable.

```bash
export DEPLOYMENT_ID="your-deployment-id"
npx agent5ive-mcp
```

The server will start and listen for commands on standard input/output.

### Connecting with an MCP Client

You can connect to this server from any MCP-compatible client. For example, to connect from Claude Desktop, add the following to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "my-agent5ive-agent": {
      "command": "npx",
      "args": [
        "agent5ive-mcp"
      ],
      "env": {
        "DEPLOYMENT_ID": "your-deployment-id"
      }
    }
  }
}
```

## Available Tools

This server exposes the following tools:

### `get_agent_purpose`

*   **Description**: Get the details and purpose of the deployed agent.
*   **Input**: None

### `interact_with_agent`

*   **Description**: Interact with the deployed agent.
*   **Input**:
    *   `message` (string, required): The message to send to the agent.
    *   `history` (array, optional): The conversation history.
