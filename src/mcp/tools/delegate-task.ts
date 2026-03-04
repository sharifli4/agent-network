import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig } from "../../shared/config-loader.js";
import { A2AClient } from "../../shared/a2a-client.js";

export function registerDelegateTask(server: McpServer): void {
  server.tool(
    "delegate_task",
    "Delegate a full coding task to a remote agent (can read and write files)",
    {
      agent_name: z.string().describe("Name of the remote agent"),
      task: z.string().describe("Detailed description of the task to delegate"),
      wait: z
        .boolean()
        .default(true)
        .describe("Wait for completion (true) or return task ID for polling (false)"),
    },
    async ({ agent_name, task, wait }) => {
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
        if (!wait) {
          // Non-blocking: send and return task ID
          // For now, still blocking since we don't have async task creation
          const result = await client.sendMessage({
            message: {
              role: "user",
              parts: [{ type: "text", text: task }],
            },
            metadata: { readOnly: false },
          });

          return {
            content: [
              {
                type: "text" as const,
                text: `Task ${result.id} submitted to ${agent_name}. Status: ${result.status.state}`,
              },
            ],
          };
        }

        const result = await client.sendMessage({
          message: {
            role: "user",
            parts: [{ type: "text", text: task }],
          },
          metadata: { readOnly: false },
        });

        const responseText =
          result.artifacts?.[0]?.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("\n") ||
          result.status.message?.parts?.map((p) => p.text).join("\n") ||
          "Task completed with no text output";

        return {
          content: [
            {
              type: "text" as const,
              text: `Task delegated to ${agent_name} (${result.status.state}):\n\n${responseText}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error delegating to ${agent_name}: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
