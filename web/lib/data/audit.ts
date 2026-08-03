import type { AuditEntry } from "@/lib/types";

/**
 * One stream for the whole org. The agent detail page filters this by agent
 * rather than keeping a second, separate activity list.
 */
export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: "a1", time: "14:12:03", agentId: "invoice-agent", action: "post slack:finance-alerts", outcome: "allow" },
  { id: "a2", time: "14:09:47", agentId: "invoice-agent", action: "write postgres:invoices (DELETE)", outcome: "deny" },
  { id: "a3", time: "14:04:12", agentId: "invoice-agent", action: "send sendgrid:reminders", outcome: "allow" },
  { id: "a4", time: "14:02:11", agentId: "invoice-agent", action: "read postgres:invoices", outcome: "allow" },
  { id: "a5", time: "13:58:06", agentId: "invoice-agent", action: "read postgres:invoices", outcome: "allow" },
  { id: "a6", time: "13:55:30", agentId: "support-bot", action: "call twilio:sms", outcome: "allow" },
  { id: "a7", time: "13:41:19", agentId: "invoice-agent", action: "send sendgrid:reminders", outcome: "allow" },
  { id: "a8", time: "13:40:02", agentId: "support-bot", action: "mcp:zendesk_close_ticket", outcome: "allow" },
  { id: "a9", time: "09:12:44", agentId: "code-reviewer", action: "call github:pulls.comment", outcome: "allow" },
];

export function getAgentActivity(agentId: string, limit = 5): AuditEntry[] {
  return AUDIT_ENTRIES.filter((entry) => entry.agentId === agentId).slice(0, limit);
}

/** `14:09:47` → `14:09`, for the condensed activity list on the agent page. */
export function toShortTime(time: string): string {
  return time.slice(0, 5);
}
