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
        Register an agent, copy its one-time token, and grant it access to at least one resource.
        For a local test, add the Hello MCP template and grant the <InlineCode>greet</InlineCode>{" "}
        tool. Every client connects to the same Managent MCP gateway.
      </DocParagraph>
      <CodeBlock>
        <Comment># token shown after agent registration</Comment>
        {"\nexport MANAGENT_TOKEN=mg_live_...\nexport MANAGENT_MCP_URL=http://127.0.0.1:8081/mcp"}
      </CodeBlock>
      <DocParagraph>
        Keep each agent&apos;s token separate. Tokens identify the calling agent, so Codex,
        Claude, and a LangChain worker can hold different grants even when they use the same gateway.
      </DocParagraph>
    </>
  );
}

export function AgentIntegrations() {
  return (
    <>
      <DocHeading>Connect agent frameworks</DocHeading>
      <DocParagraph>
        <strong>Codex CLI, app, and IDE extension.</strong> Add this to{" "}
        <InlineCode>~/.codex/config.toml</InlineCode> or a trusted project&apos;s{" "}
        <InlineCode>.codex/config.toml</InlineCode>. Codex reads the bearer token from the
        environment instead of storing it in the file.
      </DocParagraph>
      <CodeBlock>
        {'[mcp_servers.managent]\nurl = "http://127.0.0.1:8081/mcp"\nbearer_token_env_var = "MANAGENT_TOKEN"\nrequired = true'}
      </CodeBlock>
      <DocParagraph>
        Restart Codex, then use <InlineCode>/mcp</InlineCode> or{" "}
        <InlineCode>codex mcp list</InlineCode> to confirm the connection.
      </DocParagraph>

      <DocParagraph>
        <strong>Claude Code.</strong> Register Managent as a remote HTTP MCP server. The shell
        expands the token when the server is added.
      </DocParagraph>
      <CodeBlock>
        {'claude mcp add --transport http managent "$MANAGENT_MCP_URL" \\\n  --header "Authorization: Bearer $MANAGENT_TOKEN"'}
      </CodeBlock>

      <DocParagraph>
        <strong>LangChain.</strong> Use the MCP adapters package and the streamable HTTP transport.
      </DocParagraph>
      <CodeBlock>
        {
          'import os\nfrom langchain_mcp_adapters.client import MultiServerMCPClient\n\nclient = MultiServerMCPClient({\n    "managent": {\n        "transport": "streamable_http",\n        "url": os.environ["MANAGENT_MCP_URL"],\n        "headers": {\n            "Authorization": f\'Bearer {os.environ["MANAGENT_TOKEN"]}\'\n        },\n    }\n})\ntools = await client.get_tools()'
        }
      </CodeBlock>

      <DocParagraph>
        <strong>Any MCP client.</strong> Use Streamable HTTP at{" "}
        <InlineCode>http://127.0.0.1:8081/mcp</InlineCode> and send{" "}
        <InlineCode>Authorization: Bearer &lt;agent token&gt;</InlineCode>. Use a different token
        per autonomous agent so audit logs and policies retain the correct identity.
      </DocParagraph>
    </>
  );
}


export function GoverningMcp() {
  return (
    <>
      <DocHeading>Governing an MCP tool</DocHeading>
      <DocParagraph>
        Connect the agent framework to Managent&apos;s MCP endpoint instead of connecting directly
        to each downstream server. Managent authenticates the agent token, evaluates grants and
        policies, records the decision, then routes allowed calls to the resource.
      </DocParagraph>
      <CodeBlock>
        {'POST /mcp\nAuthorization: Bearer $MANAGENT_TOKEN\n\n{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"hello.greet","arguments":{"name":"Ada"}}}'}
      </CodeBlock>
      <DocParagraph>
        Resource discovery calls <InlineCode>tools/list</InlineCode> and adds each tool to the
        resource catalog. Discovery makes a tool available to grant; it does not grant it. Until
        you give an agent that tool, calling it is denied.
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
            <DocTd>The agent&apos;s token has expired.</DocTd>
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
        <strong>Resources</strong> — add MCP servers manually or from a known template. Each server publishes
        a catalog of tools discovered automatically through <InlineCode>tools/list</InlineCode>. That catalog is global to the resource — it describes what <em>can</em> be called,
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
        <strong>Agents</strong> — register agents, view MCP coverage, and manage
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
        Managent only governs MCP tools you&apos;ve explicitly wrapped — there&apos;s no
        mode that automatically covers everything. Each agent&apos;s coverage indicator shows how
        much of its MCP activity is currently governed.
      </DocParagraph>
    </>
  );
}
