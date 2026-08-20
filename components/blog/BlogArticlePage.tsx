"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/client/trpc";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  BookOpen, Calendar, ChevronLeft, Eye, MessageCircle, Send, User,
  Clock, Tag, Share2, ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

type CommentItem = {
  id: number;
  content: string;
  createdAt: string | Date;
  user?: { id: string; name: string | null; image: string | null; role?: string | null };
};

export default function BlogArticlePage({ slug: slugProp }: { slug?: string }) {
  const params = useParams();
  const slug = slugProp || (params?.slug as string);
  const [comment, setComment] = useState("");
  const [commentsPage, setCommentsPage] = useState(1);

  const postQuery = api.blog.getPostBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false, refetchOnReconnect: false }
  );
  const postId = postQuery.data?.id;

  const commentsQuery = api.blog.getComments.useQuery(
    { postId: postId || 0, page: commentsPage },
    { enabled: Boolean(postId), staleTime: 30 * 1000, refetchOnWindowFocus: false, refetchOnReconnect: false }
  );

  const relatedQuery = api.blog.getLatestPosts.useQuery(
    { limit: 4 },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const addComment = api.blog.addComment.useMutation({
    onSuccess: () => { toast.success("Comment added"); setComment(""); commentsQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const incrementView = api.blog.incrementView.useMutation();

  useEffect(() => {
    if (postId) incrementView.mutate({ postId });
  }, [postId]);

  if (postQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400" />
          <p className="text-sm font-medium text-slate-400">Loading article...</p>
        </div>
      </div>
    );
  }

  const post = postQuery.data;
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <BookOpen className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-lg font-semibold text-slate-900 dark:text-white">Article not found</p>
        <p className="text-sm text-slate-400">This article may have been removed or the link is incorrect.</p>
        <Link href="/blog" className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
        </Link>
      </div>
    );
  }

  const comments = (commentsQuery.data?.comments ?? []) as CommentItem[];
  const relatedPosts = (relatedQuery.data?.posts ?? []).filter((p: any) => p.id !== post.id).slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast.success("Link copied to clipboard"); } catch {}
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/blog" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to blog
        </Link>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-xs font-medium text-slate-400 truncate max-w-[200px]">{post.title}</span>
      </div>

      {/* Article */}
      <article className="overflow-hidden rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 shadow-xl">
        {/* Hero image */}
        <div className="relative h-[280px] sm:h-[440px] w-full">
          <img
            src={post.image || post.imageUrl || "/img/blog-placeholder.jpg"}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm mb-3">
              {post.category && (
                <span className="rounded-full bg-emerald-500/90 px-3 py-1 font-bold backdrop-blur">
                  {post.category.name}
                </span>
              )}
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {format(new Date(post.publishedAt || post.createdAt), "dd MMM yyyy")}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <Eye className="h-4 w-4" /> {post.viewCount} views
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> {post._count?.comments ?? 0} comments
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight drop-shadow-xl">{post.title}</h1>
            <div className="mt-4 flex items-center gap-3">
              {post.author?.image ? (
                <img src={post.author.image} alt={post.author?.name || "Author"} className="h-10 w-10 rounded-full border border-white/40 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-semibold">{post.author?.name || "BPI Team"}</p>
                <p className="text-xs uppercase tracking-wide text-white/70">{post.author?.role || "Contributor"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content + sidebar */}
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-6 sm:p-8">
              <div className="prose prose-emerald dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              </div>
              {post.tags && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-slate-400" />
                    {post.tags.split(",").map((tag: string, i: number) => (
                      <span key={i} className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-colors">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Author sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <BookOpen className="h-4 w-4 text-emerald-500" /> About the author
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {post.author?.image ? (
                  <img src={post.author.image} alt={post.author?.name || "Author"} className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{post.author?.name || "BPI Team"}</p>
                  <p className="text-xs text-slate-400">{post.author?.role || "Contributor"}</p>
                </div>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Quick stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Views</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{post.viewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Comments</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{post._count?.comments ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Published</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{format(new Date(post.publishedAt || post.createdAt), "dd MMM yyyy")}</span>
                </div>
              </div>
            </div>

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <BookOpen className="h-4 w-4 text-emerald-500" /> Related stories
                </h3>
                <div className="space-y-3">
                  {relatedPosts.map((p: any) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className="group block rounded-lg p-2 hover:bg-white dark:hover:bg-slate-900/60 transition-colors">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{p.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.viewCount}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p._count?.comments ?? 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Comments section */}
      <section className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-slate-900 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" /> Discussion
          </h3>
          <div className="text-sm text-slate-400">{commentsQuery.data?.total || 0} comments</div>
        </div>

        {/* Comment input */}
        <div className="mb-4 flex flex-col sm:flex-row items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            rows={3}
          />
          <button
            onClick={() => {
              if (!postId) return;
              if (!comment.trim()) { toast.error("Comment cannot be empty"); return; }
              addComment.mutate({ postId, content: comment.trim() });
            }}
            disabled={addComment.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {addComment.isPending ? "Posting..." : <><Send className="h-4 w-4" /> Post Comment</>}
          </button>
        </div>

        {/* Comments list */}
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4">
              <div className="flex items-center gap-3">
                {c.user?.image ? (
                  <img src={c.user.image} alt={c.user?.name || "User"} className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.user?.name || "Member"}</p>
                  <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
            </div>
          ))}
          {!commentsQuery.data?.comments?.length && !commentsQuery.isLoading && (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-6 text-center">
              <MessageCircle className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>

        {/* Comment pagination */}
        {commentsQuery.data && commentsQuery.data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <div>Page {commentsQuery.data.page} / {commentsQuery.data.totalPages}</div>
            <div className="flex items-center gap-2">
              <button
                disabled={commentsPage <= 1}
                onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                disabled={commentsPage >= (commentsQuery.data?.totalPages || 1)}
                onClick={() => setCommentsPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Next <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
