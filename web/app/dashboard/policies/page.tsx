import { PoliciesSection } from "@/components/dashboard/policies-section";

import { createPolicy } from "../actions";
import { getOverview } from "../lib";

export default async function DashboardPoliciesPage() {
  const overview = await getOverview();

  return (
    <PoliciesSection
      policies={overview.policies}
      connectors={overview.connectors}
      createPolicy={createPolicy}
    />
  );
}
