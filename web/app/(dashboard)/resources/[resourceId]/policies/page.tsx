import { notFound } from "next/navigation";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { fetchResourceDefaultPolicies } from "@/lib/data/server";
import { fetchResource } from "@/lib/data/server";
import { PolicyList } from "./_components/policy-list";

export default async function ResourcePoliciesPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await fetchResource(resourceId);
  if (!resource) notFound();

  return (
    <PanelBlock>
      <SectionTitle>Default policy rules</SectionTitle>
      <Hint className="mb-3 mt-0">
        Rules here apply to every agent using {resource.name}. An agent can have rules of its own on
        top of these — those are set on the agent, under Resources.
      </Hint>
      <PolicyList resource={resource} policies={await fetchResourceDefaultPolicies(resource.id)} />
    </PanelBlock>
  );
}
