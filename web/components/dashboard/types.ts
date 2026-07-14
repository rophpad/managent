export type MarketplaceListing = {
  slug: string;
  name: string;
  provider: string;
  description: string;
  defaultConnectorName: string;
  defaultNamespace: string;
  transportOptions: Array<{
    id: string;
    label: string;
    description?: string;
    transport: string;
    recommended: boolean;
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
    env?: Record<string, string>;
    fields: Array<{
      name: string;
      label: string;
      description?: string;
      placeholder?: string;
      required: boolean;
      secret: boolean;
      target: string;
      key?: string;
      template?: string;
    }>;
  }>;
};

export type Overview = {
  workspace: { id: number; name: string };
  apiKeys: Array<{ id: string; workspaceId: string; createdAt: string }>;
  connectors: Array<{
    id: string;
    workspaceId: string;
    name: string;
    namespace: string;
    transport: string;
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
    env?: Record<string, string>;
    enabled: boolean;
    secretEnvKeys?: string[];
    secretHeaderKeys?: string[];
    status: string;
    lastError?: string;
    tools?: Array<{ name: string }>;
    createdAt: string;
  }>;
  policies: Array<{
    id: string;
    workspaceId: string;
    name: string;
    tool: string;
    action: string;
    conditions?: Record<string, Record<string, string | number | boolean>>;
    createdAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    tool: string;
    decision: string;
    createdAt: string;
    request?: Record<string, unknown>;
    response?: Record<string, unknown>;
  }>;
};
