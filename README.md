# agent-network

A2A protocol bridge that lets Claude Code agents communicate with each other. Delegate tasks and query knowledge across friends' codebases via JSON-RPC 2.0 server + MCP tools.

```
Your Claude Code  -->  MCP Server  -->  HTTP  -->  Friend's A2A Server  -->  Claude Agent SDK
     (ask_agent)       (stdio)         (a2a)       (Express)                (query())
```

## Quick Start

### 1. Install

```bash
git clone git@github.com:sharifli4/agent-network.git
cd agent-network
npm install
```

### 2. Configure Your Server

Copy and edit the environment file:

```bash
cp .env.example .env
```

```env
PORT=3000
BEARER_TOKEN=your-secret-token-here
AGENT_NAME=my-agent
AGENT_DESCRIPTION=My Claude Code agent
WORKING_DIRECTORY=/path/to/your/project
ANTHROPIC_API_KEY=sk-ant-...
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port for the A2A server (default: 3000) |
| `BEARER_TOKEN` | Secret token that remote agents must provide to call your server |
| `AGENT_NAME` | Your agent's display name |
| `AGENT_DESCRIPTION` | Short description of what your agent knows about |
| `WORKING_DIRECTORY` | The project directory your agent operates in |
| `ANTHROPIC_API_KEY` | Your Anthropic API key for the Claude Agent SDK |

### 3. Configure Remote Agents

Copy and edit the agents config:

```bash
cp agents.config.example.json agents.config.json
chmod 600 agents.config.json  # keep tokens private
```

```json
{
  "agents": [
    {
      "name": "kenan",
      "url": "http://192.168.1.10:3000",
      "description": "Kenan's agent — works on the backend API (NestJS)",
      "bearerToken": "kenans-secret-token"
    },
    {
      "name": "shahriyar",
      "url": "http://192.168.1.50:3000",
      "description": "Shahriyar's agent — works on the frontend (React Native)",
      "bearerToken": "shahriyars-secret-token"
    }
  ]
}
```

Each entry is a friend's agent you want to talk to. The `bearerToken` is the token **they** gave you (matches their `BEARER_TOKEN` env var).

### 4. Start the A2A Server

```bash
npm run dev:server
```

Verify it's running:

```bash
curl http://localhost:3000/.well-known/agent.json
curl http://localhost:3000/health
```

### 5. Add MCP Server to Claude Code

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "agent-network": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/agent-network/src/mcp/index.ts"],
      "env": {
        "AGENT_NETWORK_CONFIG": "/absolute/path/to/agent-network/agents.config.json"
      }
    }
  }
}
```

## Usage

Once both the server and MCP are configured, you get three tools in Claude Code:

### `list_agents`

Lists all remote agents in your network.

```
> list_agents
[
  { "name": "shahriyar", "url": "http://192.168.1.50:3000", "description": "..." }
]
```

### `ask_agent`

Ask a read-only question about a friend's codebase. The remote agent can only read files — no modifications allowed.

```
> ask_agent agent_name="shahriyar" question="What state management library does the frontend use?"
```

### `delegate_task`

Delegate a full coding task to a friend's agent. The remote agent can read and write files.

```
> delegate_task agent_name="shahriyar" task="Add a loading spinner to the login screen"
```

Set `wait=false` to submit without waiting for completion:

```
> delegate_task agent_name="shahriyar" task="Refactor the auth module" wait=false
```

## How It Works

**Two entry points in one package:**

- **A2A Server** (Express, port 3000) — each person hosts this on their machine. It receives tasks via JSON-RPC 2.0, authenticates with bearer tokens, and executes them using the Claude Agent SDK against the local codebase.

- **MCP Server** (stdio) — each person adds this to their Claude Code. It provides the three tools above, which call remote A2A servers over HTTP.

**Security model:**

- `ask_agent` enforces read-only at two levels: prompt instructions AND restricted tool set (`Read`, `Glob`, `Grep`, `Bash`)
- `delegate_task` allows full tools: `Read`, `Glob`, `Grep`, `Bash`, `Edit`, `Write`
- All A2A requests require a valid bearer token
- Keep `agents.config.json` private (`chmod 600`) since it contains tokens

## A2A Protocol

The server implements a subset of the [A2A protocol](https://google.github.io/A2A/):

| Endpoint | Method |
|----------|--------|
| `GET /.well-known/agent.json` | Agent card discovery |
| `GET /health` | Health check |
| `POST /a2a` | JSON-RPC 2.0 (`message/send`, `tasks/get`) |

## Scripts

```bash
npm run dev:server    # Start A2A server (development)
npm run dev:mcp       # Start MCP server (development)
npm run build         # Compile TypeScript
npm run start:server  # Start compiled A2A server
npm run start:mcp     # Start compiled MCP server
```

## Setup Between Two People

1. **Both** clone the repo and run `npm install`
2. **Both** create `.env` with their own `BEARER_TOKEN` and `WORKING_DIRECTORY`
3. **Exchange** bearer tokens with each other
4. **Both** create `agents.config.json` with each other's `url` + `bearerToken`
5. **Both** start their A2A server: `npm run dev:server`
6. **Both** add the MCP server to their Claude Code settings
7. Start using `ask_agent` and `delegate_task` in Claude Code
