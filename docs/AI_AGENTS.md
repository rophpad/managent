# Using Managent with AI Agents

Managent gives AI agents one MCP endpoint while enforcing authentication, policy, approval, validation, credential injection, and audit logging around downstream tools.

```text
Codex / Claude / Cursor / agent framework
                   |
                   | MCP over HTTP + agent bearer key
                   v
        http://127.0.0.1:8081/mcp
                   |
                   v
              Managent
                   |
                   +--> stdio MCP servers
                   +--> HTTP/SSE MCP servers
                   +--> REST adapters
```

## Prerequisites

Start Managent:

```bash
cp .env.example .env
docker compose up -d --build
```

The default local addresses are:

- Dashboard: `http://127.0.0.1:3000`
- MCP endpoint: `http://127.0.0.1:8081/mcp`
- SSE-compatible endpoint: `http://127.0.0.1:8081/mcp/sse`
- Health check: `http://127.0.0.1:8081/health`

Open the dashboard, sign up, and create an agent. Copy the generated agent key immediately: Managent displays its plaintext value only once.

Store it in an environment variable for local testing:

```bash
export MANAGENT_AGENT_KEY='mgnt_live_replace_me'
```

Do not commit agent keys to Git or place them directly in shared client configuration.

## Test the bundled hello-world MCP

Docker deployments include a small stdio MCP server under the `hello` namespace. Its `hello.greet` tool is allowed by the default policy.

Check discovery:

```bash
curl http://127.0.0.1:8081/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Call the greeting tool:

```bash
curl http://127.0.0.1:8081/mcp \
  -H "Authorization: Bearer $MANAGENT_AGENT_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hello.greet","arguments":{"name":"Ada"}}}'
```

Expected tool content:

```text
hello Ada
```

Tool discovery is intentionally available before authentication. Tool execution requires a valid agent key and a matching policy.

## Codex

Codex CLI, the Codex IDE extension, and the ChatGPT desktop app on the same host share MCP configuration. Codex supports Streamable HTTP servers and bearer tokens sourced from environment variables.

This repository includes a project-scoped `.codex/config.toml`:

```toml
[mcp_servers.managent]
url = "http://127.0.0.1:8081/mcp"
bearer_token_env_var = "MANAGENT_AGENT_KEY"
enabled = true
required = false
default_tools_approval_mode = "approve"
startup_timeout_sec = 10
tool_timeout_sec = 60
```

Start Codex from a shell that has the key:

```bash
cd /path/to/managent
export MANAGENT_AGENT_KEY='mgnt_live_replace_me'
codex
```

The project must be trusted before Codex loads project-scoped configuration. In Codex, use `/mcp` to confirm that `managent` is enabled. You can also inspect it from the shell:

```bash
codex mcp list
```

Test prompt:

```text
Use Managent's hello.greet tool to greet Ada. Return the exact tool result.
```

For a global configuration, copy the same table into `~/.codex/config.toml`.

Official Codex reference: [Model Context Protocol](https://learn.chatgpt.com/docs/extend/mcp.md).

## Claude

Claude products that support remote MCP servers can connect to Managent as an HTTP MCP server. In the MCP configuration UI, use:

- Name: `managent`
- Transport: `HTTP` or `Streamable HTTP`
- URL: `http://127.0.0.1:8081/mcp`
- Header: `Authorization: Bearer <agent-key>`

For Claude clients that accept JSON MCP configuration, the shape is typically:

```json
{
  "mcpServers": {
    "managent": {
      "type": "http",
      "url": "http://127.0.0.1:8081/mcp",
      "headers": {
        "Authorization": "Bearer mgnt_live_replace_me"
      }
    }
  }
}
```

Configuration fields and file locations vary between Claude Desktop and Claude Code releases. Prefer the product's MCP settings screen when available. Restart Claude after changing MCP configuration, inspect its connected tools, and ask:

```text
Call hello.greet through Managent with the name Claude.
```

If the client only launches local stdio servers and cannot connect to remote HTTP MCP directly, use an HTTP-to-stdio MCP bridge and point the bridge at the Managent URL. Keep the bearer key in the bridge process environment rather than committing it in JSON.

## Cursor

Create `.cursor/mcp.json` in the project or add the server through Cursor's MCP settings:

```json
{
  "mcpServers": {
    "managent": {
      "url": "http://127.0.0.1:8081/mcp",
      "headers": {
        "Authorization": "Bearer mgnt_live_replace_me"
      }
    }
  }
}
```

Enable the server in Cursor settings and open a new agent chat. Confirm that `hello.greet` appears in the available tools, then prompt:

```text
Use the Managent hello.greet tool to greet Cursor.
```

Do not commit `.cursor/mcp.json` when it contains a real key. Prefer Cursor's secret/environment support if it is available in your installed version, or keep personal MCP configuration outside the repository.

## LangChain

The `langchain-mcp-adapters` package can turn MCP tools into LangChain tools. Package APIs may change, so pin and consult the version installed in your application.

```bash
pip install langchain langchain-mcp-adapters
```

