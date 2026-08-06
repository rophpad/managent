import { BackendError, backendRequest } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return Response.json(
      await backendRequest<unknown>("/api/v1/mcps/preview/test", {
        method: "POST",
        body,
      }),
    );
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to connect to MCP server";
    return Response.json({ error: message }, { status });
  }
}
