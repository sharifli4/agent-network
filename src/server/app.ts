import express from "express";
import { bearerAuth } from "./auth.js";
import { buildAgentCard } from "./agent-card.js";
import { rpcHandler } from "./rpc-handler.js";

export function createApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Public: agent card discovery
  app.get("/.well-known/agent.json", (_req, res) => {
    res.json(buildAgentCard());
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // A2A endpoint (authenticated)
  const token = process.env.BEARER_TOKEN;
  if (!token) {
    console.warn("WARNING: BEARER_TOKEN not set, A2A endpoint is unprotected");
  }

  if (token) {
    app.post("/a2a", bearerAuth(token), rpcHandler);
  } else {
    app.post("/a2a", rpcHandler);
  }

  return app;
}
