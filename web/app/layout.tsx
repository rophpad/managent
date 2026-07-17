import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Managent | Secure MCP Tool Gateway for AI Agents",
  description:
    "Managent firewalls autonomous agent tool calls with deterministic guardrails, human approvals, and production secret vaulting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
