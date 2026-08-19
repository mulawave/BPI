"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, Calendar, User as UserIcon, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition, useRef, useEffect, useCallback } from "react";

interface BlogCarouselProps {
  posts: any[];
  total: number;
}

export function BlogCarousel({ posts, total }: BlogCarouselProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const carouselRef = useRef<HTMLDivElement>(null);
  const blogCardsPerView = 4;
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!posts.length) return null;

  const scrollToNext = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 2) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: 320, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (posts.length <= blogCardsPerView) return;
    autoScrollTimerRef.current = setInterval(scrollToNext, 4000);
    return () => { if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current); };
  }, [posts.length, scrollToNext]);

  const pauseAutoScroll = () => { if (autoScrollTimerRef.current) { clearInterval(autoScrollTimerRef.current); autoScrollTimerRef.current = null; } };
  const resumeAutoScroll = () => {
    if (posts.length <= blogCardsPerView) return;
    if (!autoScrollTimerRef.current) autoScrollTimerRef.current = setInterval(scrollToNext, 4000);
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-emerald-800/40 bg-white dark:bg-slate-900/50 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">Community Blog</p>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Latest From Our Blog</h2>
            <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
              {total} articles
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isPending}
          onClick={() => startTransition(() => router.push("/blog"))}
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
          View All
        </Button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => carouselRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow hover:border-emerald-500 hover:text-emerald-600 transition-colors shrink-0"
            aria-label="Previous posts"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={carouselRef}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={resumeAutoScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar flex-1 pb-2"
          >
            {posts.map((post: any, idx: number) => {
              const excerpt = (post.excerpt || "").slice(0, 120) + "...";
              const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              return (
                <div
                  key={post.id || idx}
                  className="group snap-center flex flex-col w-[280px] sm:w-[300px] shrink-0 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-lg dark:hover:shadow-emerald-950/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30">
                    <img
                      src={post.image || post.imageUrl || post.featuredImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 250'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%2310b981'/%3E%3Cstop offset='1' stop-color='%23047857'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='250' fill='url(%23g)'/%3E%3C/svg%3E"}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/80 text-[9px] text-slate-700 dark:text-slate-200 backdrop-blur-sm shadow-sm">
                        <Eye className="w-2.5 h-2.5" /> {post.viewCount ?? 0}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-md">
                        {post.categories?.[0]?.name || "Article"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-4">
                    <h4 className="text-sm font-bold leading-tight line-clamp-2 text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span className="font-medium">{post.author?.name || "BPI Team"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formattedDate}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 flex-1">{excerpt}</p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      Read Article
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => carouselRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow hover:border-emerald-500 hover:text-emerald-600 transition-colors shrink-0"
            aria-label="Next posts"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
