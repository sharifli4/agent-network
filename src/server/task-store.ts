import { randomUUID } from "node:crypto";
import type { Task, TaskState, Message, Artifact } from "../types/a2a.js";

const tasks = new Map<string, Task>();

export function createTask(message: Message, metadata?: Record<string, unknown>): Task {
  const task: Task = {
    id: randomUUID(),
    status: {
      state: "submitted",
      timestamp: new Date().toISOString(),
    },
    history: [message],
    metadata,
  };
  tasks.set(task.id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function updateTaskState(id: string, state: TaskState, agentMessage?: Message): void {
  const task = tasks.get(id);
  if (!task) return;

  task.status = {
    state,
    message: agentMessage,
    timestamp: new Date().toISOString(),
  };

  if (agentMessage) {
    task.history = task.history || [];
    task.history.push(agentMessage);
  }
}

export function addArtifact(id: string, artifact: Artifact): void {
  const task = tasks.get(id);
  if (!task) return;

  task.artifacts = task.artifacts || [];
  task.artifacts.push(artifact);
}
