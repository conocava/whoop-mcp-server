import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env, TokenData } from "./types.js";
import * as whoop from "./whoop-client.js";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const SCOPES = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline";

// Default user ID for token storage — in production, derive from OAuth identity
const USER_ID = "default";

export class WhoopMCP extends McpAgent<Env, {}, {}> {
  server = new McpServer({
    name: "whoop-mcp-server",
    version: "1.0.0",
  });

  async init() {
    const env = this.env;

    // --- Profile ---
    this.server.tool(
      "get_profile",
      "Get the user's WHOOP profile (name and email)",
      {},
      { readOnlyHint: true, destructiveHint: false },
      async () => {
        const data = await whoop.getProfile(env, USER_ID);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Body Measurement ---
    this.server.tool(
      "get_body_measurement",
      "Get body measurements: height, weight, and max heart rate",
      {},
      { readOnlyHint: true, destructiveHint: false },
      async () => {
        const data = await whoop.getBodyMeasurement(env, USER_ID);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Recovery ---
    this.server.tool(
      "get_recoveries",
      "Get recovery data including recovery score, HRV (RMSSD), resting heart rate, SpO2, and skin temperature. Optionally filter by date range.",
      {
        start: z.string().optional().describe("Start date (ISO 8601, e.g. 2024-01-01T00:00:00.000Z)"),
        end: z.string().optional().describe("End date (ISO 8601, e.g. 2024-01-31T00:00:00.000Z)"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getRecoveries(env, USER_ID, params.start, params.end);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Cycles ---
    this.server.tool(
      "get_cycles",
      "Get physiological cycles with day strain, average heart rate, max heart rate, and kilojoules. Optionally filter by date range.",
      {
        start: z.string().optional().describe("Start date (ISO 8601)"),
        end: z.string().optional().describe("End date (ISO 8601)"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getCycles(env, USER_ID, params.start, params.end);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Sleep ---
    this.server.tool(
      "get_sleeps",
      "Get sleep data including sleep performance, efficiency, consistency, time in each sleep stage (light, deep/SWS, REM), disturbances, and sleep needed. Optionally filter by date range.",
      {
        start: z.string().optional().describe("Start date (ISO 8601)"),
        end: z.string().optional().describe("End date (ISO 8601)"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getSleeps(env, USER_ID, params.start, params.end);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "get_sleep",
      "Get a specific sleep record by ID",
      {
        sleep_id: z.string().describe("The sleep record UUID"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getSleep(env, USER_ID, params.sleep_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Workouts ---
    this.server.tool(
      "get_workouts",
      "Get workout data including strain (0-21), heart rate zones, kilojoules burned, distance, and sport type. Optionally filter by date range.",
      {
        start: z.string().optional().describe("Start date (ISO 8601)"),
        end: z.string().optional().describe("End date (ISO 8601)"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getWorkouts(env, USER_ID, params.start, params.end);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "get_workout",
      "Get a specific workout by ID",
      {
        workout_id: z.string().describe("The workout record ID"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getWorkout(env, USER_ID, params.workout_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    // --- Cycle details ---
    this.server.tool(
      "get_cycle_recovery",
      "Get the recovery data for a specific cycle",
      {
        cycle_id: z.string().describe("The cycle ID"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getCycleRecovery(env, USER_ID, params.cycle_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );

    this.server.tool(
      "get_cycle_sleep",
      "Get the sleep data for a specific cycle",
      {
        cycle_id: z.string().describe("The cycle ID"),
      },
      { readOnlyHint: true, destructiveHint: false },
      async (params) => {
        const data = await whoop.getCycleSleep(env, USER_ID, params.cycle_id);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
    );
  }
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // --- OAuth routes ---
    if (url.pathname === "/oauth/authorize") {
      const state = crypto.randomUUID();
      // Store state in KV briefly for validation
      await env.WHOOP_TOKENS.put(`oauth_state:${state}`, "pending", { expirationTtl: 600 });

      const params = new URLSearchParams({
        client_id: env.WHOOP_CLIENT_ID,
        redirect_uri: env.WHOOP_REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        state,
      });

      return Response.redirect(`${WHOOP_AUTH_URL}?${params}`, 302);
    }

    if (url.pathname === "/oauth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state) {
        return new Response("Missing code or state", { status: 400 });
      }

      const stateValid = await env.WHOOP_TOKENS.get(`oauth_state:${state}`);
      if (!stateValid) {
        return new Response("Invalid or expired state", { status: 400 });
      }
      await env.WHOOP_TOKENS.delete(`oauth_state:${state}`);

      const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: env.WHOOP_REDIRECT_URI,
          client_id: env.WHOOP_CLIENT_ID,
          client_secret: env.WHOOP_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return new Response(`Token exchange failed: ${error}`, { status: 500 });
      }

      const data: any = await tokenResponse.json();
      const tokens: TokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
      await env.WHOOP_TOKENS.put(USER_ID, JSON.stringify(tokens));

      return new Response(
        `<html>
          <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff;">
            <div style="text-align: center;">
              <h1>Connected to WHOOP!</h1>
              <p style="color: #4ade80;">Your WHOOP account is now linked.</p>
              <p>You can close this window and return to Claude.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // --- Health check ---
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }

    // --- Landing page ---
    if (url.pathname === "/") {
      return new Response(
        `<html>
          <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0a0a0a; color: #fff;">
            <div style="text-align: center;">
              <h1>WHOOP MCP Server</h1>
              <p>MCP endpoint: <code>/mcp</code></p>
              <p><a href="/oauth/authorize" style="color: #4ade80;">Connect WHOOP Account</a></p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // --- MCP endpoint (handled by McpAgent) ---
    return (WhoopMCP as any).serve("/mcp").fetch(request, env, ctx);
  },
};
