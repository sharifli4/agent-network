import type { Request, Response } from "express";
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  SendMessageParams,
  GetTaskParams,
} from "../types/a2a.js";
import { createTask, getTask, updateTaskState, addArtifact } from "./task-store.js";
import { executeTask } from "./task-executor.js";

function errorResponse(id: string | number, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function successResponse(id: string | number, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

async function handleSendMessage(
  id: string | number,
  params: SendMessageParams,
): Promise<JsonRpcResponse> {
  const task = createTask(params.message, params.metadata);

  updateTaskState(task.id, "working");

  try {
    const result = await executeTask(params.message, params.metadata);

    const agentMessage = {
      role: "agent" as const,
      parts: [{ type: "text" as const, text: result.text }],
    };

    updateTaskState(task.id, "completed", agentMessage);
    addArtifact(task.id, {
      name: "response",
      parts: [{ type: "text" as const, text: result.text }],
    });

    const updatedTask = getTask(task.id)!;
    return successResponse(id, updatedTask);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const agentMessage = {
      role: "agent" as const,
      parts: [{ type: "text" as const, text: `Error: ${errMsg}` }],
    };
    updateTaskState(task.id, "failed", agentMessage);
    return errorResponse(id, -32000, errMsg);
  }
}

function handleGetTask(id: string | number, params: GetTaskParams): JsonRpcResponse {
  const task = getTask(params.id);
  if (!task) {
    return errorResponse(id, -32001, `Task not found: ${params.id}`);
  }
  return successResponse(id, task);
}

export async function rpcHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as JsonRpcRequest;

  if (!body.jsonrpc || body.jsonrpc !== "2.0" || !body.method) {
    res.status(400).json(errorResponse(body?.id ?? 0, -32600, "Invalid JSON-RPC request"));
    return;
  }

  let response: JsonRpcResponse;

  switch (body.method) {
    case "message/send":
      response = await handleSendMessage(body.id, body.params as unknown as SendMessageParams);
      break;
    case "tasks/get":
      response = handleGetTask(body.id, body.params as unknown as GetTaskParams);
      break;
    default:
      response = errorResponse(body.id, -32601, `Method not found: ${body.method}`);
  }

  res.json(response);
}
