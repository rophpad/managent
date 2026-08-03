import type { Metadata } from "next";
import { Breadcrumb, PageHeader } from "@/components/dashboard/page-header";
import { getResource } from "@/lib/data/resources";
import { ResourceForm } from "./_components/resource-form";

type Props = { searchParams: Promise<{ edit?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { edit } = await searchParams;
  const resource = edit ? getResource(edit) : undefined;
  return { title: resource ? `Edit ${resource.name}` : "Add resource" };
}

export default async function ResourceFormPage({ searchParams }: Props) {
  // Edit mode lives in the URL rather than in component state, so the form is
  // linkable from the resource detail modal and survives a refresh.
  const { edit } = await searchParams;
  const editing = edit ? getResource(edit) : undefined;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Resources", href: "/resources" },
          { label: editing ? `Edit ${editing.name}` : "Add resource" },
        ]}
      />
      <PageHeader
        title={editing ? "Edit resource" : "Add a resource"}
        description={
          editing
            ? "Update the connection, credential, or permissions for this resource."
            : "Register a REST API, MCP server, or database so agents can be scoped against it."
        }
      />
      {/* Keyed so switching between resources remounts the form with fresh state. */}
      <ResourceForm key={editing?.id ?? "new"} editing={editing} />
    </>
  );
}
