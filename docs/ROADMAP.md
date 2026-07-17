# Managent Roadmap

This roadmap reflects the current codebase, not the earlier aspirational PRD.

## Already Shipped

- northbound MCP HTTP endpoint with SSE-compatible route
- downstream MCP connectivity over stdio, HTTP, and SSE
- REST adapter support
- agent-scoped bearer keys
- dashboard signup/login and user sessions
- MCP registry and marketplace UI
- policy rules with allow, deny, and require-approval
- approval persistence plus signed webhook resolution
- encrypted mcp secret storage
- audit logs with CSV export
- Docker Compose deployment

## Highest-Value Next Steps

### 1. Pending Approval UI

What is missing:

- list pending approvals in the dashboard
- show approval status history
- allow approve/deny actions from the product UI

Why it matters:

The approval engine exists, but product usability still depends on out-of-band webhook flows.

### 2. Marketplace Install Completion

What is missing:

- dashboard flow that posts directly to `POST /api/v1/marketplace`
- full input rendering for marketplace-secret fields in the UI
- clearer transport-specific install guidance

Why it matters:

The API and catalog exist, but the dashboard currently uses marketplace entries mainly as prefilled MCP templates.

### 3. Richer Schema Validation

What is missing:

- deeper JSON Schema support
- better nested object and array validation
- richer constraint coverage such as enums, bounds, and patterns

Why it matters:

Validation currently covers practical cases, but it is not a full schema firewall yet.

### 4. Token Lifecycle Hardening

What is missing:

- expirations for MCP client keys
- revocation and issuance lifecycle improvements
- optional short-lived token issuance model

Why it matters:

The current auth model works, but it is still closer to managed long-lived keys than an ephemeral gateway token system.

### 5. Production Runtime State

What is missing:

- Redis-backed shared runtime state
- horizontally friendly pending-approval handling
- shared fast lookup infrastructure for policy-sensitive execution state

Why it matters:

Current approval state is durable enough for one-node operation, but not yet optimized for multi-instance scale.

### 6. Audit Storage Separation

What is missing:

- dedicated event-store backend for high-volume audit data
- separation between control-plane OLTP storage and audit/event analytics

Why it matters:

Audit logs are currently in Postgres, which is fine for the current product but not the long-term architecture.

### 7. Docker and Deployment Ergonomics

What is missing:

- clearer env and compose overrides for Postgres credentials
- optional custom gateway image story for stdio MCP binaries
- more explicit deployment recipes beyond local Docker Compose

Why it matters:

The product is usable today, but first-time self-hosting can still be smoother.

## Suggested Order

1. Pending approval UI
2. Marketplace install completion
3. Richer schema validation
4. Token lifecycle hardening
5. Production runtime state
6. Audit storage separation
7. Deployment ergonomics
