import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListAgents } from "./tools/list-agents.js";
import { registerAskAgent } from "./tools/ask-agent.js";
import { registerDelegateTask } from "./tools/delegate-task.js";

const server = new McpServer({
  name: "agent-network",
  version: "0.1.0",
});

registerListAgents(server);
registerAskAgent(server);
registerDelegateTask(server);

const transport = new StdioServerTransport();
await server.connect(transport);
