# Managent

Managent is a Go-based MCP gateway and control plane.

It exposes one northbound MCP endpoint for agents, connects to downstream MCP servers and adapters, federates their tools under namespaces, and runs every tool call through auth, audit logging, policy evaluation, approval handling, schema validation, and credential injection before routing it onward.

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for the repo map and [docs/prd.txt](docs/prd.txt) for the current product spec.

## What Exists Today

- northbound MCP server over HTTP at `/mcp`
- SSE-compatible endpoint at `/mcp/sse`
- southbound MCP connectivity over `stdio`, `http`, and `sse`
- REST adapter mode for non-MCP HTTP targets
- namespaced tool federation such as `stripe.create_refund`
- policy engine with `allow`, `deny`, and `require_approval`
- approval middleware with pending approval storage and signed webhook resolution
- Postgres-backed storage for users, sessions, agents, MCP records, policy rules, audit logs, approval integrations, and pending approvals
- Next.js dashboard for agents, MCPs, policies, logs, settings, login, and signup
- optional admin bearer token for control-plane API access
- user signup/login for dashboard access when no admin token is used
- marketplace catalog entries for common MCP providers

## What Does Not Exist Yet

- Redis-backed runtime state
- short-lived gateway tokens
- ClickHouse-style audit storage
- a full in-dashboard approval inbox/resolution UI
- a generic production installer for local stdio MCP binaries inside the Docker image

## Architecture at a Glance

### Northbound

Agents call:

- `POST /mcp`
- `GET|POST /mcp/sse`

The gateway authenticates the bearer token against stored agent keys, evaluates policy, optionally pauses for approval, validates arguments, injects secrets, and then forwards the call to the correct downstream MCP or REST adapter.

### Control Plane

The dashboard and admin surfaces use:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/overview`
- `GET|POST /api/v1/agents`
- `POST /api/v1/agents/:id/detail`
- `POST /api/v1/agents/:id/keys`
- `POST /api/v1/agents/:id/keys/:keyId/revoke`
- `POST /api/v1/agents/:id/keys/:keyId/rotate`
- `POST /api/v1/agents/:id/suspend`
- `POST /api/v1/agents/:id/activate`
- `GET|POST /api/v1/mcps`
- `POST /api/v1/mcps/:id/update`
- `POST /api/v1/mcps/:id/connect`
- `POST /api/v1/mcps/:id/disconnect`
- `POST /api/v1/mcps/:id/reconnect`
- `POST /api/v1/mcps/preview/test`
- `GET|POST /api/v1/marketplace`
- `GET|POST /api/v1/policies`
- `POST /api/v1/policies/reorder`
- `POST /api/v1/policies/test`
- `GET|POST /api/v1/approval-integrations`
- `GET /api/v1/audit-logs`
- `POST /api/v1/approvals/webhook/:provider`

Control-plane routes accept either:

- the configured admin bearer token, or
- a logged-in dashboard user session

## Dashboard Model

The current UI is organized around four main concepts:

1. Agents
   Long-lived identities that own bearer keys used by MCP clients.
2. MCPs
   Installed downstream MCP connections or adapters, each linked to one agent.
3. Policies
   Ordered rules attached to MCP tools. The UI chooses an MCP first, then a tool.
4. Approval integrations
   Slack/Discord-style integration records used by the approval flow.

## Running with Docker

Docker Compose is the easiest way to run the current product.

### 1. Create an environment file

```bash
cp .env.example .env
```

Set at least:

- `MANAGENT_MCP_SECRET_KEY` to a real 32-byte secret

Optional:

- `MANAGENT_ADMIN_TOKEN` if you want admin-token access in addition to login/signup

### 2. Start the stack

```bash
docker compose up -d --build
```

### 3. Open the product

- dashboard: `http://127.0.0.1:3000`
- gateway HTTP: `http://127.0.0.1:8081`
- MCP endpoint: `http://127.0.0.1:8081/mcp`
- SSE endpoint: `http://127.0.0.1:8081/mcp/sse`

### 4. First use

- open the dashboard
- sign up for a user account, or log in if you already have one
- create an agent
- add or install an MCP
- attach policies to the tools exposed by that MCP

### Docker Notes

- the Docker gateway image no longer bundles demo MCP binaries
- remote HTTP/SSE MCPs work out of the box
- local `stdio` MCPs inside Docker require binaries that exist in the gateway container or a custom image you provide

## Running on the Host

For direct host-based development:

1. make sure local Postgres is running
2. run the helper script:

```bash
chmod +x ./scripts/dev-host.sh
./scripts/dev-host.sh dev
```

That command:

- checks local prerequisites
- creates the `managent` database if you are using local Postgres
- skips database bootstrap automatically when `MANAGENT_DATABASE_URL` points to a hosted Postgres provider such as Neon
- installs dashboard dependencies when needed
- starts the Go gateway on `http://127.0.0.1:8080`
- starts the Next.js dashboard on `http://127.0.0.1:3000`

Useful script modes:

```bash
./scripts/dev-host.sh check
./scripts/dev-host.sh bootstrap-db
./scripts/dev-host.sh gateway
./scripts/dev-host.sh web
```

If you want to run the pieces manually, the direct commands are still:

Example:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/gateway
```

The example config is still useful for local development because it seeds demo data. It is not the recommended production or Docker configuration.

For the web app:

```bash
cd web
MANAGENT_API_BASE_URL=http://127.0.0.1:8081 npm run dev
```

Set `MANAGENT_ADMIN_TOKEN` too if your gateway is running with an admin token and you want the dashboard to use it.

## Security Model Today

- MCP clients authenticate with agent bearer keys
- dashboard users authenticate with email/password and server-side sessions
- control-plane APIs accept either the admin token or a valid dashboard session
- mcp secrets are encrypted at rest when `MANAGENT_MCP_SECRET_KEY` is set
- policy evaluation defaults to deny when no rule matches

## Marketplace Notes

The marketplace ships catalog entries for a few MCP providers, including GitHub, Linear, and Stripe.

Important detail:

- the GitHub local stdio marketplace option points at `/app/bin/github-mcp-server`
- that binary is not bundled in the current Docker gateway image
- in Docker, prefer the remote GitHub option or build a custom image that includes the binary

## Development Checks

Common checks used in this repo:

```bash
cd web && npx tsc --noEmit
cd web && npm run lint
env GOCACHE=/tmp/managent-gocache go test ./...
```
