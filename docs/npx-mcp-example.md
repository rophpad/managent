# Configuring a real npm-based MCP server in Managent

A real example is the official filesystem MCP server:

```bash
npx -y @modelcontextprotocol/server-filesystem /workspace
```

## Managent configuration

The executable and its arguments must be configured separately:

```json
{
  "name": "filesystem",
  "namespace": "filesystem",
  "transport": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/workspace"
  ],
  "enabled": true
}

```

Install it through the control-plane API:

```bash
curl -X POST http://127.0.0.1:8081/api/v1/mcps \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_MANAGENT_ADMIN_TOKEN' \
  -d '{
    "name": "filesystem",
    "namespace": "filesystem",
    "transport": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/workspace"
    ],
    "enabled": true
  }'
```

## Command and arguments must be separate

Do not set the command to one combined shell string:

```text
npx -y @modelcontextprotocol/server-filesystem /workspace
```

Managent launches stdio servers with Go's `exec.CommandContext(command, args...)`. The executable must therefore be `npx`, while `-y`, the package name, and `/workspace` belong in `args`.

The manual MCP UI supports this configuration. Select **stdio (local subprocess)**, enter `npx` as the executable, and enter each argument on its own line:

```text
-y
@modelcontextprotocol/server-filesystem
/workspace
```

You can also configure optional advanced stdio settings: a process working directory, non-secret environment variables, and a secret environment variable credential.

## Process working directory

The optional **Process working directory** controls the directory in which Managent starts the stdio subprocess. It must be an absolute path that exists inside the gateway runtime.

The filesystem MCP example does not require this setting. Its `/workspace` argument specifies the directory the server exposes:

```text
npx -y @modelcontextprotocol/server-filesystem /workspace
```

That argument is separate from the subprocess working directory.

A process working directory is useful for MCP servers that discover project files or resolve relative paths, including:

- **Git MCPs** that locate `.git` or run Git commands against the current repository.
- **Code-analysis servers** that inspect `package.json`, `pyproject.toml`, `tsconfig.json`, or source trees.
- **Test runners** that load project-local tests, fixtures, and configuration.
- **Build-tool integrations** that invoke project scripts, compilers, or task definitions.
- **Custom project-specific MCPs** that read relative configuration or data files.

For example, a project-aware MCP could use:

```json
{
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@example/project-mcp"],
  "workingDirectory": "/workspace/my-project"
}
```

The working directory does not grant filesystem access or create a security boundary. The path must already be available to the gateway through its container filesystem or an explicit mount. Avoid mounting an entire project or host filesystem unless that access is intentional.

## Gateway image requirement

The standard gateway image uses Node.js 22 Alpine and includes npm/npx. Custom gateway images must also provide `npx`; otherwise the configuration fails with an error similar to:

```text
executable file not found: npx
```

The gateway runtime image uses this pattern:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /out/managent-gateway /app/bin/managent-gateway
COPY --from=builder /out/hello-mcp /app/bin/hello-mcp
COPY config /app/config
COPY database/schema.sql /app/database/schema.sql

EXPOSE 8080

CMD ["/app/bin/managent-gateway"]
```

## Filesystem mount

The filesystem server also needs an accessible directory mounted at `/workspace`. The default Compose setup provides an isolated named volume:

```yaml
volumes:
  - managent-mcp-workspace:/workspace
```

To expose a specific host directory instead, replace it intentionally with a bind mount such as `./workspace:/workspace`.

The MCP server can read and modify files within the mounted directory according to its available tools. Do not mount the entire project or host filesystem unless that access is intentional.
