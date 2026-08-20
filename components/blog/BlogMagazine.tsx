"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { api } from "@/client/trpc";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, ChevronLeft, ChevronRight, Eye, MessageCircle,
  Search, Tag, TrendingUp, Flame, BookOpen, User, Clock, ArrowRight,
} from "lucide-react";

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

export default function BlogMagazine() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hero = api.blog.getLatestPosts.useQuery(
    { limit: 5 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const list = api.blog.list.useQuery(
    { page, perPage: 9, search: debouncedSearch || undefined, categorySlug: category },
    { staleTime: 60 * 1000, refetchOnWindowFocus: false }
  );

  const heroPosts = hero.data?.posts ?? [];
  const currentHero = heroPosts[heroIndex];
  const categories = list.data?.categories ?? [];
  const posts = list.data?.posts ?? [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const scrollToNextHero = useCallback(() => {
    setHeroIndex((i) => (i + 1) % Math.max(1, heroPosts.length));
  }, [heroPosts.length]);

  useEffect(() => {
    if (heroPosts.length <= 1) return;
    heroTimerRef.current = setInterval(scrollToNextHero, 6000);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
  }, [heroPosts.length, scrollToNextHero]);

  const pauseHero = () => { if (heroTimerRef.current) { clearInterval(heroTimerRef.current); heroTimerRef.current = null; } };
  const resumeHero = () => {
    if (heroPosts.length <= 1) return;
    if (!heroTimerRef.current) heroTimerRef.current = setInterval(scrollToNextHero, 6000);
  };

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-amber-400" />
            <h2 className="text-2xl font-bold text-white dark:text-white">News &amp; Insights</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-3">Corporate news, community stories, and industry analysis from BPI</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search articles..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 pl-10 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Hero + sidebar */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Hero carousel */}
        <div
          className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 shadow-xl"
          onMouseEnter={pauseHero}
          onMouseLeave={resumeHero}
        >
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {currentHero.category && (
                        <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold backdrop-blur">
                          {currentHero.category.name}
                        </span>
                      )}
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(currentHero.publishedAt || currentHero.createdAt), "dd MMM yyyy")}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {currentHero.viewCount}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-3xl font-bold mb-2 drop-shadow-xl leading-tight line-clamp-2">{currentHero.title}</h1>
                    <p className="text-sm text-white/80 line-clamp-2 max-w-3xl mb-3">{currentHero.excerpt || "Discover the latest updates from BPI."}</p>
                    <Link
                      href={`/blog/${currentHero.slug}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-lg hover:bg-white transition-colors"
                    >
                      Read article <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
              {heroPosts.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-white backdrop-blur">
                  <button onClick={() => setHeroIndex((i) => (i - 1 + heroPosts.length) % heroPosts.length)} className="p-1 hover:text-emerald-200 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="text-xs font-semibold">{heroIndex + 1} / {heroPosts.length}</div>
                  <button onClick={() => setHeroIndex((i) => (i + 1) % heroPosts.length)} className="p-1 hover:text-emerald-200 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-[280px] sm:h-[400px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400" />
                <p className="text-sm font-medium text-slate-400">Loading featured stories...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: categories + trending */}
        <div className="lg:col-span-4 space-y-4">
          {/* Categories */}
          <div className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 p-4 shadow-lg">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Tag className="h-4 w-4 text-emerald-500" /> Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategory(undefined); setPage(1); }}
                className={`${pill} ${!category ? "bg-emerald-500/90 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
              >
                All
              </button>
              {categories.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.slug); setPage(1); }}
                  className={`${pill} ${category === c.slug ? "bg-emerald-500/90 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
                >
                  <Tag className="h-3.5 w-3.5" /> {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Trending / latest headlines */}
          <div className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 p-4 shadow-lg">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Flame className="h-4 w-4 text-amber-500" /> Trending Now
            </h3>
            <div className="space-y-3">
              {heroPosts.slice(0, 4).map((p: any, idx: number) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <span className="text-2xl font-bold text-emerald-500/30 dark:text-emerald-400/30 leading-none shrink-0">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.viewCount}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p._count?.comments ?? 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {!heroPosts.length && (
                <p className="text-sm text-slate-400 text-center py-4">No articles yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {category ? categories.find((c: any) => c.slug === category)?.name || "Articles" : "Latest Articles"}
          </h3>
          <span className="text-xs text-slate-400">({list.data?.total || 0})</span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl hover:border-emerald-400 dark:hover:border-emerald-600/60 transition-all duration-300"
            >
              <div className="relative h-52 w-full overflow-hidden">
                <img
                  src={post.image || post.imageUrl || "/img/blog-placeholder.jpg"}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                <div className="absolute bottom-2 left-2 flex gap-2">
                  {post.category && (
                    <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {post.category.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(post.publishedAt || post.createdAt), "dd MMM yyyy")}
                  </span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), { addSuffix: true })}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{post.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{post.excerpt || "Read more..."}</p>
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {post.author?.image ? (
                      <img src={post.author.image} alt={post.author?.name || "Author"} className="h-7 w-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{post.author?.name || "BPI Team"}</p>
                      <p className="text-[10px] text-slate-400">{post._count?.comments ?? 0} comments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!posts.length && !list.isLoading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No articles found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
          </div>
        )}

        {list.isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="h-52 w-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {list.data && list.data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 text-sm text-slate-500 dark:text-slate-400">
            <div>Page {list.data.page} / {list.data.totalPages} · {list.data.total} articles</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                disabled={page >= (list.data?.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
