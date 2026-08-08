import { BackendError, backendRequest } from "@/lib/backend";

function errorResponse(error: unknown, fallback: string) {
  const status = error instanceof BackendError ? error.status : 500;
  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ error: message }, { status });
}

export async function GET() {
  try {
    return Response.json(await backendRequest<unknown>("/api/v1/marketplace"));
  } catch (error) {
    return errorResponse(error, "Unable to load MCP templates");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return Response.json(
      await backendRequest<unknown>("/api/v1/marketplace", {
        method: "POST",
        body,
      }),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Unable to install MCP template");
  }
}
