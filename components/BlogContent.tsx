"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Session } from "next-auth";
import { api } from "@/client/trpc";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Eye, MessageCircle, Search, Tag } from "lucide-react";
import Footer from "@/components/Footer";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import ViewportFitBanner from "@/components/ViewportFitBanner";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppNav } from "@/components/layout/AppNav";

interface BlogContentProps {
  session: Session;
  embedded?: boolean;
}

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

export default function BlogContent({ session: _session, embedded = false }: BlogContentProps) {
  const [heroIndex, setHeroIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const hero = api.blog.getLatestPosts.useQuery({ limit: 5 });
  const list = api.blog.list.useQuery({ page, perPage: 12, search: search || undefined, categorySlug: category });

  const heroPosts = hero.data?.posts ?? [];

  useEffect(() => {
    if (!heroPosts.length) return;
    const id = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroPosts.length);
    }, 5000);
    return () => clearInterval(id);
  }, [heroPosts.length]);

  const currentHero = heroPosts[heroIndex];

  const categories = list.data?.categories ?? [];

  const containerClass = embedded ? "" : "min-h-screen bg-background flex flex-col";
  const mainClass = embedded ? "" : "flex-1 w-full";

  return (
    <div className={containerClass}>
      {!embedded && (
        <>
          <AppHeader pageTitle="BeepAgro Africa" pageSubtitle="BPI Blog" />
          <AppNav activePath="/blog" />
        </>
      )}

      <main className={mainClass}>
        <div className="mx-auto w-full max-w-9xl px-3 sm:px-4 space-y-8 ">
          {/* Hero Carousel */}
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 overflow-hidden rounded-3xl border border-border bg-background shadow-xl">
              {currentHero ? (
                <div className="relative w-full aspect-[16/9]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHero.id}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={currentHero.image || currentHero.imageUrl || "/img/blog-placeholder.jpg"}
                        alt={currentHero.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {currentHero.category && (
                            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                              {currentHero.category.name}
                            </span>
                          )}
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(currentHero.publishedAt || currentHero.createdAt), "dd MMM yyyy")}
                          </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-3 drop-shadow-xl">{currentHero.title}</h1>
                        <p className="text-sm sm:text-base text-white/80 line-clamp-3 max-w-3xl">
                          {currentHero.excerpt || "Discover the latest updates from BPI."}
                        </p>
                        <Link
                          href={`/blog/${currentHero.slug}`}
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-lg hover:bg-white"
                        >
                          Continue reading <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-white backdrop-blur">
                    <button onClick={() => setHeroIndex((i) => (i - 1 + heroPosts.length) % heroPosts.length)} className="p-1 hover:text-emerald-200">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-xs">{heroIndex + 1} / {heroPosts.length || 1}</div>
                    <button onClick={() => setHeroIndex((i) => (i + 1) % heroPosts.length)} className="p-1 hover:text-emerald-200">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex h-[280px] sm:h-[380px] items-center justify-center text-muted-foreground">Loading hero...</div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-3 rounded-3xl border border-border bg-background/90 p-4 shadow-lg">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                  placeholder="Search articles"
                  className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setCategory(undefined); setPage(1); }}
                    className={`${pill} ${!category ? "bg-emerald-500/90 text-white" : "bg-muted text-foreground"}`}
                  >
                    All
                  </button>
                  {categories.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setCategory(c.slug); setPage(1); }}
                      className={`${pill} ${category === c.slug ? "bg-emerald-500/90 text-white" : "bg-muted text-foreground"}`}
                    >
                      <Tag className="h-3.5 w-3.5" /> {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Latest headlines</h3>
                <div className="space-y-2">
                  {heroPosts.slice(0, 4).map((p: any) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="block rounded-lg border border-border/60 bg-background/60 p-2 text-sm hover:border-emerald-500">
                      <div className="font-semibold line-clamp-2">{p.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" /> {p.viewCount}
                        <MessageCircle className="h-3 w-3" /> {p._count?.comments ?? 0}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid of posts */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {list.data?.posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background/90 shadow-lg hover:border-emerald-400">
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={post.image || post.imageUrl || "/img/blog-placeholder.jpg"}
                    alt={post.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    {post.category && <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-800">{post.category.name}</span>}
                    <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {post.viewCount}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(post.publishedAt || post.createdAt), "dd MMM yyyy")}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt || "Read more"}</p>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {post.author?.image && <img src={post.author.image} alt={post.author?.name || "Author"} className="h-7 w-7 rounded-full border border-border object-cover" />}
                      <div>
                        <p className="font-semibold text-foreground text-sm">{post.author?.name || "BPI Team"}</p>
                        <p className="text-xs text-muted-foreground">{post._count?.comments ?? 0} comments</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-emerald-600 font-semibold">Read <ChevronRight className="h-4 w-4" /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {!list.data?.posts?.length && (
            <div className="rounded-2xl border border-border bg-background/80 p-6 text-center text-muted-foreground">No posts found.</div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
            <div>
              Page {list.data?.page || 1} / {list.data?.totalPages || 1} · {list.data?.total || 0} posts
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= (list.data?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {!embedded && (
        <>
          <Footer />
          <ViewportFitBanner />
          <MobileBottomNav />
        </>
      )}
    </div>
  );
}
