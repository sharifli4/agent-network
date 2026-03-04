import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentNetworkConfig } from "../types/config.js";

export function loadConfig(): AgentNetworkConfig {
  const configPath = resolve(
    process.env.AGENT_NETWORK_CONFIG || "./agents.config.json",
  );

  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as AgentNetworkConfig;

    if (!Array.isArray(parsed.agents)) {
      throw new Error(`Invalid config: "agents" must be an array`);
    }

    for (const agent of parsed.agents) {
      if (!agent.name || !agent.url || !agent.bearerToken) {
        throw new Error(
          `Invalid agent config: each agent needs name, url, and bearerToken`,
        );
      }
    }

    return parsed;
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      console.warn(`Config file not found at ${configPath}, using empty config`);
      return { agents: [] };
    }
    throw err;
  }
}
