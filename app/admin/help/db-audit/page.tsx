import fs from "fs/promises";
import path from "path";
import ReactMarkdown from "react-markdown";

const mdPath = path.join(process.cwd(), "docs", "user-flow-db-audit-coverage.md");

async function getCoverageDoc() {
  try {
    const [content, stats] = await Promise.all([
      fs.readFile(mdPath, "utf8"),
      fs.stat(mdPath).catch(() => null),
    ]);
    const updatedAt = stats?.mtime ? stats.mtime.toISOString() : null;
    return { content, updatedAt };
  } catch (error) {
    return { content: null, updatedAt: null, error: (error as Error).message };
  }
}

const components = {
  h1: (props: any) => <h1 className="text-3xl font-semibold text-foreground mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-semibold text-foreground mt-6 mb-2" {...props} />,
  p: (props: any) => <p className="text-sm leading-6 text-muted-foreground mb-3" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4" {...props} />,
  li: (props: any) => <li className="text-sm leading-6 text-muted-foreground" {...props} />,
  code: (props: any) => (
    <code
      className="rounded bg-muted px-1 py-0.5 text-[12px] font-mono text-foreground"
      {...props}
    />
  ),
  pre: (props: any) => (
    <pre
      className="overflow-x-auto rounded-xl border border-border bg-background/80 p-4 text-[12px] leading-5 text-foreground"
      {...props}
    />
  ),
  hr: (props: any) => <hr className="my-8 border-border/60" {...props} />,
  blockquote: (props: any) => (
    <blockquote
      className="border-l-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))/6] px-4 py-2 text-sm text-muted-foreground rounded-r-xl"
      {...props}
    />
  ),
  a: (props: any) => (
    <a
      className="text-[hsl(var(--primary))] underline-offset-4 hover:underline"
      {...props}
    />
  ),
};

export default async function AdminDbAuditCoveragePage() {
  const { content, updatedAt, error } = await getCoverageDoc();

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quality Audit</p>
            <h1 className="text-2xl font-semibold text-foreground">User-Facing DB Audit Coverage</h1>
            <p className="text-sm text-muted-foreground">
              Live view of the markdown at <span className="font-mono">docs/user-flow-db-audit-coverage.md</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {updatedAt && (
              <span className="rounded-full border border-border px-3 py-1 bg-background/60">
                Updated: {new Date(updatedAt).toLocaleString()}
              </span>
            )}
            <span className="rounded-full border border-border px-3 py-1 bg-background/60 text-foreground">
              Source: docs/user-flow-db-audit-coverage.md
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load markdown: {error}
        </div>
      )}

      {content && (
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6 shadow-lg shadow-black/5">
          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground dark:prose-invert">
            <ReactMarkdown components={components}>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
