# Managent Roadmap

This roadmap captures the work still required for the current implementation to satisfy the MVP Product Requirement Document in `docs/prd.txt`.

## Current status

The current codebase already implements:

- northbound MCP gateway endpoints over HTTP with SSE-compatible behavior
- southbound connector support for `stdio`, `http`, and `sse`
- tool federation with connector namespaces
- policy evaluation for `allow`, `deny`, and `require_approval`
- basic schema validation for tool arguments
- encrypted connector secret storage
- audit logging
- admin dashboard for connectors, policies, logs, and API keys
- Docker-based local deployment

The largest gap is that the product is not yet PRD-complete. In particular, the Human-in-the-Loop path, Redis-backed runtime state, short-lived proxy tokens, and ClickHouse-style audit architecture are still missing or only partially represented.

## PRD gaps

### 1. Human-in-the-Loop execution is not live

Status:

- `require_approval` exists in the policy engine.
- approval middleware exists in the codebase.
- the runtime pipeline does not currently wire approval middleware into live tool execution.
- Slack or webhook dispatch for approvals is not implemented.
- there is no approval callback API for approve/deny actions.

Impact:

This blocks PRD Module 3 entirely.

### 2. Redis-backed policy and approval state is missing

Status:

- policy rules are loaded from Postgres into process memory.
- pending approvals are held in an in-memory store placeholder.
- there is no Redis integration for policy lookups, approval state, or frozen execution tracking.

Impact:

This blocks PRD Requirement 2.2 and weakens the intended runtime architecture for Module 3.

### 3. Token model is not short-lived

Status:

- gateway tokens are generated as static bearer keys.
- API key records have no expiry, rotation, or issuance lifecycle.
- the current model is closer to stored long-lived API keys than ephemeral proxy tokens.

Impact:

This does not satisfy PRD Requirement 4.1.

### 4. Credential injection is only partially aligned with the PRD

Status:

- encrypted connector headers and env secrets are supported.
- static downstream headers are applied when downstream clients are initialized.
- argument-level injection middleware exists.
- true per-request proxy-token stripping and just-in-time downstream header stitching is not fully modeled.

Impact:

This only partially satisfies PRD Requirement 4.2.

### 5. Audit storage does not match the target architecture

Status:

- audit logs are currently persisted in Postgres.
- there is no immutable high-throughput ledger backend such as ClickHouse.

Impact:

This only partially satisfies PRD Requirement 5.1.

### 6. Validation depth is limited

Status:

- current validation checks required fields, primitive types, and a minimal format subset.
- nested schema semantics, enum constraints, numeric bounds, pattern checks, and richer JSON Schema support are not implemented.

Impact:

This only partially satisfies PRD Requirement 2.1.

### 7. Northbound MCP support is minimal rather than fully hardened

Status:

- the gateway handles `initialize`, `tools/list`, `tools/call`, and ping.
- SSE-compatible behavior exists.
- protocol compliance hardening, compatibility testing, and edge-case handling are still limited.

Impact:

This is good enough for basic integrations but not strong evidence of full PRD-grade MCP compliance.

## Implementation roadmap

## Phase 1: Complete the live approval pipeline

Goal:

Turn `require_approval` from a returned error into a real paused execution state.

Work:

- wire approval middleware into the runtime middleware chain
- have policy middleware mark approval-required requests instead of terminating them immediately
- hold the request open until approval resolution or timeout
- add admin APIs for listing pending approvals and resolving them
- expose pending approvals and resolve actions in the dashboard

Success condition:

A tool call marked `require_approval` remains suspended until a human explicitly approves or denies it.

## Phase 2: Add Redis-backed runtime state

Goal:

Replace process-local pending execution state with shared runtime state.

Work:

- add Redis client configuration
- store pending approval executions in Redis
- move approval timeouts and state transitions to Redis-backed records
- use Redis for fast policy and active session lookup where appropriate

Success condition:

Approval and policy-sensitive state survives process boundaries and supports horizontal scaling.

## Phase 3: Implement real webhook approvals

Goal:

Fulfill the PRD Slack-based HITL model.

Work:

- add outbound Slack webhook or Slack app integration
- send interactive approval messages for paused executions
- add signed inbound callback handling for approve and deny actions
- connect callback resolution to the approval store and paused request lifecycle

Success condition:

A Slack approve click resumes execution; a deny click returns a structured JSON-RPC error to the client.

## Phase 4: Upgrade the gateway token model

Goal:

Move from stored bearer keys to short-lived proxy credentials.

Work:

- introduce issued token records with expiry and revocation
- add token minting and refresh behavior
- distinguish long-lived admin credentials from short-lived MCP client tokens
- update auth middleware to validate expiry and revocation

Success condition:

Client-facing gateway tokens are time-bounded and revocable.

## Phase 5: Finish the credential isolation model

Goal:

Match the PRD intent for server-side secret use at request time.

Work:

- formalize per-request downstream header injection
- separate client token auth from downstream target authentication more explicitly
- ensure connector secrets are stitched into outbound requests only after validation and policy pass
- document the distinction between connector transport secrets and tool-call credential injection

Success condition:

Client-facing code never carries downstream production secrets, and downstream auth is applied only inside Managent after authorization and validation.

## Phase 6: Strengthen validation and policy expressiveness

Goal:

Harden deterministic enforcement.

Work:

- expand JSON Schema support beyond current shallow checks
- add enum, bounds, regex, nested object, and array validation
- support richer conditional rule manifests
- add negative tests for malformed and manipulative payloads

Success condition:

The gateway reliably blocks structurally invalid calls and supports more realistic policy conditions.

## Phase 7: Upgrade observability architecture

Goal:

Support the PRD audit target and production-scale visibility.

Work:

- add an append-only audit writer abstraction
- introduce ClickHouse or another high-throughput event backend
- preserve dashboard reads while separating OLTP control-plane data from audit-event storage
- add request latency and middleware timing instrumentation

Success condition:

Audit traffic and operational analytics are no longer bound to the primary Postgres control-plane database.

## Phase 8: Protocol hardening and conformance testing

Goal:

Raise confidence in MCP and JSON-RPC compliance.

Work:

- add integration tests for HTTP and SSE northbound flows
- validate notification handling, malformed request behavior, and edge-case error responses
- test compatibility against real MCP-capable clients
- document supported protocol surface and known limitations

Success condition:

Northbound MCP support is validated by repeatable compatibility tests rather than inferred from a happy path.

## Recommended order

1. Phase 1: live approval pipeline
2. Phase 2: Redis-backed runtime state
3. Phase 3: webhook approvals
4. Phase 4: short-lived token model
5. Phase 5: credential isolation hardening
6. Phase 6: validation and policy expansion
7. Phase 7: observability architecture
8. Phase 8: conformance and performance validation

## Definition of PRD-complete MVP

The implementation should be considered PRD-complete only when all of the following are true:

- `require_approval` pauses live requests instead of failing them immediately
- human approval can happen asynchronously through Slack or an equivalent webhook path
- paused executions are stored in Redis-backed runtime state
- gateway-issued client tokens are short-lived and revocable
- downstream credentials remain fully server-side and are injected only after validation and policy pass
- audit storage is separated into a fit-for-purpose event ledger architecture
- validation and policy behavior are strong enough to support deterministic enforcement claims
- remote MCP behavior is backed by protocol-level tests
