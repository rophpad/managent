# Project Structure and Run Guide

This document explains how the repository is organized, what each important file does, and how to run Managent with or without Docker.

## What This Project Is

Managent is an MCP gateway and control plane.

It does two jobs:

1. **Northbound MCP server**: exposes one MCP endpoint that AI agents connect to.
2. **Southbound MCP client/gateway**: connects to downstream MCP servers over `stdio`, `http`, or `sse`, federates their tools, and runs every call through middleware.

The main runtime responsibilities are:

- API key authentication
- audit logging
- policy checks
- schema validation
- credential injection
- tool routing to downstream connectors
- dashboard and admin API support

## Top-Level Layout

```text
managent/
├── cmd/                    Go entrypoints
├── config/                 Example runtime configs
├── database/               SQL schema
├── docker/                 Dockerfiles
├── docs/                   Project documentation
├── internal/               Application packages
├── web/                    Next.js dashboard
├── docker-compose.yml      Local multi-service stack
├── go.mod / go.sum         Go module metadata
└── README.md               Main quick-start guide
```

## File and Folder Roles

### Top level

- `README.md`
  Main quick-start README for the project.
- `go.mod`, `go.sum`
  Go module definition and dependency lock data for the gateway/backend.
- `docker-compose.yml`
  Starts Postgres, the gateway, and the dashboard together for local development.

### `cmd/`

This folder contains executable entrypoints.

- `cmd/gateway/main.go`
  Starts the HTTP gateway process. This is the main backend server for `/mcp`, `/mcp/sse`, `/health`, and `/api/v1/*`.
- `cmd/server/main.go`
  Starts Managent itself over **stdio** instead of HTTP. Use this when you want Managent to behave like a local MCP server process.
- `cmd/hello-mcp/main.go`
  Demo downstream MCP server used for testing connector federation.

### `config/`

- `config/managent.example.json`
  Example config for running the project directly on the host machine.
- `config/managent.docker.json`
  Config used by the Dockerized gateway container.

These files define:

- gateway address and endpoint
- database URL and schema path
- admin token
- connector secret key
- seeded API keys
- seeded connectors
- seeded policies
- seeded credential injection rules

### `database/`

- `database/schema.sql`
  Creates the Postgres tables used by the project:
  - `workspaces`
  - `api_keys`
  - `connectors`
  - `connector_secrets`
  - `tools`
  - `policies`
  - `audit_logs`

### `docker/`

- `docker/gateway.Dockerfile`
  Builds the Go gateway image and includes helper binaries used by stdio connectors.
- `docker/dashboard.Dockerfile`
  Builds the Next.js dashboard image.

### `internal/`

This is the backend implementation.

#### Application bootstrap

- `internal/app/app.go`
  Main runtime assembly. It wires together config, database, connector manager, registry, middleware pipeline, MCP handler, admin API routes, and HTTP transport.

#### Config and secrets

- `internal/config/config.go`
  Loads JSON config and environment-variable overrides.
- `internal/secrets/crypto.go`
  Encrypts and decrypts connector secrets stored in the database.
- `internal/secrets/crypto_test.go`
  Tests for connector secret encryption logic.

#### Persistence

- `internal/database/store.go`
  Database access layer for API keys, connectors, connector secrets, tool snapshots, policies, and audit logs.

#### Gateway HTTP server

- `internal/gateway/server.go`
  Thin HTTP server wrapper around `http.Server`. Also serves `/health`.

#### Connector runtime

- `internal/connector/connector.go`
  Connector manager and connector runtime. Starts downstream MCP clients, tracks connector state, persists tool snapshots, and reconnects connectors.

#### MCP protocol and transports

- `internal/mcp/protocol/types.go`
  MCP request/response and tool data structures used internally.
- `internal/mcp/server/handler.go`
  Northbound MCP server handler logic.
- `internal/mcp/server/stdio.go`
  Stdio transport for serving Managent itself as an MCP server.
- `internal/mcp/client/client.go`
  Shared client interface for downstream connectors.
- `internal/mcp/client/stdio.go`
  Downstream stdio MCP client.
- `internal/mcp/client/http.go`
  Downstream HTTP and SSE-capable client logic.
- `internal/mcp/client/http_test.go`
  Tests for the HTTP client.

#### Tool discovery and routing

- `internal/registry/registry.go`
  In-memory registry of federated tools exposed by connected downstream servers.
- `internal/router/router.go`
  Routes namespaced tool calls like `github.search_repositories` to the correct connector and strips the namespace before forwarding.

