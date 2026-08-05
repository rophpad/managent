# Is Managent buildable? Limits, and how to build it efficiently

An assessment of the product implied by the current prototype — a control plane
that governs which resources an AI agent may call, with what arguments, and logs
every attempt. Companion to [data-model.md](./data-model.md).

## Verdict

**Yes, and none of it is research.** Every component — a policy decision point,
a proxy, credential injection, an audit pipeline — is a solved problem with
mature off-the-shelf parts. A competent team reaches a useful monitor-only
product in weeks and a real enforcement boundary in a few months.

The risk is not "can this be built". It is that **the interesting part is a
thin slice of the work**, and it's easy to spend a year rebuilding gateway
plumbing that already exists.

## The fork that decides everything

The SDK design in the docs wraps calls at the call site:

```python
governed = mg.wrap_mcp(session, connector="stripe-mcp")
```

This makes governance **advisory**. An agent that calls `httpx.post()` directly
bypasses Managent entirely. The product already admits this — that's what the
per-agent *coverage* percentage measures, and it's an honest metric.

So decide explicitly which product this is:

**(a) A compliance and observability tool.** Coverage is a KPI, gaps are
expected, the buyer wants evidence and an audit trail. Wrapping is fine. Ship
fast, low operational burden.

**(b) A security boundary.** Then wrapping is not enough, and one feature
carries the entire claim: **the agent must never hold the credential.** If
Managent brokers the secret and injects it at egress, bypassing Managent means
having no credential — the agent *must* come through you. Everything else in the
product is downstream of that.

The current model points at (b) — "the real credential injected at the last
moment" — while the enforcement mechanism is (a). That gap should be closed
deliberately, in one direction or the other. My recommendation is (a) first as
the wedge, architected so (b) is a configuration change rather than a rewrite.

## Hard limits

Constraints no amount of engineering removes. Design around them; don't promise
past them.

**Bypass is unsolvable in-process.** Short of running agents in a sandbox whose
only network route is your proxy, an SDK wrapper is cooperative. Combine
credential brokering with network egress control (agent runs in a container with
an allowlist to the proxy) or accept it's advisory.

**Database policy can't be per-query.** The prototype's choice — provision a
native scoped role, don't parse SQL — is correct. SQL parsing for authorization
is a decade-long losing battle against dialects and dynamic SQL. But it means DB
granularity is capped at whatever the database's own RBAC expresses. Say so
plainly; don't let the UI imply per-query conditions on `db` resources.

**`require_approval` collides with agent timeouts.** Holding a call while a
human decides assumes the caller waits. Agent frameworks have tool-call timeouts
measured in seconds to a couple of minutes; approvals take minutes to hours. A
naïve implementation just produces timeouts and, worse, *ambiguity* — the model
retries, and now you've issued two refunds. This needs async resumption and
idempotency keys, not a blocking hold. **It is the most underestimated feature in
the product.** Build it last, and design it as "deny now + resumable ticket"
rather than "block the socket".

**The agent is an untrusted caller.** Prompt injection means a legitimate agent
calling a legitimately granted tool with attacker-chosen arguments is the
expected threat, not an edge case. Tool-level allow/deny is therefore
insufficient by construction — the `PermissionParam` + condition model is the
part that actually addresses the threat. Invest there; it's also the hardest
part to copy.

**Schema drift breaks conditions silently.** When a condition binds to
`body.amount` and the upstream renames the field, the condition stops matching
and the call sails through. Treat a missing referenced field as **rule failure**,
not rule skip, and version catalogs so drift is detectable at discovery time
rather than at incident time.

## Engineering limits

Solvable, but they set the architecture.

