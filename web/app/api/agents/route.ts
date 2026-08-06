import { BackendError, backendRequest } from "@/lib/backend";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const result = await backendRequest<unknown>("/api/v1/agents", {
      method: "POST",
      body,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to register agent";
    return Response.json({ error: message }, { status });
  }
}
