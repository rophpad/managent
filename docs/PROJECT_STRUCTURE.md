# Project Structure and Run Guide

This document describes the repository as it exists today.

## Product Shape

Managent currently has two major surfaces:

1. A Go gateway that exposes a single MCP endpoint and federates downstream MCP tools.
2. A Next.js dashboard used to manage agents, MCP records, policies, approvals, and logs.

The gateway also exposes a control-plane API under `/api/v1/*`.

## Top-Level Layout

```text
managent/
├── cmd/                    Go entrypoints
├── config/                 Runtime config files
├── database/               Postgres schema
├── docker/                 Dockerfiles
├── docs/                   Product and repo documentation
├── internal/               Backend implementation
├── web/                    Next.js dashboard
├── .env.example            Docker deployment env example
├── docker-compose.yml      Local multi-service stack
└── README.md               Setup and usage guide
```

## Important Top-Level Files

- `README.md`
  Current quick-start and deployment guide.
- `.env.example`
  Example environment values for Docker Compose.
- `docker-compose.yml`
  Starts Postgres, the gateway, and the dashboard together.

## `cmd/`

- `cmd/gateway/main.go`
  Starts the HTTP gateway process.
- `cmd/server/main.go`
  Runs Managent itself over stdio as an MCP server process.
- `cmd/hello-mcp/main.go`
  Demo downstream MCP server used for local host-based development and testing.

## `config/`

- `config/managent.docker.json`
  Generic Docker runtime config. It no longer seeds demo mcps or credentials.
- `config/managent.example.json`
  Host-oriented example config that still includes demo seed data for development.

Config covers:

- gateway host/port/endpoint
- log format and level
- database schema path and workspace name
- optional admin token
- optional mcp secret key
- optional seed data

Environment overrides are loaded from:

- `MANAGENT_CONFIG`
- `MANAGENT_PORT`
- `MANAGENT_HOST`
- `MANAGENT_LOG_LEVEL`
- `MANAGENT_LOG_FORMAT`
- `MANAGENT_DATABASE_URL`
- `MANAGENT_DATABASE_SCHEMA_PATH`
- `MANAGENT_WORKSPACE_NAME`
- `MANAGENT_ADMIN_TOKEN`
- `MANAGENT_MCP_SECRET_KEY`

## `database/`

- `database/schema.sql`
  Defines the Postgres schema.

The current schema includes tables for:

- `users`
- `user_sessions`
- `workspaces`
- `agents`
- `agent_keys`
- `mcps`
- `mcp_secrets`
- `tools`
- `policies`
- `audit_logs`
- `approval_integrations`
- `approval_integration_secrets`
- `pending_approvals`

## `docker/`

- `docker/gateway.Dockerfile`
  Builds the Go gateway image.
- `docker/dashboard.Dockerfile`
  Builds the dashboard image used by Docker Compose.

Current Docker behavior:

- the gateway image contains the compiled Go binary and config/schema assets
- it bundles the demo hello MCP at `/app/bin/hello-mcp`
- it does not bundle third-party MCP binaries such as the GitHub MCP server
- the dashboard image runs `next dev` inside the container for local development

## `internal/`

This is the backend implementation.

### Bootstrap and runtime

- `internal/app/app.go`
  Main runtime assembly. It loads config, opens Postgres, migrates schema, optionally seeds config data, starts mcps, builds the middleware chain, serves MCP, and registers control-plane routes.

### Config and secrets

- `internal/config/config.go`
  Loads JSON config plus environment overrides.
- `internal/secrets/crypto.go`
  Encrypts and decrypts stored mcp and approval secrets.

### Persistence

- `internal/database/store.go`
  Main storage layer for agents, MCP records, policy rules, logs, and mcp state.
- `internal/database/auth.go`
  User signup/login and session storage.
- `internal/database/agents.go`
  Agent and agent-key operations.
- `internal/database/approval.go`
  Approval integration and pending-approval persistence.
- `internal/database/policy_ops.go`
  Policy ordering operations.

### Gateway transport

- `internal/gateway/server.go`
  HTTP server wrapper, including health handling.

### Downstream mcp runtime

- `internal/mcp/mcp.go`
  Starts downstream MCP clients, tracks status, reconnects them, and synchronizes tool snapshots.

Supported downstream transport modes today:

- `stdio`
- `http`
- `sse`
- REST adapter mode via mcp config

### MCP server and clients

