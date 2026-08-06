export async function saveDashboardEntity<T extends { id: string }>(
  collection: "agents" | "resources" | "policies" | "audit-entries",
  entity: T,
  create = false,
): Promise<T> {
  const path = create ? `/api/dashboard/${collection}` : `/api/dashboard/${collection}/${encodeURIComponent(entity.id)}`;
  const response = await fetch(path, {
    method: create ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entity),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to save");
  }
  return response.json() as Promise<T>;
}

export async function deleteDashboardEntity(
  collection: "agents" | "resources" | "policies" | "audit-entries",
  id: string,
): Promise<void> {
  const response = await fetch(`/api/dashboard/${collection}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Unable to delete");
}
