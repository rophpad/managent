import {
  CodeBlock,
  Comment,
  DocHeading,
  DocList,
  DocParagraph,
  DocTable,
  DocTd,
  DocTh,
  InlineCode,
} from "@/components/ui/prose";

export function Quickstart() {
  return (
    <>
      <DocHeading>Quickstart</DocHeading>
      <DocParagraph>
        Install the SDK and set your agent&apos;s token. There&apos;s no proxy, no certificate to
        trust, no network configuration — Managent is a package you call directly in your
        agent&apos;s code.
      </DocParagraph>
      <CodeBlock>
        <Comment># install</Comment>
        {"\npip install managent\n\n"}
        <Comment># set your token</Comment>
        {"\nexport MANAGENT_TOKEN=mg_live_invoice_agent_9f8a2b"}
      </CodeBlock>
      <DocParagraph>
        The SDK reads <InlineCode>MANAGENT_TOKEN</InlineCode> from the environment automatically, or
        you can pass it explicitly when creating the client.
      </DocParagraph>
      <CodeBlock>
        {'from managent import Managent\nmg = Managent(token="mg_live_invoice_agent_9f8a2b")'}
      </CodeBlock>
    </>
  );
}

export function GoverningRest() {
  return (
    <>
      <DocHeading>Governing a REST API call</DocHeading>
      <DocParagraph>
        Wrap any function your agent calls — a vendor SDK method, a plain HTTP client call. Managent
        checks it against the agent&apos;s declared scope before letting it run, and injects the real
        credential only for allowed calls.
      </DocParagraph>
      <CodeBlock>
        {'stripe.api_key = "managed-by-managent"  '}
        <Comment># placeholder, never sent to Stripe</Comment>
        {
          '\n\nstripe_refund = mg.wrap(stripe.Refund.create, connector="stripe", scope="refunds")\nstripe_refund(charge="ch_1AbCdEf")'
        }
      </CodeBlock>
      <DocParagraph>
        Your code, environment variables, and deployment artifacts never contain the real Stripe key
        at all.
      </DocParagraph>
    </>
  );
}

export function GoverningMcp() {
  return (
    <>
      <DocHeading>Governing an MCP tool</DocHeading>
      <DocParagraph>
        Wrap an MCP client session once with <InlineCode>wrap_mcp()</InlineCode> — this governs every
        tool the server exposes, since all MCP tool calls flow through the same entrypoint. Works
        identically for local (stdio) and remote (HTTP+SSE) servers.
      </DocParagraph>
      <CodeBlock>
        {
          'session = ClientSession(transport)\ngoverned = mg.wrap_mcp(session, connector="stripe-mcp")\n\nresult = await governed.call_tool(\n    name="stripe_create_refund",\n    arguments={"charge": "ch_1AbCdEf"}\n)'
        }
      </CodeBlock>
      <DocParagraph>
        Tool discovery is automatic — the first call to <InlineCode>wrap_mcp()</InlineCode> on a new
        server calls its <InlineCode>tools/list</InlineCode> method and adds each tool to the
        server&apos;s catalog in the dashboard. Discovery makes a tool available to grant; it does
        not grant it. Until you give an agent that tool, calling it is denied.
      </DocParagraph>
    </>
  );
}

export function DatabaseCredentials() {
  return (
    <>
      <DocHeading>Database credentials</DocHeading>
      <DocParagraph>
        Request a short-lived, natively-scoped database role instead of hardcoding a connection
        string.
      </DocParagraph>
      <CodeBlock>
        {
          'creds = mg.get_db_credential(scope="invoices-readonly")\nconn = psycopg2.connect(creds.connection_string)'
        }
      </CodeBlock>
      <DocParagraph>
        Managent provisions the role and enforces access at the database level — it doesn&apos;t
        parse or intercept SQL.
      </DocParagraph>
    </>
  );
}

