import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/dashboard/page-header";
import { BLOG_POSTS, getBlogPost } from "@/lib/data/blog";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getBlogPost((await params).slug);
  return { title: post?.title ?? "Article", description: post?.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getBlogPost((await params).slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-[800px]">
      <Breadcrumb items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
      <article className="mt-5">
        <span className="inline-flex rounded-full border border-brand-dim bg-brand/9 px-2.5 py-1 text-[11px] font-medium text-brand">{post.category}</span>
        <h1 className="mt-4 max-w-[720px] font-display text-[34px] font-semibold leading-[1.15]">{post.title}</h1>
        <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-muted">{post.excerpt}</p>
        <div className="mt-5 flex items-center gap-2 border-b border-line-soft pb-6 text-xs text-muted-2"><Clock className="size-3.5" />{post.readTime}<span>·</span>{post.publishedAt}</div>

        <div className="py-7">
          {post.sections.map((section) => (
            <section key={section.heading} className="mb-8">
              <h2 className="mb-3 font-display text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="mb-4 max-w-[700px] text-[14px] leading-[1.75] text-muted">{paragraph}</p>)}
              {section.bullets ? <ul className="mb-4 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-muted">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              {section.code ? <pre className="no-scrollbar mb-4 overflow-x-auto rounded-xl border border-line bg-panel-2 p-4 font-mono text-[12.5px] leading-[1.7] text-fg"><code>{section.code}</code></pre> : null}
            </section>
          ))}
        </div>
      </article>
      <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-[13px] text-brand hover:underline"><ArrowLeft className="size-4" />Back to all articles</Link>
    </div>
  );
}
