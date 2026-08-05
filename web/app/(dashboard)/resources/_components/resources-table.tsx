"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ResourceName, ROW_LINK_CLASS, Table, Td, Th } from "@/components/ui/table";
import { catalogCountLabel, DISCOVERY_LABEL, RESOURCE_KIND_LABEL } from "@/lib/data/resources";
import type { Resource } from "@/lib/types";

export function ResourcesTable({
  resources,
  agentsByResource,
}: {
  resources: Resource[];
  /** Agent names per resource id, resolved on the server. */
  agentsByResource: Record<string, string[]>;
}) {
  const router = useRouter();

  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Resource</Th>
            <Th>Type</Th>
            <Th>Exposes</Th>
            <Th>Discovered via</Th>
            <Th>Agents using it</Th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr
              key={resource.id}
              className={ROW_LINK_CLASS}
              onClick={(event) => {
                // The name cell holds a real link for keyboard users; don't
                // navigate twice when that is what was clicked.
                if ((event.target as HTMLElement).closest("a")) return;
                router.push(`/resources/${resource.id}`);
              }}
            >
              <Td>
                <Link href={`/resources/${resource.id}`} className="hover:text-brand">
                  <ResourceName>{resource.name}</ResourceName>
                </Link>
              </Td>
              <Td muted>{RESOURCE_KIND_LABEL[resource.kind]}</Td>
              <Td muted>{catalogCountLabel(resource)}</Td>
              <Td muted>
                {resource.discoveredVia === "auto" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles aria-hidden className="size-[13px] text-allow" />
                    Auto-discovered
                  </span>
                ) : (
                  DISCOVERY_LABEL[resource.discoveredVia]
                )}
              </Td>
              <Td muted>{agentsByResource[resource.id]?.length ?? 0}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
