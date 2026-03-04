// A2A Protocol Types (JSON-RPC 2.0 based)

export type TaskState =
  | "submitted"
  | "working"
  | "input-required"
  | "completed"
  | "canceled"
  | "failed";

export interface TextPart {
  type: "text";
  text: string;
}

export type Part = TextPart;

export interface Message {
  role: "user" | "agent";
  parts: Part[];
  metadata?: Record<string, unknown>;
}

export interface Artifact {
  name?: string;
  description?: string;
  parts: Part[];
}

export interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp: string;
}

export interface Task {
  id: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  history?: Message[];
  metadata?: Record<string, unknown>;
}

export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
}

export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapabilities;
  skills: AgentSkill[];
}

// JSON-RPC 2.0

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// A2A method params

export interface SendMessageParams {
  message: Message;
  metadata?: Record<string, unknown>;
}

export interface GetTaskParams {
  id: string;
}
