import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { fetchResource } from "@/lib/data/server";
import { ResourceSettings } from "./_components/resource-settings";

export default async function ResourceSettingsPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await fetchResource(resourceId);
  if (!resource) notFound();

  return (
    <>
      <PanelBlock>
        <SectionTitle className="mb-1.5">Connection &amp; permissions</SectionTitle>
        <Hint className="mt-0">
          Change the target, authentication, or the permission list for this resource.
        </Hint>
        <ButtonLink href={`/resources/new?edit=${resource.id}`} size="sm" className="mt-3.5">
          <Pencil aria-hidden className="size-[15px]" />
          Edit resource
        </ButtonLink>
      </PanelBlock>

      <ResourceSettings resource={resource} />
    </>
  );
}
