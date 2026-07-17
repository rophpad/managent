import { PoliciesSection } from "@/components/dashboard/policies-section";

import { createPolicy, reorderPolicies } from "../actions";
import { getOverview } from "../lib";

export default async function DashboardPoliciesPage() {
  const overview = await getOverview();

  return (
    <PoliciesSection
      policies={overview.policies}
      agents={overview.agents}
      mcps={overview.mcps}
      createPolicy={createPolicy}
      reorderPolicies={reorderPolicies}
    />
  );
}
