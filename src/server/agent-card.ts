import type { AgentCard } from "../types/a2a.js";

export function buildAgentCard(): AgentCard {
  const name = process.env.AGENT_NAME || "claude-agent";
  const description =
    process.env.AGENT_DESCRIPTION || "A Claude Code agent accessible via A2A";
  const port = process.env.PORT || "3000";
  const host = process.env.AGENT_HOST || `http://localhost:${port}`;

  return {
    name,
    description,
    url: host,
    version: "0.1.0",
    capabilities: {
      streaming: false,
      pushNotifications: false,
    },
    skills: [
      {
        id: "query",
        name: "Knowledge Query",
        description: "Ask questions about the codebase this agent has access to",
      },
      {
        id: "delegate",
        name: "Task Delegation",
        description: "Delegate coding tasks to this agent",
      },
    ],
  };
}
