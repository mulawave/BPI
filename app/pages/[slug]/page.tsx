import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PageDetail({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const page = await prisma.page.findFirst({ where: { slug, status: "published" } });

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{page.category}</p>
          <h1 className="text-3xl font-bold leading-tight">{page.title}</h1>
          {page.summary && <p className="text-muted-foreground">{page.summary}</p>}
        </div>
        {page.heroImage && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.heroImage} alt={page.title} className="h-72 w-full object-cover" />
          </div>
        )}
        <article className="prose prose-slate max-w-none dark:prose-invert">
          {page.body.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </article>
      </div>
    </div>
  );
}
