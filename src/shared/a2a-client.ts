import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Task,
  SendMessageParams,
  GetTaskParams,
} from "../types/a2a.js";

export class A2AClient {
  constructor(
    private baseUrl: string,
    private bearerToken: string,
  ) {}

  private async rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    };

    const response = await fetch(`${this.baseUrl}/a2a`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.bearerToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`A2A request failed: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as JsonRpcResponse;

    if (result.error) {
      throw new Error(`A2A RPC error ${result.error.code}: ${result.error.message}`);
    }

    return result.result;
  }

  async sendMessage(params: SendMessageParams): Promise<Task> {
    return (await this.rpc("message/send", params as unknown as Record<string, unknown>)) as Task;
  }

  async getTask(params: GetTaskParams): Promise<Task> {
    return (await this.rpc("tasks/get", params as unknown as Record<string, unknown>)) as Task;
  }
}
