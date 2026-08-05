import { CreditCard, Database, Hash, Mail, Plug, PlugZap, type LucideIcon } from "lucide-react";
import { GithubMark } from "@/components/icons/brand";
import type { ResourceKind } from "@/lib/types";

type IconComponent = LucideIcon | typeof GithubMark;

/**
 * Icons are chosen semantically (a card for payments, an envelope for mail)
 * rather than as vendor logos. Only GitHub gets its real mark, because we
 * already ship that exact path — shipping approximated trademark geometry for
 * the rest would look wrong and be wrong.
 */
const BY_RESOURCE: Record<string, IconComponent> = {
  stripe: CreditCard,
  "stripe-mcp": PlugZap,
  sendgrid: Mail,
  slack: Hash,
  github: GithubMark,
  postgres: Database,
};

const BY_KIND: Record<ResourceKind, IconComponent> = {
  rest: Plug,
  mcp: PlugZap,
  db: Database,
};

export function ResourceIcon({
  id,
  kind,
  className,
}: {
  id: string;
  kind?: ResourceKind;
  className?: string;
}) {
  // Indexed directly rather than via a helper: the lint rule that guards against
  // components being created during render can't see through a function call.
  const Icon = BY_RESOURCE[id] ?? BY_KIND[kind ?? "rest"];
  return <Icon aria-hidden className={className} />;
}