```python
import asyncio
import os

from langchain_mcp_adapters.client import MultiServerMCPClient


async def main():
    client = MultiServerMCPClient(
        {
            "managent": {
                "transport": "streamable_http",
                "url": "http://127.0.0.1:8081/mcp",
                "headers": {
                    "Authorization": f"Bearer {os.environ['MANAGENT_AGENT_KEY']}"
                },
            }
        }
    )

    tools = await client.get_tools()
    greet = next(tool for tool in tools if tool.name == "hello.greet")
    print(await greet.ainvoke({"name": "LangChain"}))


asyncio.run(main())
```

Pass the returned tools to a LangChain or LangGraph agent in the same way as other LangChain tools. The model provider is independent of Managent; OpenAI, Anthropic, and local models can all use the same MCP-backed tools when the framework supports tool calling.

## CrewAI

Recent CrewAI tool packages include an MCP adapter. Pin the package versions used by your application because adapter names and lifecycle APIs can differ between releases.

```bash
pip install crewai crewai-tools
```

```python
import os

from crewai import Agent, Crew, Task
from crewai_tools import MCPServerAdapter

server = {
    "url": "http://127.0.0.1:8081/mcp",
    "transport": "streamable-http",
    "headers": {
        "Authorization": f"Bearer {os.environ['MANAGENT_AGENT_KEY']}"
    },
}

with MCPServerAdapter(server) as managent_tools:
    agent = Agent(
        role="Tool integration tester",
        goal="Verify the greeting tool",
        backstory="You validate controlled MCP integrations.",
        tools=managent_tools,
        verbose=True,
    )
    task = Task(
        description="Use hello.greet to greet CrewAI and report the result.",
        expected_output="The exact greeting returned by the tool.",
        agent=agent,
    )
    Crew(agents=[agent], tasks=[task]).kickoff()
```

## Other agent frameworks

Use a framework's MCP client whenever it supports Streamable HTTP. Configure these four values:

| Setting | Value |
| --- | --- |
| Server name | `managent` |
| Transport | Streamable HTTP / HTTP MCP |
| URL | `http://127.0.0.1:8081/mcp` |
| Authorization | `Bearer $MANAGENT_AGENT_KEY` |

The normal MCP sequence is:

1. Send `initialize`.
2. Send `notifications/initialized` if the client requires it.
3. Call `tools/list`.
4. Give the returned schemas to the model.
5. Send chosen tool calls using `tools/call`.

If a framework has no MCP support, implement a small adapter around Managent's JSON-RPC endpoint. At minimum, map each result from `tools/list` to the framework's tool definition and execute selections with `tools/call`. Do not let the model construct the bearer token or arbitrary authorization headers.

## Container and remote networking

`127.0.0.1` means the machine or container in which the AI client runs.

- Host client to local Docker Managent: use `http://127.0.0.1:8081/mcp`.
- Another service in the same Compose network: use `http://gateway:8080/mcp`.
- Client in a different container: place it on the same network or use a host-gateway address appropriate for the platform.
- Remote client: use an HTTPS reverse proxy and a private hostname. Do not expose an unencrypted MCP endpoint publicly.

## Policies and tool visibility

Managent namespaces downstream tools to avoid collisions. A downstream tool named `greet` on the `hello` MCP becomes `hello.greet`.

Discovery and permission are separate:

- `tools/list` shows registered tools.
- Every `tools/call` requires a valid agent bearer key.
- The policy engine defaults to deny when no rule matches.
- `allow` executes the call.
- `deny` blocks it.
- `require_approval` pauses it for the configured approval workflow.

Create narrowly scoped policies for each agent and tool. Avoid a global `*` allow rule outside disposable development environments.

## Security recommendations

- Give each AI agent its own Managent identity and key.
- Use separate keys for development, CI, and production.
- Store keys in environment variables or a secret manager.
- Revoke or rotate a key immediately if it appears in logs, shell history, or Git.
- Keep downstream provider credentials in Managent; do not expose them to the AI client.
- Start with read-only tools and narrow allow policies.
- Use approval policies for destructive or externally visible actions.
- Review audit logs after agent runs.
- Put TLS and access controls in front of any non-local deployment.

## Troubleshooting

### The client connects but shows no tools

Check the gateway and tool discovery:

```bash
curl http://127.0.0.1:8081/health
curl http://127.0.0.1:8081/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
docker compose logs --tail=100 gateway
```

Confirm that the downstream MCP is enabled and connected in the dashboard.

### Tool calls return `missing authorization`

The MCP client did not send the bearer header. Confirm the key is present in the client process environment and restart the client after exporting it.

### Tool calls return `unauthorized: invalid api key`

Confirm that the key belongs to an active agent and has not been revoked or rotated. The dashboard cannot show an old plaintext key again; issue a new key if necessary.

### Tool calls are denied by policy

Create or reorder a policy matching the namespaced tool, agent/tag, and `call` action. Remember that unmatched calls are denied.

### The URL works on the host but not in a container

Use `http://gateway:8080/mcp` from services on the Compose network. `127.0.0.1:8081` is only correct from the Docker host.

### The client expects stdio only

Use an MCP HTTP-to-stdio bridge. Managent remains the remote HTTP endpoint; the bridge is only a local transport adapter for the client.

### Requests time out

Check downstream MCP status and gateway logs. Increase the client tool timeout for approval-gated or long-running tools. Codex uses `tool_timeout_sec`; other clients expose an equivalent setting.
