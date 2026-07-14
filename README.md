# Managent MVP

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for a detailed repository map, file-by-file responsibilities, and local-vs-Docker run instructions.

Managent is an MCP gateway that federates tools from downstream MCP servers behind one MCP endpoint, then runs every tool call through authentication, audit logging, policy checks, schema validation, and credential injection before routing it onward.

## What is implemented

- HTTP MCP endpoint at `/mcp`
- SSE-compatible response mode and `/mcp/sse` compatibility endpoint
- stdio MCP transport for local development
- connector manager for downstream MCP servers over stdio, http, and sse
- tool federation with namespaced tools like `hello.greet`
- request router that strips the namespace before forwarding downstream
- middleware pipeline: auth, audit logging, policy, schema validation, credential injection
- Postgres-backed persistence for API keys, connectors, policies, tool snapshots, and audit logs
- management API endpoints under `/api/v1/*`
- dashboard app under `web/` that reads and mutates those persisted resources
- demo downstream MCP server in `cmd/hello-mcp`

## Backend setup

1. Create a Postgres database.
2. Point `MANAGENT_DATABASE_URL` at it, or use `config/managent.example.json`.
3. Start the gateway:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/gateway
```

The backend auto-applies `database/schema.sql`, ensures a default workspace, and seeds API keys, connectors, and policies from config on first start.

Set `security.connector_secret_key` or `MANAGENT_CONNECTOR_SECRET_KEY` before installing marketplace connectors or storing connector secrets. The key must be 32 raw bytes or base64 that decodes to 32 bytes.

## Management APIs

- `GET /api/v1/overview`
- `GET|POST /api/v1/api-keys`
- `GET|POST /api/v1/connectors`
- `GET|POST /api/v1/marketplace`
- `POST /api/v1/connectors/:id/reconnect`
- `GET|POST /api/v1/policies`
- `GET /api/v1/audit-logs`

If `admin.token` or `MANAGENT_ADMIN_TOKEN` is set, send it as a bearer token to those endpoints.

## Dashboard

Run the dashboard from `web/` with these environment variables:

```bash
MANAGENT_API_BASE_URL=http://127.0.0.1:8080
MANAGENT_ADMIN_TOKEN=managent-admin-demo
npm run dev
```

## Testing with a real AI agent

Use the seeded config in `config/managent.example.json` for an end-to-end test. It already enables the demo downstream connector `hello`, seeds the MCP bearer key `mng_live_demo`, adds a deny policy for one `hello.check_injected_credential` case, and injects a demo secret into that tool.

1. Start Postgres and the gateway:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/gateway
```

2. In your MCP-capable agent, add Managent as a remote MCP server with:
   - URL: `http://127.0.0.1:8080/mcp`
   - header: `Authorization: Bearer mng_live_demo`

   If your agent only supports stdio MCP servers, run it through any bridge that forwards stdio to the remote HTTP endpoint above and adds the same `Authorization` header on each request.

3. In the agent chat, run these checks:
   - Ask it to list tools. You should see at least `hello.greet` and `hello.check_injected_credential`.
   - Ask it to call `hello.greet` with `name` set to `Ada`. Expected result: `hello Ada`.
   - Ask it to call `hello.check_injected_credential` with `message` set to `ping`. Expected result: message=ping credential_present=true, which proves credential injection is happening inside Managent without returning a secret-derived value.
   - Ask it to call `hello.check_injected_credential` with `message` set to `blocked`. Expected result: the call is denied by policy.

4. Verify the audit trail in the dashboard or with the admin API:

```bash
curl -H 'Authorization: Bearer managent-admin-demo' \
  http://127.0.0.1:8080/api/v1/audit-logs
```

That flow exercises the parts that matter for a real agent integration: remote MCP transport, API-key auth, tool federation, policy enforcement, credential injection, and audit logging.

## Docker Compose

Bring up Postgres, the Go gateway, and the dashboard together:

```bash
docker compose up --build
```

The dashboard service runs `next dev` with the local `web/` directory mounted into the container, so UI edits should appear automatically in the browser through Next.js Fast Refresh.

If dependencies change in `web/package.json`, rebuild the dashboard image:

```bash
docker compose up --build dashboard
```

Endpoints:

- dashboard: `http://127.0.0.1:3000`
- gateway health: `http://127.0.0.1:8080/health`
- MCP endpoint: `http://127.0.0.1:8080/mcp`

Seeded credentials:

- admin token: `managent-admin-demo`
- MCP bearer key: `mng_live_demo`

## Notes

Manual connector creation in the dashboard supports `stdio`, `http`, and `sse`. The marketplace exists for preconfigured MCP servers, regardless of transport, so users can install them instead of assembling the runtime details by hand.
