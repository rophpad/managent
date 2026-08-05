import type { Metadata } from "next";
import { figtree} from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Managent",
  description: "Managent is a control plane for AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Display and mono variables live here rather than on the dashboard shell,
    // so `font-display` / `font-mono` resolve on every route including the
    // landing page.
    <html
      lang="en"
      className={`h-full antialiased ${figtree.variable}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
