# WHOOP MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that connects your WHOOP health data to Claude. Ask questions about your recovery, sleep, strain, and workouts in natural language.

Built on [Cloudflare Workers](https://workers.cloudflare.com) for fast, globally distributed access.

## Features

- **Recovery** — scores, HRV (RMSSD), resting heart rate, SpO2, skin temperature
- **Sleep** — performance, efficiency, consistency, sleep stages, disturbances, sleep needed
- **Strain** — daily strain scores, heart rate zones, kilojoules
- **Workouts** — strain per workout, heart rate data, distance, sport type
- **Profile & Body** — user info, height, weight, max heart rate
- All data fetched on demand from WHOOP's API — nothing stored permanently

## Usage Examples

### Recovery trends
> "How was my recovery this week? Any patterns?"

### Sleep analysis
> "Show me my sleep data for the past month. Am I getting enough deep sleep?"

### Training load
> "What were my highest strain workouts this week? How did they affect my recovery the next day?"

## Tools

| Tool | Description |
|---|---|
| `get_profile` | User profile (name, email) |
| `get_body_measurement` | Height, weight, max heart rate |
| `get_recoveries` | Recovery scores with HRV, RHR, SpO2, skin temp |
| `get_cycles` | Daily strain, heart rate, kilojoules |
| `get_sleeps` | Sleep stages, performance, efficiency |
| `get_sleep` | Single sleep record by ID |
| `get_workouts` | Workout strain, HR zones, distance |
| `get_workout` | Single workout by ID |
| `get_cycle_recovery` | Recovery for a specific cycle |
| `get_cycle_sleep` | Sleep for a specific cycle |

All tools support optional `start` and `end` date parameters (ISO 8601) for filtering by date range.

## Setup

### Connect to Claude

**Claude Desktop / claude.ai:**
1. Go to Settings → Connectors → Add custom connector
2. Name: `WHOOP`
3. URL: `https://whoop-mcp-server.conocava1.workers.dev/mcp`

**Claude Code:**
```bash
claude mcp add --transport http whoop https://whoop-mcp-server.conocava1.workers.dev/mcp --scope user
```

### Self-hosting

1. Clone the repo and install dependencies:
```bash
git clone https://github.com/conocava/whoop-mcp-server.git
cd whoop-mcp-server
npm install
```

2. Create a WHOOP developer app at [developer-dashboard.whoop.com](https://developer-dashboard.whoop.com)

3. Create a Cloudflare KV namespace:
```bash
npx wrangler kv namespace create whoop-mcp-tokens
```

4. Update `wrangler.jsonc` with your KV namespace ID

5. Set secrets:
```bash
echo "YOUR_CLIENT_ID" | npx wrangler secret put WHOOP_CLIENT_ID
echo "YOUR_CLIENT_SECRET" | npx wrangler secret put WHOOP_CLIENT_SECRET
echo "https://your-worker.workers.dev/oauth/callback" | npx wrangler secret put WHOOP_REDIRECT_URI
```

6. Deploy:
```bash
npx wrangler deploy
```

7. Authenticate at `https://your-worker.workers.dev/oauth/authorize`

## Security & Privacy

- Health data is fetched on demand and never stored — only OAuth tokens are persisted
- Tokens stored in Cloudflare KV, encrypted at rest
- All communication over HTTPS
- No analytics, tracking, or third-party data sharing
- Full [privacy policy](https://whoop-mcp-server.conocava1.workers.dev/privacy)
- Open source — audit the code yourself

## WHOOP API Scopes

This server requests all available WHOOP scopes:
- `read:recovery` — recovery, HRV, resting heart rate
- `read:cycles` — daily strain and heart rate
- `read:sleep` — sleep stages and performance
- `read:workout` — workout data and strain
- `read:profile` — name and email
- `read:body_measurement` — height, weight, max HR
- `offline` — refresh tokens for persistent access

## License

MIT
