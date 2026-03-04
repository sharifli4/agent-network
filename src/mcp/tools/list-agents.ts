import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../../shared/config-loader.js";

export function registerListAgents(server: McpServer): void {
  server.tool(
    "list_agents",
    "List all remote agents available in your network",
    async () => {
      const config = loadConfig();
      const agents = config.agents.map((a) => ({
        name: a.name,
        url: a.url,
        description: a.description,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(agents, null, 2),
          },
        ],
      };
    },
  );
}
