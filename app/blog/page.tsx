import { auth } from "@/server/auth";
import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";
import BlogContent from "@/components/BlogContent";
import BlogShell from "@/components/blog/BlogShell";
import BlogMagazine from "@/components/blog/BlogMagazine";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const session = await auth();

  if (session?.user) {
    return (
      <BlogShell session={session}>
        <BlogMagazine />
      </BlogShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bpi-cream">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlogContent embedded />
        </div>
      </main>
      <Footer />
    </div>
  );
}
