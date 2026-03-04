import { config } from "dotenv";
config();

import { createApp } from "./app.js";

const port = parseInt(process.env.PORT || "3000", 10);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`A2A server listening on port ${port}`);
  console.log(`Agent card: http://localhost:${port}/.well-known/agent.json`);
  console.log(`A2A endpoint: http://localhost:${port}/a2a`);
});
