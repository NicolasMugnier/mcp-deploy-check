import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BUSINESS_HOURS_START = 9;
const BUSINESS_HOURS_END = 17;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function checkDeploy(): { allowed: boolean; reason: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  const hour = now.getHours();
  const dayName = DAYS[day];

  if (day === 0 || day === 6) {
    return {
      allowed: false,
      reason: `It's ${dayName}. Nobody should be deploying on weekends. Close your laptop.`,
    };
  }

  if (day === 5) {
    return {
      allowed: false,
      reason: `It's Friday. Never deploy on a Friday unless you enjoy ruining your weekend. Step away from the keyboard.`,
    };
  }

  if (hour < BUSINESS_HOURS_START) {
    return {
      allowed: false,
      reason: `It's ${hour}:${String(now.getMinutes()).padStart(2, "0")} — too early. Wait until ${BUSINESS_HOURS_START}:00 so the team is around if something goes wrong.`,
    };
  }

  if (hour >= BUSINESS_HOURS_END) {
    return {
      allowed: false,
      reason: `It's ${hour}:${String(now.getMinutes()).padStart(2, "0")} — end of business hours. Deploy tomorrow morning when the team is fresh.`,
    };
  }

  const timeLeft = BUSINESS_HOURS_END - hour;
  return {
    allowed: true,
    reason: `It's ${dayName} at ${hour}:${String(now.getMinutes()).padStart(2, "0")} — you're good to go! You have ~${timeLeft} hour(s) left in the deploy window. Ship it.`,
  };
}

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
      content: [
        {
          type: "text",
          text: `${allowed ? "✅ YES" : "🚫 NO"} — ${reason}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
