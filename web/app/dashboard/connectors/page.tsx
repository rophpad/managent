import { ConnectorsSection } from "@/components/dashboard/connectors-section";

import {
  connectConnector,
  createConnector,
  disconnectConnector,
  installMarketplaceListing,
  reconnectConnector,
  updateConnector,
} from "../actions";
import { getMarketplace, getOverview } from "../lib";

export default async function DashboardConnectorsPage() {
  const [overview, marketplace] = await Promise.all([
    getOverview(),
    getMarketplace(),
  ]);

  return (
    <ConnectorsSection
      connectors={overview.connectors}
      marketplace={marketplace}
      createConnector={createConnector}
      updateConnector={updateConnector}
      connectConnector={connectConnector}
      disconnectConnector={disconnectConnector}
      installMarketplaceListing={installMarketplaceListing}
      reconnectConnector={reconnectConnector}
    />
  );
}