#### Middleware pipeline

- `internal/middleware/middleware.go`
  Shared middleware abstractions and chaining.
- `internal/middleware/auth/auth.go`
  API-key and bearer-token auth middleware.
- `internal/middleware/logger/logger.go`
  Request/decision logging middleware.
- `internal/middleware/policy/policy.go`
  Policy enforcement middleware.
- `internal/middleware/validator/validator.go`
  Tool input validation against registered schemas.
- `internal/middleware/credential/credential.go`
  Credential injection middleware.
- `internal/middleware/approval/approval.go`
  Approval-related middleware placeholder package currently present in the repo.

#### Policy, auth, audit, marketplace

- `internal/policy/engine.go`
  Loads and evaluates policy rules.
- `internal/authz/authz.go`
  API-key generation and hashing helpers.
- `internal/audit/audit.go`
  Audit logging service.
- `internal/audit/store.go`
  Audit log persistence adapter.
- `internal/marketplace/catalog.go`
  Marketplace catalog entries and logic for building preconfigured connector configs from listing templates.

### `web/`

This is the Next.js dashboard.

#### App shell and routes

- `web/app/layout.tsx`
  Global app layout.
- `web/app/globals.css`
  Global styles.
- `web/app/page.tsx`
  Root route.
- `web/app/dashboard/layout.tsx`
  Dashboard layout and shared dashboard shell.
- `web/app/dashboard/page.tsx`
  Dashboard overview page.
- `web/app/dashboard/connectors/page.tsx`
  Connectors page.
- `web/app/dashboard/policies/page.tsx`
  Policies page.
- `web/app/dashboard/logs/page.tsx`
  Logs page.
- `web/app/dashboard/settings/page.tsx`
  Settings/API keys page.

#### Dashboard data and actions

- `web/app/dashboard/lib.ts`
  Server-side fetch helpers for the dashboard.
- `web/app/dashboard/actions.ts`
  Server actions used by forms for API keys, connectors, marketplace installs, reconnects, and policies.

#### Reusable dashboard UI

- `web/components/dashboard/primitives.tsx`
  Shared UI primitives and styling helpers.
- `web/components/dashboard/sidebar.tsx`
  Dashboard navigation.
- `web/components/dashboard/types.ts`
  Shared dashboard TypeScript types.
- `web/components/dashboard/connectors-section.tsx`
  Connectors page UI.
- `web/components/dashboard/policies-section.tsx`
  Policies page UI.
- `web/components/dashboard/keys-audit-section.tsx`
  Settings and audit-related UI.

#### Frontend project files

- `web/package.json`
  Dashboard dependencies and scripts.
- `web/next.config.ts`
  Next.js configuration.
- `web/postcss.config.mjs`
  PostCSS config.
- `web/eslint.config.mjs`
  ESLint config.
- `web/tsconfig.json`
  TypeScript config.
- `web/public/*`
  Static assets.

#### Frontend auxiliary files

- `web/README.md`
  Default Next.js README scaffold; not the main source of truth for the project.
- `web/docs/prd.txt`
  Product notes/reference material for the dashboard.
- `web/AGENTS.md`, `web/CLAUDE.md`
  Agent-assistance notes.
- `web/.next/`
  Generated build output.
- `web/node_modules/`
  Installed frontend dependencies.

## Runtime Flow

At startup the gateway does this:

1. Load config.
2. Open Postgres.
3. Run schema migration if enabled.
4. Ensure a workspace exists.
5. Seed API keys, connectors, policies, and credential rules from config if enabled.
6. Load persisted connectors from the database.
7. Start enabled connectors.
8. Discover downstream tools and place them in the in-memory registry.
9. Start the HTTP server and admin API.

At tool-call time the flow is:

1. Agent calls Managent at `/mcp`.
2. Auth middleware validates credentials.
3. Logger middleware records request metadata.
4. Policy middleware evaluates allow/deny rules.
5. Validator middleware checks tool args against schema.
6. Credential middleware injects configured secrets.
7. Router forwards the tool call to the correct downstream connector.
8. Response is returned and audited.

## How To Run Without Docker

### Prerequisites

You need:

- Go installed
- Node.js and npm installed
- PostgreSQL installed and running

Practical version guidance:

- the Go module currently declares `go 1.23.4`
- the dashboard uses Next.js 16 and should be run with a modern Node 20+ environment
- if you want to run the official `github-mcp-server` locally for a stdio connector, install that binary separately on your machine and point the connector at it

