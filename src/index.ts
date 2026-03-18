import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { checkDeploy, DEFAULT_TIMEZONE } from "./check.js";

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

const transport = new StdioServerTransport();
await server.connect(transport);
