export interface RemoteAgentConfig {
  name: string;
  url: string;
  description: string;
  bearerToken: string;
}

export interface AgentNetworkConfig {
  agents: RemoteAgentConfig[];
}