- `internal/mcp/server/*`
  Northbound MCP handling over HTTP and stdio.
- `internal/mcp/client/*`
  Downstream MCP clients for stdio and HTTP/SSE.

### Routing and registry

- `internal/registry/registry.go`
  In-memory registry of all exposed namespaced tools.
- `internal/router/router.go`
  Routes namespaced tools to the correct mcp and strips the namespace before forwarding.

### Middleware

- `internal/middleware/auth/auth.go`
  Validates MCP bearer keys for northbound tool calls.
- `internal/middleware/logger/logger.go`
  Captures audit trail decisions and timing context.
- `internal/middleware/policy/policy.go`
  Evaluates allow/deny/require-approval rules.
- `internal/middleware/approval/approval.go`
  Holds approval-required requests until approved, denied, or timed out.
- `internal/middleware/validator/validator.go`
  Validates arguments against tool schemas.
- `internal/middleware/credential/credential.go`
  Injects server-side credentials into approved requests.

### Policy, auth, marketplace, audit

- `internal/policy/engine.go`
  Ordered rule engine with conditions and basic rate limiting.
- `internal/authz/authz.go`
  Key generation, hashing, and session token helpers.
- `internal/audit/*`
  Audit logging support.
- `internal/marketplace/catalog.go`
  Marketplace catalog used by the dashboard and install API.

## `web/`

This is the dashboard app.

### App routes

- `web/app/page.tsx`
  Landing page.
- `web/app/login/page.tsx`
  Login page.
- `web/app/signup/page.tsx`
  Signup page.
- `web/app/auth-actions.ts`
  Server actions for login/logout/signup.
- `web/app/server-api.ts`
  Server-side API fetch helper with fallback behavior.

### Dashboard routes

- `web/app/dashboard/layout.tsx`
  Dashboard shell and access guard.
- `web/app/dashboard/page.tsx`
  Overview page.
- `web/app/dashboard/agents/page.tsx`
  Agent management page.
- `web/app/dashboard/mcps/page.tsx`
  MCP registry and marketplace page.
- `web/app/dashboard/policies/page.tsx`
  Policy page.
- `web/app/dashboard/logs/page.tsx`
  Audit logs page.
- `web/app/dashboard/settings/page.tsx`
  Approval integrations and workspace summary.
- `web/app/dashboard/reports/page.tsx`
  Redirects to logs.

### Dashboard support files

- `web/app/dashboard/lib.ts`
  Server-side request helpers and overview formatting utilities.
- `web/app/dashboard/actions.ts`
  Server actions for agents, MCPs, policies, and approval integrations.
- `web/components/dashboard/*`
  UI sections, tables, modals, sidebar, and shared primitives.

### Frontend project files

- `web/package.json`
  Dashboard dependencies and scripts.
- `web/eslint.config.mjs`
  ESLint configuration.
- `web/tsconfig.json`
  TypeScript configuration.

## Runtime Behavior

### Gateway startup

At startup, the gateway:

1. loads config
2. opens Postgres
3. runs schema migration when enabled
4. ensures the workspace exists
5. optionally seeds config-defined data
6. loads mcps from Postgres
7. starts enabled mcps
8. syncs downstream tools into the registry
9. loads policies into the in-memory policy engine
10. serves MCP and control-plane routes

### MCP call flow

For a northbound MCP tool call:

1. the bearer token is read from `Authorization`
2. the agent key is validated
3. the audit/logger middleware records request context
4. the policy engine decides allow, deny, or require approval
5. if approval is required, the request is persisted and held
6. schema validation runs
7. credential injection runs
8. the router forwards the request to the selected downstream MCP
9. the audit trail is persisted

## Running the Project

### Docker

1. copy `.env.example` to `.env`
2. set `MANAGENT_MCP_SECRET_KEY`
3. run:

```bash
docker compose up -d --build
```

Services:

- dashboard: `http://127.0.0.1:3000`
- gateway: `http://127.0.0.1:8081`

### Host

For direct host development:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/gateway
```

Then run the dashboard separately:

```bash
cd web
MANAGENT_API_BASE_URL=http://127.0.0.1:8081 npm run dev
```

## Current Product Caveats

- approval resolution exists at the API/webhook layer, but there is no dedicated dashboard inbox for pending approvals yet
- audit data is stored in Postgres, not a dedicated analytics ledger
- Redis is not part of the runtime
- Docker users should prefer remote MCP transports unless they intentionally provide stdio binaries in the gateway image
