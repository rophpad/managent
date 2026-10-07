import Link from "next/link";
import { Brand } from "@/components/brand";

export default function PublicBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-fg">
      <header className="sticky top-0 z-50 border-b border-line-soft bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link href="/" aria-label="Managent mcpool home">
            <Brand markSize={28} />
          </Link>
          <nav aria-label="Public navigation" className="flex items-center gap-5 text-[13px] text-muted">
            <Link href="/" className="transition-colors hover:text-fg">Home</Link>
            <Link href="/blog" className="text-fg">Blog</Link>
            <Link href="/login" className="rounded-lg border border-line px-3 py-1.5 transition-colors hover:border-brand-dim hover:text-fg">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-7 sm:pt-14">
        {children}
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 text-xs text-muted-2 sm:px-7">
          <span>© 2026 Managent</span>
          <span>Control plane for AI agents</span>
        </div>
      </footer>
    </div>
  );
}
