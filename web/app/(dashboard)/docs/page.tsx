import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { DocsViewer, type DocSection } from "./_components/docs-viewer";
import {  EnforcementModes,
  GoverningMcp,  HandlingErrors,
  Quickstart,
  UsingThePlatform,
} from "./_components/sections";

export const metadata: Metadata = { title: "Documentation" };

const SECTIONS: DocSection[] = [
  { id: "quickstart", label: "Quickstart", content: <Quickstart /> },
  { id: "mcp", label: "Governing an MCP tool", content: <GoverningMcp /> },
  { id: "enforcement", label: "Enforcement modes", content: <EnforcementModes /> },
  { id: "errors", label: "Handling errors", content: <HandlingErrors /> },
  { id: "platform", label: "Using the platform", content: <UsingThePlatform /> },
];

export default function DocsPage() {
  return (
    <>
      <PageHeader
        title="Documentation"
        description="How to install the Managent SDK, wrap your agent's tools, and use the platform."
      />
      <DocsViewer sections={SECTIONS} />
    </>
  );
}
