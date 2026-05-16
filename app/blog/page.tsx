import { Navbar } from "@/components/homepage/layout/Navbar";
import { Footer } from "@/components/homepage/layout/Footer";
import BlogContent from "@/components/BlogContent";

export const dynamic = "force-dynamic";

export default function BlogPage() {
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