**Latency and PDP placement.** A network hop per tool call is fatal for chatty
agents. The evaluation itself is cheap — [Cedar and Cerbos both evaluate in
sub-millisecond time](https://www.cerbos.dev/blog/cerbos-vs-opa), and
[network latency dominates raw engine
speed](https://goteleport.com/blog/benchmarking-policy-languages/). So: compile
policy into a bundle, push it to a sidecar or into the SDK, evaluate locally,
and ship audit asynchronously. Never make the decision path a round trip to a
central service.

**Audit volume dominates everything.** Config data (agents, resources, policies)
is tiny and relational — Postgres, trivially. Audit is orders of magnitude
larger and append-only. Separate them from day one: Postgres for the control
plane, a columnar store (ClickHouse, or partitioned Postgres early on) for
events. The UI must never full-scan.

**Revocation must propagate fast.** Local evaluation means cached bundles. A
revoked agent that keeps working for five minutes is a headline. Short bundle
TTLs plus a push channel, and treat revocation as a separate high-priority path
from ordinary policy updates.

**Static tokens are the wrong identity primitive.** `mg_live_...` is a
long-lived shared secret — precisely the pattern the industry has moved off.
The convergent answer is [an agent as a first-class non-human identity with
short-lived, cryptographically attested
credentials](https://www.sans.org/blog/your-ai-agent-easily-confused-deputy-why-cloud-security-needs-credential-broker):
SPIFFE/SPIRE or OIDC federation, with [OAuth 2.0 Token Exchange (RFC 8693)](https://securityboulevard.com/2026/05/ai-agent-identity-management-a-2026-ciso-playbook/)
to carry delegation. Static tokens are fine for a prototype; they are a
migration you want to do once, early.

**The missing user dimension.** The same agent acts for different users minute
to minute, and its effective access should differ per invocation. The model is
`(agent, resource)`; reality is `(agent, acting user, resource)`. Retrofitting a
principal dimension into policy evaluation, the grant model, and the UI is
expensive. **If you believe multi-user delegation is coming, add it to the model
now** — even if the UI ignores it initially.

## How to build it efficiently

### Don't build these

| Need | Use |
|---|---|
| Policy evaluation | **Cedar** — purpose-built for authorization, sub-ms, embeddable, deny-overrides built in. [Rego/OPA is more general and does more work per evaluation](https://www.permit.io/blog/policy-engine-showdown-opa-vs-openfga-vs-cedar) |
| REST interception | Envoy + `ext_authz`, or any API gateway |
| MCP interception | An MCP proxy server — protocol-native, and the [MCP roadmap explicitly calls out gateway/proxy patterns](https://systemprompt.io/guides/mcp-gateway-security-enterprise) |
| Secrets | Vault or a cloud secret manager |
| Workload identity | SPIFFE/SPIRE, or your IdP's OIDC federation |
| Audit store | ClickHouse |

Keep your condition model as the *authoring* layer and **compile it down to
Cedar**. You keep the UX; you inherit a formally specified evaluator, someone
else's performance work, and deny-overrides semantics for free — which fixes the
first-match-wins weakness noted in the data model doc.

### Do build these

This is the actual product:

1. **The agent-centric governance model** — per-(agent, resource) grants and
   policies, which is what the current UI now expresses. Gateways are organised
   around servers and routes; organising around *agents* is the differentiator.
2. **Discovery → catalog → grant pipeline.** Turning `tools/list` and OpenAPI
   specs into a reviewable catalog, with drift detection.
3. **Parameter-level conditions with a usable builder.** The hard, valuable,
   defensible part.
4. **Coverage measurement.** "You think you govern this agent; here's the 30% you
   don't" is a genuinely compelling wedge and nobody else frames it that way.

### Build order

Each stage is independently shippable, which matters because each one earns the
right to the next.

| Stage | Scope | Why here |
|---|---|---|
| **1. Observe** | Wrap, log, catalog, coverage %. No enforcement | Sellable alone. Generates the traffic data you need to write policies that don't break production |
| **2. Broker** | Credentials move to Managent, injected at egress | Converts advisory governance into a real boundary. The single highest-leverage feature |
| **3. Enforce** | Shadow → strict, param conditions, rate limits | Safe now, because stage 1 told you what enforcement would have broken |
| **4. Approve** | Async `require_approval` with resumption + idempotency | Hardest, least used at first. Deliberately last |

The `monitor → shadow → strict` progression already in the model is exactly
right, and the constraint that strict requires time in shadow first is a good
product instinct — keep it.

### Competitive reality

The MCP gateway category is [already crowded and consolidating](https://www.lunar.dev/post/the-best-open-source-mcp-gateways-in-2026),
and the protocol's own roadmap is absorbing auth and audit concerns. Plumbing
will be commoditised. Differentiation has to come from the governance model and
the authoring experience — the agent-centric structure and parameter-level
policy — not from owning the proxy.

## Two things to change now

Cheap today, expensive later:

1. **Add the acting-user dimension to the model**, even unused. Retrofitting a
   principal into policy evaluation is a rewrite.
2. **Make `failOpen` default per-risk, not globally true.** Fail-open on a
   `read_customers` call is sensible; fail-open on `create_payout` silently
   converts an outage into an unauthorised payout. The field belongs on the
   resource or the permission, not only on the agent.