### 1. Start PostgreSQL

Create a local database named `managent` and make sure you can connect to it.

Example connection string used by the sample config:

```bash
postgres://postgres:postgres@127.0.0.1:5432/managent?sslmode=disable
```

### 2. Start the gateway

From the repo root:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/gateway
```

This will:

- listen on `http://127.0.0.1:8080`
- expose MCP at `http://127.0.0.1:8080/mcp`
- expose health at `http://127.0.0.1:8080/health`
- expose admin APIs under `http://127.0.0.1:8080/api/v1/*`

### 3. Start the dashboard

In another terminal:

```bash
cd web
npm install
MANAGENT_API_BASE_URL=http://127.0.0.1:8080 MANAGENT_ADMIN_TOKEN=managent-admin-demo npm run dev
```

Then open:

```text
http://127.0.0.1:3000
```

### 4. Optional: run Managent itself over stdio

If you want Managent to behave as a stdio MCP server instead of HTTP:

```bash
MANAGENT_CONFIG=./config/managent.example.json go run ./cmd/server
```

### 5. Optional: run the demo downstream MCP server directly

```bash
go run ./cmd/hello-mcp
```

### 6. Useful local checks

```bash
curl http://127.0.0.1:8080/health
curl -H 'Authorization: Bearer managent-admin-demo' http://127.0.0.1:8080/api/v1/overview
curl -H 'Authorization: Bearer mng_live_demo' http://127.0.0.1:8080/mcp
```

## How To Run With Docker

### Prerequisites

You need:

- Docker
- Docker Compose

### Start the full stack

From the repo root:

```bash
docker compose up --build
```

This starts:

- `managent-postgres`
- `managent-gateway`
- `managent-dashboard`

### Endpoints

- dashboard: `http://127.0.0.1:3000`
- gateway health: `http://127.0.0.1:8080/health`
- MCP endpoint: `http://127.0.0.1:8080/mcp`
- admin APIs: `http://127.0.0.1:8080/api/v1/*`

### Default seeded credentials

- admin token: `managent-admin-demo`
- MCP bearer key: `mng_live_demo`

### Useful Docker commands

Start in background:

```bash
docker compose up --build -d
```

Rebuild only the gateway:

```bash
docker compose up --build -d gateway
```

Rebuild only the dashboard:

```bash
docker compose up --build -d dashboard
```

Stop everything:

```bash
docker compose down
```

Tail logs:

```bash
docker compose logs -f gateway
docker compose logs -f dashboard
docker compose logs -f postgres
```

## Running Connectors: Important Operational Detail

For manual `stdio` connectors, the command runs in the same environment as the gateway process.

That means:

- if the gateway runs on your host, stdio connector commands run on your host
- if the gateway runs in Docker, stdio connector commands run inside the gateway container

This matters for commands such as:

```text
/app/bin/github-mcp-server
npx ...
go run ...
```

Those executables must exist where the gateway is running.

## Current Recommended GitHub Connector Shapes

### Host machine

If you run Managent on your host, use the official GitHub MCP server binary installed on your machine and configure the connector as stdio.

### Dockerized gateway

If you run Managent in Docker, use a binary that exists in the gateway image. In the current project setup, the gateway image includes `/app/bin/github-mcp-server`.

A typical stdio connector shape is:

```json
{
  "name": "github",
  "namespace": "github",
  "transport": "stdio",
  "command": "/app/bin/github-mcp-server",
  "args": ["stdio"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "..."
  },
  "enabled": true
}
```

## Which Files You Usually Edit

For most changes:

- backend startup and routes: `internal/app/app.go`
- connector runtime: `internal/connector/connector.go`
- MCP clients: `internal/mcp/client/*`
- database logic: `internal/database/store.go`
- marketplace templates: `internal/marketplace/catalog.go`
- config behavior: `internal/config/config.go`
- dashboard data fetching: `web/app/dashboard/lib.ts`
- dashboard mutations: `web/app/dashboard/actions.ts`
- dashboard page UI: `web/components/dashboard/*`
- Docker runtime behavior: `docker/*.Dockerfile`, `docker-compose.yml`

## Suggested Reading Order For New Contributors

1. `README.md`
2. `internal/app/app.go`
3. `internal/connector/connector.go`
4. `internal/mcp/client/*`
5. `internal/router/router.go`
6. `internal/database/store.go`
7. `web/app/dashboard/lib.ts`
8. `web/components/dashboard/*`

That order gives you the runtime flow before you dive into storage or UI details.
