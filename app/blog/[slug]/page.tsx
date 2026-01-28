"use client";

import { useEffect, useState } from "react";
import { api } from "@/client/trpc";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BookOpen, Calendar, ChevronLeft, Eye, MessageCircle, Send, User } from "lucide-react";
import toast from "react-hot-toast";

type CommentItem = {
  id: number;
  content: string;
  createdAt: string | Date;
  user?: { id: string; name: string | null; image: string | null; role?: string | null };
};

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [comment, setComment] = useState("");
  const [commentsPage, setCommentsPage] = useState(1);

  const postQuery = api.blog.getPostBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const postId = postQuery.data?.id;

  const commentsQuery = api.blog.getComments.useQuery({ postId: postId || 0, page: commentsPage }, { enabled: Boolean(postId) });

  const addComment = api.blog.addComment.useMutation({
    onSuccess: () => {
      toast.success("Comment added");
      setComment("");
      commentsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const incrementView = api.blog.incrementView.useMutation();

  useEffect(() => {
    if (postId) {
      incrementView.mutate({ postId });
    }
  }, [postId]);

  if (postQuery.isLoading) {
    return <div className="p-6">Loading post...</div>;
  }

  const post = postQuery.data;
  if (!post) {
    return <div className="p-6 text-muted-foreground">Post not found.</div>;
  }

  const comments = (commentsQuery.data?.comments ?? []) as CommentItem[];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/blog" className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-emerald-500">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to blog
        </Link>
      </div>

      <article className="overflow-hidden rounded-3xl border border-border bg-background/90 shadow-xl">
        <div className="relative h-[260px] sm:h-[420px] w-full">
          <img
            src={post.image || post.imageUrl || "/img/blog-placeholder.jpg"}
            alt={post.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
              {post.category && (
                <span className="rounded-full bg-white/20 px-3 py-1 font-semibold backdrop-blur">
                  {post.category.name}
                </span>
              )}
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), { addSuffix: true })}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <Eye className="h-4 w-4" /> {post.viewCount}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur inline-flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> {post._count?.comments ?? 0}
              </span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight drop-shadow-xl">{post.title}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-white/80">
              {post.author?.image ? (
                <img src={post.author.image} alt={post.author?.name || "Author"} className="h-10 w-10 rounded-full border border-white/40 object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10">
                  <User className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-semibold">{post.author?.name || "BPI Team"}</p>
                <p className="text-xs uppercase tracking-wide">{post.author?.role || "Contributor"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="prose prose-emerald max-w-none text-foreground lg:col-span-2">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          <div className="rounded-2xl border border-border bg-background/70 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-emerald-500" /> About the author
            </h3>
            <p className="text-sm text-muted-foreground">{post.author?.name || "BPI Team"}</p>
            <div className="mt-3 h-px bg-border" />
            <h4 className="mt-3 text-sm font-semibold text-foreground">Quick stats</h4>
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between"><span>Views</span><span className="font-semibold text-foreground">{post.viewCount}</span></div>
              <div className="flex items-center justify-between"><span>Comments</span><span className="font-semibold text-foreground">{post._count?.comments ?? 0}</span></div>
              <div className="flex items-center justify-between"><span>Published</span><span className="font-semibold text-foreground">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
        </div>
      </article>

      {/* Comments */}
      <section className="rounded-3xl border border-border bg-background/90 p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Discussion</h3>
          <div className="text-sm text-muted-foreground">{commentsQuery.data?.total || 0} comments</div>
        </div>

        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts"
            className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            rows={3}
          />
          <button
            onClick={() => {
              if (!postId) return;
              if (!comment.trim()) {
                toast.error("Comment cannot be empty");
                return;
              }
              addComment.mutate({ postId, content: comment.trim() });
            }}
            disabled={addComment.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
          >
            {addComment.isPending ? "Posting..." : <><Send className="h-4 w-4" /> Post</>}
          </button>
        </div>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-background/60 p-4">
              <div className="flex items-center gap-3">
                {c.user?.image ? (
                  <img src={c.user.image} alt={c.user?.name || "User"} className="h-9 w-9 rounded-full border border-border object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.user?.name || "Member"}</p>
                  <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground leading-relaxed">{c.content}</p>
            </div>
          ))}
          {!commentsQuery.data?.comments?.length && (
            <div className="rounded-xl border border-dashed border-border bg-background/50 p-4 text-center text-sm text-muted-foreground">No comments yet.</div>
          )}
        </div>

        {commentsQuery.data && commentsQuery.data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Page {commentsQuery.data.page} / {commentsQuery.data.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={commentsPage <= 1}
                onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={commentsPage >= (commentsQuery.data?.totalPages || 1)}
                onClick={() => setCommentsPage((p) => p + 1)}
                className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