export function EnforcementModes() {
  return (
    <>
      <DocHeading>Enforcement modes</DocHeading>
      <DocParagraph>Every agent has an enforcement mode, set from its detail page:</DocParagraph>
      <DocList>
        <li>
          <strong>Monitor</strong> (default) — nothing is ever blocked; everything is logged,
          including what would have been denied.
        </li>
        <li>
          <strong>Shadow</strong> — denials are flagged as &quot;would have been blocked&quot;
          without actually blocking anything. Required before an agent can move to strict.
        </li>
        <li>
          <strong>Strict</strong> — out-of-scope calls raise <InlineCode>ScopeDeniedError</InlineCode>{" "}
          and are actually blocked.
        </li>
      </DocList>
      <DocParagraph>
        If Managent&apos;s own service is briefly unreachable, calls <strong>fail open</strong> by
        default — your agent&apos;s call still goes through, and a warning is logged, so a Managent
        outage never breaks your agent. This is configurable per agent.
      </DocParagraph>
    </>
  );
}

export function HandlingErrors() {
  return (
    <>
      <DocHeading>Handling errors</DocHeading>
      <DocTable>
        <thead>
          <tr>
            <DocTh>Exception</DocTh>
            <DocTh>Meaning</DocTh>
          </tr>
        </thead>
        <tbody>
          <tr>
            <DocTd mono>ScopeDeniedError</DocTd>
            <DocTd>Blocked in strict mode — the agent isn&apos;t scoped for this action.</DocTd>
          </tr>
          <tr>
            <DocTd mono>TokenExpiredError</DocTd>
            <DocTd>The agent&apos;s token or a database credential has expired.</DocTd>
          </tr>
        </tbody>
      </DocTable>
      <CodeBlock>
        {
          'from managent import ScopeDeniedError\n\ntry:\n    stripe_refund(charge=invoice.charge_id)\nexcept ScopeDeniedError as e:\n    logger.warning(f"Blocked: {e}")'
        }
      </CodeBlock>
    </>
  );
}

export function UsingThePlatform() {
  return (
    <>
      <DocHeading>Using the platform</DocHeading>
      <DocParagraph>
        <strong>Resources</strong> — add REST APIs, MCP servers, or databases. A resource publishes
        a catalog of what it exposes: endpoints for REST (imported from an OpenAPI spec, picked from
        a community template, or added manually), tools for MCP (auto-discovered), roles for a
        database. That catalog is global to the resource — it describes what <em>can</em> be called,
        not who may call it.
      </DocParagraph>
      <DocParagraph>
        <strong>Permissions are granted per agent, per resource.</strong> Each agent holds its own
        subset of a resource&apos;s catalog, so two agents on the same resource routinely have
        different access. Open an agent, choose a resource, and you get exactly that pair: the
        permissions it has been granted, the policy rules that govern it, and its call log. Changing
        one agent&apos;s access never affects another&apos;s.
      </DocParagraph>
      <DocParagraph>
        <strong>Policies</strong> follow the same shape. Rules are written for one agent on one
        resource. A resource can also carry default rules that every agent using it inherits — those
        are edited on the resource, and show up read-only, in evaluation order, alongside an
        agent&apos;s own rules.
      </DocParagraph>
      <DocParagraph>
        <strong>Agents</strong> — register agents, view coverage across REST and MCP, and manage
        enforcement mode and linked resources from each agent&apos;s detail page.
      </DocParagraph>
      <DocParagraph>
        <strong>Audit logs</strong> — every governed call across all agents, searchable by agent,
        resource, and outcome.
      </DocParagraph>
      <DocParagraph>
        <strong>Settings</strong> — org-wide defaults for enforcement mode, fail-open behavior, and
        alerting.
      </DocParagraph>
      <DocParagraph>
        Managent only governs calls and MCP tools you&apos;ve explicitly wrapped — there&apos;s no
        mode that automatically covers everything. Each agent&apos;s coverage indicator shows how
        much is currently governed, split by REST and MCP.
      </DocParagraph>
    </>
  );
}
