import { BackendError, backendRequest } from "@/lib/backend";

export async function GET() {
  try {
    return Response.json(await backendRequest<unknown>("/api/v1/mcps"));
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load MCP servers";
    return Response.json({ error: message }, { status });
  }
}
