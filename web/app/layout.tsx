import type { Metadata } from "next";
import { Poppins, Figtree } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Managent | The Home of AI Agent Engineering",
  description:
    "Managent is building the infrastructure and knowledge layer for AI Agent Engineering through education, research, open source, and developer tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${figtree.variable}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
