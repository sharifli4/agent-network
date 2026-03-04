import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../../shared/config-loader.js";
import { A2AClient } from "../../shared/a2a-client.js";

export function registerAskAgent(server: McpServer): void {
  server.tool(
    "ask_agent",
    "Ask a remote agent a read-only question about their codebase",
    {
      agent_name: z.string().describe("Name of the remote agent to ask"),
      question: z.string().describe("The question to ask"),
    },
    async ({ agent_name, question }) => {
      const config = loadConfig();
      const agent = config.agents.find((a) => a.name === agent_name);

      if (!agent) {
        const available = config.agents.map((a) => a.name).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Agent "${agent_name}" not found. Available: ${available || "none"}`,
            },
          ],
          isError: true,
        };
      }

      const client = new A2AClient(agent.url, agent.bearerToken);

      try {
        const task = await client.sendMessage({
          message: {
            role: "user",
            parts: [{ type: "text", text: question }],
          },
          metadata: { readOnly: true },
        });

        const responseText =
          task.artifacts?.[0]?.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("\n") || task.status.message?.parts?.map((p) => p.text).join("\n") || "No response";

        return {
          content: [
            {
              type: "text" as const,
              text: `Response from ${agent_name}:\n\n${responseText}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error contacting ${agent_name}: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
