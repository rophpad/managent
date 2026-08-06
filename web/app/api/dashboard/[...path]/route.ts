import { backendRequest } from "@/lib/backend";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: Context) {
  const { path } = await context.params;
  const body = request.method === "GET" || request.method === "DELETE"
    ? undefined
    : await request.text();
  try {
    const result = await backendRequest<unknown>(
      `/api/v1/dashboard/${path.map(encodeURIComponent).join("/")}`,
      { method: request.method, body },
    );
    return result === undefined
      ? new Response(null, { status: 204 })
      : Response.json(result, { status: request.method === "POST" ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend request failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
