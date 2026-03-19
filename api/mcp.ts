import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { checkDeploy, DEFAULT_TIMEZONE } from "../src/check.js";

function createServer(): McpServer {
  const server = new McpServer({
    name: "mcp-deploy-check",
    version: "1.0.0",
  });

  server.tool(
    "can_i_deploy",
    "Checks whether it is safe to deploy to production right now based on the current day and time.",
    { timezone: z.string().optional().describe(`IANA timezone name (e.g. "Europe/Paris", "America/New_York"). Defaults to ${DEFAULT_TIMEZONE}.`) },
    async ({ timezone }) => {
      const { allowed, reason } = checkDeploy(timezone);
      return {
        content: [{ type: "text", text: `${allowed ? "✅ YES" : "🚫 NO"} — ${reason}` }],
      };
    }
  );

  return server;
}

const ALLOWED_ORIGINS = [
  "https://blog.anyvoid.dev",
  "https://nicolasmugnier.github.io",
];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = (req.headers["origin"] as string) ?? "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });

  const server = createServer();
  await server.connect(transport);

  // Parse body for POST requests
  let body: unknown = undefined;
  if (req.method === "POST") {
    body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });
  }

  await transport.handleRequest(req, res, body);
  await server.close();
}
