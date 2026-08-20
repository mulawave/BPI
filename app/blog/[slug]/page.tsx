import { auth } from "@/server/auth";
import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";
import BlogShell from "@/components/blog/BlogShell";
import BlogArticlePage from "@/components/blog/BlogArticlePage";
import UnauthBlogArticle from "@/components/blog/UnauthBlogArticle";

export const dynamic = "force-dynamic";

export default async function BlogDetailPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const slug = params?.slug;

  if (session?.user) {
    return (
      <BlogShell session={session}>
        <BlogArticlePage slug={slug} />
      </BlogShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bpi-cream">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <UnauthBlogArticle slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
