"use client";

import { KeyRound, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelBlock, SectionTitle } from "@/components/ui/card";
import { Hint } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import type { Resource } from "@/lib/types";
import { deleteDashboardEntity } from "@/lib/client-api";
import { useRouter } from "next/navigation";

export function ResourceSettings({ resource }: { resource: Resource }) {
  const router = useRouter();
  const [autoDiscover, setAutoDiscover] = useState(resource.discoveredVia === "auto");
  const [blockOnHighRisk, setBlockOnHighRisk] = useState(true);
  const [rediscovering, setRediscovering] = useState(false);

  return (
    <>
      {resource.kind !== "db" ? (
        <PanelBlock>
          <SectionTitle className="mb-1.5">Credential</SectionTitle>
          <Hint className="mt-0">
            Stored encrypted in the vault. Agents never read it — it&apos;s injected only for calls
            that policy allows.
          </Hint>
          <Button size="sm" className="mt-3.5">
            <KeyRound aria-hidden className="size-[15px]" />
            Rotate credential
          </Button>
        </PanelBlock>
      ) : null}

      {resource.kind === "mcp" ? (
        <PanelBlock>
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionTitle className="mb-1">Automatic tool discovery</SectionTitle>
              <Hint className="mt-0">
                Re-run <span className="font-mono">tools/list</span> on a schedule and surface new
                tools for review. New tools are never granted automatically.
              </Hint>
            </div>
            <Toggle
              checked={autoDiscover}
              onChange={setAutoDiscover}
              label="Automatically re-run tool discovery"
            />
          </div>
          <Button
            size="sm"
            className="mt-3.5"
            disabled={rediscovering}
            onClick={() => {
              setRediscovering(true);
              // TODO: call the discovery endpoint once the backend exists.
              setTimeout(() => setRediscovering(false), 700);
            }}
          >
            <Sparkles aria-hidden className="size-[15px]" />
            {rediscovering ? "Discovering…" : "Re-run discovery now"}
          </Button>
        </PanelBlock>
      ) : null}

      <PanelBlock>
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionTitle className="mb-1">Block high-risk permissions by default</SectionTitle>
            <Hint className="mt-0">
              Newly discovered or imported permissions flagged destructive start denied, until
              someone grants them explicitly.
            </Hint>
          </div>
          <Toggle
            checked={blockOnHighRisk}
            onChange={setBlockOnHighRisk}
            label="Block high-risk permissions by default"
          />
        </div>
      </PanelBlock>

      <PanelBlock className="border-danger-dim">
        <SectionTitle className="mb-1.5">Remove this resource</SectionTitle>
        <Hint className="mt-0">
          Every agent scoped against it loses access immediately. Calls that relied on it will start
          failing — this can&apos;t be undone.
        </Hint>
        <Button
          size="sm"
          variant="danger"
          className="mt-3.5"
          onClick={async () => {
            await deleteDashboardEntity("resources", resource.id);
            router.push("/resources");
            router.refresh();
          }}
        >
          <Trash2 aria-hidden className="size-[15px]" />
          Remove {resource.name}
        </Button>
      </PanelBlock>
    </>
  );
}
