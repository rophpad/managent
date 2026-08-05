import type { ReactNode } from "react";
import { inter } from "@/app/fonts";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={inter.className}>{children}</div>;
}
