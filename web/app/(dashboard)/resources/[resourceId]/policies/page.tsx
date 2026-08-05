import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { getResourceDefaultPolicies } from "@/lib/data/policies";
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
      <SectionTitle>Default policy rules</SectionTitle>
      <Hint className="mb-3 mt-0">
        Rules here apply to every agent using {resource.name}. An agent can have rules of its own on
        top of these — those are set on the agent, under Resources.
      </Hint>
      <PolicyList resource={resource} policies={getResourceDefaultPolicies(resource.id)} />
    </PanelBlock>
  );
}
