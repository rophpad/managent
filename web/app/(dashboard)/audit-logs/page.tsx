import { Download } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { listAuditEntries } from "@/lib/data/server";
import { AuditTable } from "./_components/audit-table";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogsPage() {
  const entries = await listAuditEntries();
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every governed call across all agents, searchable and filterable."
        actions={
          <Button size="sm">
            <Download aria-hidden className="size-[15px]" />
            Export
          </Button>
        }
      />
      <AuditTable entries={entries} />
    </>
  );
}
