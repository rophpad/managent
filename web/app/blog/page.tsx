import { ArrowRight, BookOpen, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { BLOG_POSTS } from "@/lib/data/blog";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  const [featured, ...posts] = BLOG_POSTS;

  return (
    <>
      <PageHeader title="Blog" description="Practical guides for building, connecting, and governing AI agents." />

      <Link href={`/blog/${featured.slug}`} className="group mb-5 grid overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:border-brand-dim shell:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 shell:p-7">
          <span className="mb-4 inline-flex rounded-full border border-brand-dim bg-brand/9 px-2.5 py-1 text-[11px] font-medium text-brand">Featured · {featured.category}</span>
          <h2 className="mb-2 max-w-[560px] font-display text-[25px] font-semibold leading-tight group-hover:text-brand">{featured.title}</h2>
          <p className="max-w-[580px] text-[13.5px] leading-relaxed text-muted">{featured.excerpt}</p>
          <span className="mt-5 flex items-center gap-2 text-xs text-muted-2"><Clock className="size-3.5" />{featured.readTime}<span>·</span>{featured.publishedAt}</span>
        </div>
        <div className="flex min-h-44 items-center justify-center border-t border-line-soft bg-[radial-gradient(circle_at_50%_40%,rgba(108,123,255,0.22),transparent_62%)] shell:border-l shell:border-t-0">
          <div className="relative flex size-24 items-center justify-center rounded-[28px] border border-brand-dim bg-brand/9 text-brand shadow-[0_0_60px_rgba(108,123,255,0.18)]"><BookOpen className="size-10" /><span className="absolute -right-3 -top-3 size-5 rounded-full bg-allow/70 blur-[1px]" /></div>
        </div>
      </Link>

      <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-base font-semibold">Latest articles</h2><span className="text-xs text-muted-2">{BLOG_POSTS.length} articles</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex min-h-57 flex-col rounded-xl border border-line bg-panel p-5 transition-all hover:-translate-y-0.5 hover:border-brand-dim">
            <span className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-brand">{post.category}</span>
            <h3 className="mb-2 font-display text-[17px] font-semibold leading-snug group-hover:text-brand">{post.title}</h3>
            <p className="line-clamp-3 text-[12.5px] leading-relaxed text-muted">{post.excerpt}</p>
            <div className="mt-auto flex items-center justify-between pt-5 text-[11.5px] text-muted-2"><span>{post.readTime}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:text-brand" /></div>
          </Link>
        ))}
      </div>
    </>
  );
}
