import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { checkDeploy } from "./check.js";

const server = new McpServer({
  name: "mcp-deploy-check",
  version: "1.0.0",
});

server.tool(
  "can_i_deploy",
  "Checks whether it is safe to deploy to production right now based on the current day and time.",
  {},
  async () => {
    const { allowed, reason } = checkDeploy();
    return {
      content: [{ type: "text", text: `${allowed ? "✅ YES" : "🚫 NO"} — ${reason}` }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
