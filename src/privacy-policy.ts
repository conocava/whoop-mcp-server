export const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy — WHOOP MCP Server</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 720px; margin: 0 auto; padding: 2rem; background: #0a0a0a; color: #e5e5e5; line-height: 1.7; }
    h1 { color: #fff; margin-bottom: 0.25rem; }
    h2 { color: #fff; margin-top: 2rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    a { color: #4ade80; }
    ul { padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p class="subtitle">WHOOP MCP Server &middot; Last updated: April 6, 2026</p>

  <h2>What This Server Does</h2>
  <p>The WHOOP MCP Server connects your WHOOP account to Claude (by Anthropic) using the Model Context Protocol (MCP). It allows Claude to read your WHOOP health data — including recovery, sleep, strain, workouts, and body measurements — so you can ask questions about your data in natural language.</p>

  <h2>Data We Access</h2>
  <p>When you connect your WHOOP account, the server requests access to:</p>
  <ul>
    <li>Recovery scores, HRV, resting heart rate, SpO2, skin temperature</li>
    <li>Sleep stages, performance, efficiency, and duration</li>
    <li>Strain scores, heart rate zones, and workout details</li>
    <li>Physiological cycles</li>
    <li>Profile information (name and email)</li>
    <li>Body measurements (height, weight, max heart rate)</li>
  </ul>

  <h2>How Your Data Is Handled</h2>
  <ul>
    <li><strong>No data is stored permanently.</strong> Health data is fetched from WHOOP's API on demand and returned directly to Claude. It is not cached, logged, or written to any database.</li>
    <li><strong>OAuth tokens are stored securely</strong> in Cloudflare Workers KV, encrypted at rest by Cloudflare. Tokens are used solely to authenticate with WHOOP's API on your behalf.</li>
    <li><strong>No data is shared with third parties.</strong> Your health data is only transmitted between WHOOP's API and Claude. It is never sold, shared, or used for advertising.</li>
    <li><strong>No analytics or tracking.</strong> The server does not use cookies, analytics services, or any form of user tracking.</li>
  </ul>

  <h2>Data Retention</h2>
  <ul>
    <li>OAuth tokens are stored in Cloudflare KV until you revoke access.</li>
    <li>No health data is retained after a request completes.</li>
  </ul>

  <h2>Your Rights</h2>
  <ul>
    <li><strong>Disconnect anytime</strong> by revoking access in your WHOOP app settings or contacting us.</li>
    <li><strong>Request deletion</strong> of your OAuth tokens by emailing us.</li>
  </ul>

  <h2>Security</h2>
  <ul>
    <li>All communication uses HTTPS/TLS.</li>
    <li>OAuth 2.0 authorization code flow with refresh tokens.</li>
    <li>Client secrets are stored as Cloudflare Worker secrets, never in source code.</li>
    <li>The server is open source: <a href="https://github.com/conocava/whoop-mcp-server">github.com/conocava/whoop-mcp-server</a></li>
  </ul>

  <h2>Contact</h2>
  <p>For questions or requests regarding your data, open an issue on <a href="https://github.com/conocava/whoop-mcp-server/issues">GitHub</a>.</p>

  <h2>Changes</h2>
  <p>This policy may be updated occasionally. Changes will be reflected on this page with an updated date.</p>
</body>
</html>`;
