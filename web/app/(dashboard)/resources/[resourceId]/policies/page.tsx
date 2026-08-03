import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { getResourcePolicies } from "@/lib/data/policies";
import { getResource } from "@/lib/data/resources";
import { PolicyList } from "./_components/policy-list";

export default async function ResourcePoliciesPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = getResource(resourceId);
  if (!resource) notFound();

  return (
    <PanelBlock>
      <SectionTitle>Policy rules</SectionTitle>
      <PolicyList policies={getResourcePolicies(resource.id)} />
    </PanelBlock>
  );
}
