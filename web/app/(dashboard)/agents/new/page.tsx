import type { Metadata } from "next";
import { Breadcrumb, PageHeader } from "@/components/dashboard/page-header";
import { RESOURCES } from "@/lib/data/resources";
import { RegisterWizard } from "./_components/register-wizard";

export const metadata: Metadata = { title: "Register agent" };

export default function RegisterAgentPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Agents", href: "/agents" }, { label: "Register agent" }]} />
      <PageHeader
        title="Register a new agent"
        description="Resources and permissions are optional here — you can always add them later from the agent's detail page."
      />
      <RegisterWizard resources={RESOURCES} />
    </>
  );
}
