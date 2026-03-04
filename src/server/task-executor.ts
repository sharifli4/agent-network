import { query } from "@anthropic-ai/claude-agent-sdk";
import type { Message } from "../types/a2a.js";

const READ_ONLY_TOOLS = ["Read", "Glob", "Grep", "Bash"];
const FULL_TOOLS = ["Read", "Glob", "Grep", "Bash", "Edit", "Write"];

export interface ExecutionResult {
  text: string;
  costUsd: number;
  durationMs: number;
}

export async function executeTask(
  message: Message,
  metadata?: Record<string, unknown>,
): Promise<ExecutionResult> {
  const cwd = process.env.WORKING_DIRECTORY || process.cwd();
  const isReadOnly = metadata?.readOnly === true;
  const tools = isReadOnly ? READ_ONLY_TOOLS : FULL_TOOLS;

  const promptText = message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");

  const systemInstructions = isReadOnly
    ? "You are answering a question from a remote agent. You have READ-ONLY access. Do NOT modify any files. Only read, search, and analyze the codebase to answer the question."
    : "You are executing a task delegated from a remote agent. You have full access to read and modify files.";

  const fullPrompt = `${systemInstructions}\n\n${promptText}`;

  let resultText = "";
  let costUsd = 0;
  let durationMs = 0;

  for await (const msg of query({
    prompt: fullPrompt,
    options: {
      cwd,
      tools,
      allowedTools: tools,
      maxTurns: 25,
      permissionMode: isReadOnly ? "plan" : "bypassPermissions",
    },
  })) {
    if (msg.type === "result") {
      resultText =
        msg.subtype === "success"
          ? msg.result
          : `Error: ${msg.errors.join("; ")}`;
      costUsd = msg.total_cost_usd;
      durationMs = msg.duration_ms;
    }
  }

  return { text: resultText, costUsd, durationMs };
}
