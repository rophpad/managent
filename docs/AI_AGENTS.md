# Connect AI agents to Managent

Managent exposes one authenticated MCP endpoint for every agent framework:

- Streamable HTTP: `http://127.0.0.1:8081/mcp`
- SSE compatibility: `http://127.0.0.1:8081/mcp/sse`
- Authentication: `Authorization: Bearer <agent token>`

## Prepare an agent

1. Add a resource. The bundled **Hello MCP** template is suitable for testing.
2. Register an agent and copy the one-time token immediately.
3. Link the resource to that agent. All tools start checked and allowed; uncheck only tools the agent must be denied.
4. Store the token separately for that workload:

```bash
export MANAGENT_TOKEN='mg_live_...'
export MANAGENT_MCP_URL='http://127.0.0.1:8081/mcp'
```

Do not share one token among multiple agents. The token determines identity,
permissions, policy evaluation, and audit attribution.

## Codex

Codex CLI, the Codex app, and the IDE extension share MCP configuration. Put
this in `~/.codex/config.toml` or a trusted project’s `.codex/config.toml`:

```toml
[mcp_servers.managent]
url = "http://127.0.0.1:8081/mcp"
bearer_token_env_var = "MANAGENT_TOKEN"
required = true
```

Restart the client and use `/mcp` or `codex mcp list` to verify it.

## Claude Code

```bash
claude mcp add --transport http managent "$MANAGENT_MCP_URL" \
  --header "Authorization: Bearer $MANAGENT_TOKEN"
```

Restart Claude Code and inspect its MCP server list.

## LangChain

```python
import os
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "managent": {
        "transport": "streamable_http",
        "url": os.environ["MANAGENT_MCP_URL"],
        "headers": {
            "Authorization": f"Bearer {os.environ['MANAGENT_TOKEN']}",
        },
    },
})

tools = await client.get_tools()
```

## Other MCP clients

Configure a Streamable HTTP server using `MANAGENT_MCP_URL` and the bearer
token header. Clients that only support SSE can use `/mcp/sse`.

## Test with Hello MCP

After linking the Hello resource and leaving `greet` checked in the permissions list, send:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "hello.greet",
    "arguments": { "name": "Ada" }
  }
}
```

If the call is denied, confirm the agent token is active, the Hello resource is
linked to that agent, and `greet` remains checked in the permissions list.
Policies optionally refine allowed calls with conditions, denial, approval, or
rate limits; a matching policy is not required.
