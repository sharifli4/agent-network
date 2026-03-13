# agent-network

> ⚠️ **This project is currently under active development.** Features may be incomplete, APIs may change, and things may break. Use at your own risk.

Let your Claude Code talk to your friend's Claude Code. Ask questions about their codebase or delegate coding tasks to their agent — all from your terminal.

```
Your Claude Code  -->  MCP Server  -->  HTTP  -->  Friend's A2A Server  -->  Claude Agent SDK
     (ask_agent)       (stdio)         (a2a)       (Express)                (query())
```

---

## Step-by-Step Setup (You + One Friend)

> Both you and your friend follow these steps on your own machines.

### Step 1: Clone and install

```bash
git clone git@github.com:sharifli4/agent-network.git
cd agent-network
npm install
```

### Step 2: Generate your bearer token

This is your password — it protects your agent from unauthorized access.

```bash
openssl rand -hex 32
```

Save the output. You'll need it in the next step AND you'll share it with your friend.

### Step 3: Create your `.env` file

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
BEARER_TOKEN=<paste your generated token here>
AGENT_NAME=kenan
AGENT_DESCRIPTION=Backend API agent (NestJS)
WORKING_DIRECTORY=/home/kenan/repositories/my-project
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**What each variable does:**

| Variable | What it is | Example |
|----------|-----------|---------|
| `PORT` | Port your server runs on | `3000` |
| `BEARER_TOKEN` | Your token — share this with your friend | `a3f1b9c8e2d4...` |
| `AGENT_NAME` | Your name | `kenan` |
| `AGENT_DESCRIPTION` | What your codebase is about | `Backend API agent (NestJS)` |
| `WORKING_DIRECTORY` | The project folder your agent can access | `/home/kenan/repos/my-project` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-...` |

### Step 4: Exchange info with your friend

**Send your friend:**
- Your IP address (run `ip addr | grep 'inet ' | grep -v 127.0.0.1`)
- Your port (default `3000`)
- Your bearer token

**Get from your friend:**
- Their IP address
- Their port
- Their bearer token

### Step 5: Create `agents.config.json`

This file tells your MCP tools where your friend's agent lives.

```bash
cp agents.config.example.json agents.config.json
chmod 600 agents.config.json
```

Edit it with your **friend's** info:

```json
{
  "agents": [
    {
      "name": "shahriyar",
      "url": "http://192.168.1.50:3000",
      "description": "Frontend agent (React Native)",
      "bearerToken": "token-your-friend-gave-you"
    }
  ]
}
```

You can add multiple friends — just add more entries to the `agents` array.

### Step 6: Start your A2A server

```bash
npm run dev:server
```

You should see:

```
A2A server listening on port 3000
Agent card: http://localhost:3000/.well-known/agent.json
A2A endpoint: http://localhost:3000/a2a
```

**Verify it works:**

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Step 7: Add MCP server to Claude Code

Edit `~/.claude/settings.json` and add:

```json
{
  "mcpServers": {
    "agent-network": {
      "command": "npx",
      "args": ["tsx", "/home/you/agent-network/src/mcp/index.ts"],
      "env": {
        "AGENT_NETWORK_CONFIG": "/home/you/agent-network/agents.config.json"
      }
    }
  }
}
```

> Replace `/home/you/agent-network` with your actual path.

Restart Claude Code for the MCP server to load.

### Step 8: Test the connection

Before using Claude Code, verify you can reach your friend's server:

```bash
# Check their agent card
curl http://<friends-ip>:3000/.well-known/agent.json

# Send a test RPC call
curl -X POST http://<friends-ip>:3000/a2a \
  -H "Authorization: Bearer <token-they-gave-you>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tasks/get","params":{"id":"test"}}'
```

If you get a JSON response (even an error like "Task not found"), the connection works.

---

## Usage

Once everything is set up, you have **3 tools** available in Claude Code:

### 1. List your network

> "Who can I talk to?"

Just ask Claude Code to list agents, or it will call:

```
list_agents
```

Returns all agents from your `agents.config.json`.

### 2. Ask a question (read-only)

> "Ask my friend about their codebase"

```
ask shahriyar what authentication library the frontend uses
```

Claude Code calls `ask_agent` under the hood. The remote agent can **only read** files — it cannot modify anything. Use this for:

- "What framework does the frontend use?"
- "How does their auth flow work?"
- "What API endpoints does their app call?"
- "What's the structure of their project?"

### 3. Delegate a task (read + write)

> "Tell my friend's agent to do something"

```
delegate to shahriyar: add a loading spinner to the login screen
```

Claude Code calls `delegate_task` under the hood. The remote agent can **read and write** files. Use this for:

- "Add error handling to the API client"
- "Create a new component for the settings page"
- "Fix the bug in the checkout flow"
- "Update the API response type to match the new backend schema"

---

## Networking

Both machines must be able to reach each other over HTTP. Options:

| Situation | Solution |
|-----------|----------|
| Same WiFi / LAN | Use local IP addresses (`192.168.x.x`) — works out of the box |
| Different networks | Use [Tailscale](https://tailscale.com) or WireGuard for a private tunnel |
| Quick test over internet | Use [ngrok](https://ngrok.com): `ngrok http 3000` gives a public URL |
| Have a server | SSH tunnel: `ssh -R 3000:localhost:3000 your-server` |

---

## How It Works

**A2A Server** (Express) — you host this on your machine. When a friend's agent sends a request, it:
1. Authenticates the bearer token
2. Creates a task
3. Runs the Claude Agent SDK against your `WORKING_DIRECTORY`
4. Returns the result

**MCP Server** (stdio) — runs inside your Claude Code. Provides the 3 tools above. When you use a tool, it sends an HTTP request to your friend's A2A server.

**Security:**
- `ask_agent` = read-only (tools: `Read`, `Glob`, `Grep`, `Bash`)
- `delegate_task` = full access (adds: `Edit`, `Write`)
- All requests require a valid bearer token
- `agents.config.json` contains tokens — keep it private (`chmod 600`)

---

## A2A Protocol

The server implements a subset of the [A2A protocol](https://google.github.io/A2A/):

| Endpoint | Description |
|----------|-------------|
| `GET /.well-known/agent.json` | Agent card (name, description, capabilities) |
| `GET /health` | Health check |
| `POST /a2a` | JSON-RPC 2.0 — `message/send` and `tasks/get` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start A2A server (development, with hot reload) |
| `npm run dev:mcp` | Start MCP server (development) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:server` | Start compiled A2A server |
| `npm run start:mcp` | Start compiled MCP server |
