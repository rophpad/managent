import { notFound } from "next/navigation";
import { Hint } from "@/components/ui/field";
import { AuditTable } from "@/app/(dashboard)/audit-logs/_components/audit-table";
import { fetchAgent } from "@/lib/data/server";
import { listAuditEntries } from "@/lib/data/server";

export default async function AgentActivityPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await fetchAgent(agentId);
  if (!agent) notFound();
  const entries = await listAuditEntries();

  return (
    <>
      <AuditTable
        entries={entries.filter((entry) => entry.agentId === agent.id)}
        showAgent={false}
      />
      <Hint className="mt-3">
        Every governed call from {agent.name}. Open a resource to see only that pair, along with the
        permissions and rules that produced these outcomes.
      </Hint>
    </>
  );
}
