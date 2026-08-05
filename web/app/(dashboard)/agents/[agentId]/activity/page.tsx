import { notFound } from "next/navigation";
import { Hint } from "@/components/ui/field";
import { AuditTable } from "@/app/(dashboard)/audit-logs/_components/audit-table";
import { getAgent } from "@/lib/data/agents";
import { AUDIT_ENTRIES } from "@/lib/data/audit";

export default async function AgentActivityPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = getAgent(agentId);
  if (!agent) notFound();

  return (
    <>
      <AuditTable
        entries={AUDIT_ENTRIES.filter((entry) => entry.agentId === agent.id)}
        showAgent={false}
      />
      <Hint className="mt-3">
        Every governed call from {agent.name}. Open a resource to see only that pair, along with the
        permissions and rules that produced these outcomes.
      </Hint>
    </>
  );
}
