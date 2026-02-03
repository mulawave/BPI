"use client";

import { useMemo, useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  BookOpen,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Star,
  UploadCloud,
  ImageDown,
  Tag,
  Layers,
  FileText,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AdminPageGuide from "@/components/admin/AdminPageGuide";

const pill = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold";

type PostItem = {
  id: number;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  featured: boolean;
  categoryId?: number | null;
  category?: { id?: number; name: string; slug?: string } | null;
  _count?: { comments?: number; views?: number };
  viewCount?: number;
  createdAt: string | Date;
  publishedAt?: string | Date | null;
  image?: string | null;
  imageUrl?: string | null;
  imageInternalized?: boolean;
  content?: string;
  excerpt?: string;
  tags?: string;
};

type TopPost = { id: number; title: string; slug: string; viewCount: number };

export default function AdminBlogPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    imageUrl: "",
    image: "",
    status: "PUBLISHED" as "PUBLISHED" | "DRAFT" | "ARCHIVED",
    featured: false,
    categoryId: undefined as number | undefined,
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitProgress, setSubmitProgress] = useState(0);

  const stats = api.adminBlog.getStats.useQuery();
  const categoriesQuery = api.adminBlog.listCategories.useQuery();
  const posts = api.adminBlog.listPosts.useQuery({
    page,
    perPage,
    search: search || undefined,
    status: status as any,
    categoryId,
    featured: featuredOnly ? true : undefined,
  });

  const createPost = api.adminBlog.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post created");
      setShowModal(false);
      posts.refetch();
      setSubmitProgress(100);
    },
    onError: (err) => {
      toast.error(err.message);
      setSubmitProgress(0);
    },
  });

  const updatePost = api.adminBlog.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Post updated");
      setShowModal(false);
      posts.refetch();
      setSubmitProgress(100);
    },
    onError: (err) => {
      toast.error(err.message);
      setSubmitProgress(0);
    },
  });

  const deletePost = api.adminBlog.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      posts.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const internalizeImage = api.adminBlog.internalizeImage.useMutation({
    onSuccess: () => {
      toast.success("Image internalized");
      posts.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadImage = api.adminBlog.uploadImage.useMutation({
    onSuccess: (res) => {
      setForm((f) => ({ ...f, image: res.image }));
      toast.success("Image uploaded");
      setUploadProgress(100);
    },
    onError: (err) => {
      toast.error(err.message);
      setUploadProgress(0);
    },
    onSettled: () => {
      setIsUploadingImage(false);
      setTimeout(() => setUploadProgress(0), 500);
    },
  });

  const createCategory = api.adminBlog.createCategory.useMutation({
    onSuccess: () => {
      setNewCategoryName("");
      categoriesQuery.refetch();
      toast.success("Category added");
    },
    onError: (err) => toast.error(err.message),
  });

  const isSaving = createPost.isPending || updatePost.isPending;

  const editingPost: PostItem | undefined = useMemo(
    () => (posts.data?.posts as PostItem[] | undefined)?.find((p) => p.id === editingId),
    [editingId, posts.data?.posts]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      tags: "",
      imageUrl: "",
      image: "",
      status: "PUBLISHED",
      featured: false,
      categoryId: undefined,
    });
    setShowModal(true);
  };

  const openEdit = (id: number) => {
    const post = (posts.data?.posts as PostItem[] | undefined)?.find((p) => p.id === id);
    if (!post) return;
    setEditingId(id);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content || "",
      excerpt: post.excerpt || "",
      tags: post.tags || "",
      imageUrl: post.imageUrl || "",
      image: post.image || "",
      status: post.status as any,
      featured: post.featured,
      categoryId: post.categoryId || undefined,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitProgress(10);
    const tick = setInterval(() => {
      setSubmitProgress((p) => (p < 90 ? p + 5 : p));
    }, 300);
    if (editingId) {
      updatePost.mutate({ ...form, id: editingId }, { onSettled: () => clearInterval(tick) });
    } else {
      createPost.mutate(form, { onSettled: () => clearInterval(tick) });
    }
  };

  const postsData: PostItem[] = (posts.data?.posts as PostItem[]) || [];
  const viewCountForPost = (p: PostItem) => Math.max(p.viewCount || 0, p._count?.views || 0);
  const fallback = {
    total: postsData.length,
    published: postsData.filter((p: PostItem) => p.status === "PUBLISHED").length,
    drafts: postsData.filter((p: PostItem) => p.status === "DRAFT").length,
    comments: postsData.reduce((acc: number, p: PostItem) => acc + (p._count?.comments || 0), 0),
    viewsTotal: postsData.reduce((acc, p) => acc + viewCountForPost(p), 0),
  };

  const buildFallbackSpark = () => {
    const today = new Date();
    const windowMap = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      windowMap.set(d.toISOString().slice(0, 10), 0);
    }
    postsData.forEach((p: PostItem) => {
      const views = viewCountForPost(p);
      if (!views) return;
      const startDate = p.publishedAt ? new Date(p.publishedAt) : new Date(p.createdAt);
      const windowStart = startDate > new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000) ? startDate : new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000);
      const diffDays = Math.max(0, Math.floor((today.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)));
      const span = Math.min(13, diffDays);
      const days = span + 1;
      const perDay = views / days;
      for (let i = 0; i <= span; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (windowMap.has(key)) {
          windowMap.set(key, (windowMap.get(key) || 0) + perDay);
        }
      }
    });
    return Array.from(windowMap.entries()).map(([date, count]) => ({ date, count: Math.round(count) }));
  };

  const viewSpark = stats.data?.viewsByDay?.length ? stats.data.viewsByDay : buildFallbackSpark();
  const viewSparkMax = viewSpark.length ? Math.max(...viewSpark.map((p) => p.count), 1) : 1;

  const fallbackTopPosts = postsData
    .map((p: PostItem) => ({ id: p.id, title: p.title, slug: p.slug, viewCount: viewCountForPost(p) }))
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const fallbackCategories = (() => {
    const map = new Map<number | null, { name: string; posts: number; views: number }>();
    postsData.forEach((p: PostItem) => {
      const key = p.categoryId ?? null;
      const existing = map.get(key) || { name: p.category?.name || "Uncategorized", posts: 0, views: 0 };
      map.set(key, { name: existing.name, posts: existing.posts + 1, views: existing.views + viewCountForPost(p) });
    });
    const totalViews = Array.from(map.values()).reduce((acc, v) => acc + v.views, 0) || postsData.length || 1;
    return Array.from(map.entries()).map(([categoryId, entry]) => ({
      categoryId,
      name: entry.name,
      posts: entry.posts,
      views: entry.views,
      share: Math.round(((entry.views || entry.posts) / totalViews) * 100),
    }));
  })();

  const metrics = stats.data
    ? {
        ...stats.data,
        viewsByDay: stats.data.viewsByDay?.length ? stats.data.viewsByDay : viewSpark,
        topPosts: stats.data.topPosts?.length ? stats.data.topPosts : fallbackTopPosts,
        categoryBreakdown: stats.data.categoryBreakdown?.length ? stats.data.categoryBreakdown : fallbackCategories,
        views14d: stats.data.views14d ?? (stats.data.viewsByDay?.reduce((acc, v) => acc + v.count, 0) || 0),
      }
    : {
        ...fallback,
        viewsByDay: viewSpark,
        topPosts: fallbackTopPosts,
        categoryBreakdown: fallbackCategories,
        views14d: viewSpark.reduce((acc, v) => acc + v.count, 0),
        readersUnique: 0,
        viewEvents: 0,
      };

  const avgViews = metrics.published ? Math.round((metrics.viewsTotal || 0) / Math.max(1, metrics.published)) : 0;

  const summaryCards = [
    { label: "Total Posts", value: metrics.total ?? "-", icon: FileText, bg: "from-emerald-500 to-emerald-700" },
    { label: "Published", value: metrics.published ?? "-", icon: BookOpen, bg: "from-teal-500 to-cyan-600" },
    { label: "Drafts", value: metrics.drafts ?? "-", icon: Tag, bg: "from-amber-500 to-orange-600" },
    { label: "Total Views", value: metrics.viewsTotal ?? "-", icon: Eye, bg: "from-blue-500 to-indigo-600" },
    { label: "Comments", value: metrics.comments ?? "-", icon: Layers, bg: "from-purple-500 to-fuchsia-600" },
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name required");
      return;
    }
    createCategory.mutate({ name: newCategoryName.trim(), slug: undefined, description: undefined });
  };

  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    setIsUploadingImage(true);
    setUploadProgress(5);
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.min(80, Math.round((e.loaded / e.total) * 80));
        setUploadProgress(pct);
      }
    };
    reader.onload = () => {
      const result = reader.result as string;
      setUploadProgress((p) => Math.max(p, 85));
      uploadImage.mutate({ fileBase64: result, filename: file.name });
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      setUploadProgress(0);
      toast.error("Could not read file");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Admin · Blog</p>
          <h1 className="text-2xl font-bold text-foreground">Blog & News Management</h1>
          <p className="text-sm text-muted-foreground">Moderate posts, comments, and images without touching the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => posts.refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-emerald-500"
          >
            {posts.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>
      </div>

      {/* User Guide */}
      <AdminPageGuide
        title="Blog & News Management Guide"
        sections={[
          {
            title: "Blog Management Overview",
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            items: [
              "Create and manage <strong>blog posts</strong> and <strong>news articles</strong>",
              "<strong>No direct database access needed</strong> - all operations via admin UI",
              "Organize content with <strong>categories</strong> and <strong>tags</strong>",
              "Track <strong>views, comments, and engagement</strong> metrics",
              "<strong>Feature posts</strong> to highlight important content",
              "Support for <strong>draft, published, and archived</strong> statuses"
            ]
          },
          {
            title: "Creating & Publishing Posts",
            icon: <Plus className="w-5 h-5 text-green-600" />,
            type: "ol",
            items: [
              "<strong>Click 'New Post'</strong> - Opens post editor modal",
              "<strong>Enter title</strong> - Auto-generates URL slug (can customize)",
              "<strong>Write content</strong> - Full markdown/HTML support for rich formatting",
              "<strong>Add excerpt</strong> - Short summary for post previews (optional)",
              "<strong>Upload image</strong> - Featured image for post (auto-internalized)",
              "<strong>Select category</strong> - Choose from existing or create new",
              "<strong>Add tags</strong> - Comma-separated keywords for SEO",
              "<strong>Set status</strong> - Draft (private), Published (live), or Archived",
              "<strong>Toggle featured</strong> - Make post appear in featured section"
            ]
          },
          {
            title: "Post Status Types",
            icon: <FileText className="w-5 h-5 text-orange-600" />,
            items: [
              { label: "Published", text: "Live and visible to all users, indexed by search engines" },
              { label: "Draft", text: "Work in progress, only visible to admins" },
              { label: "Archived", text: "Hidden from public but preserved in database" }
            ]
          },
          {
            title: "Category Management",
            icon: <Layers className="w-5 h-5 text-purple-600" />,
            items: [
              "<strong>Create categories</strong> in post editor - auto-generates slug",
              "<strong>Filter posts</strong> by category for easy navigation",
              "Use categories for <strong>content organization</strong> (News, Tutorials, Updates, etc.)",
              "Categories appear in <strong>blog navigation</strong> for users",
              "Each post can belong to <strong>one category</strong>"
            ]
          },
          {
            title: "Image Upload & Internalization",
            icon: <UploadCloud className="w-5 h-5 text-blue-600" />,
            items: [
              "<strong>Upload images</strong> - Click upload button, select file (JPG, PNG, GIF)",
              "<strong>Auto-internalization</strong> - Images stored securely on BPI servers",
              "<strong>Progress tracking</strong> - See upload percentage in real-time",
              "<strong>Image optimization</strong> - Automatic compression for faster loading",
              "Supports <strong>external URLs</strong> - Paste image URL as alternative"
            ]
          },
          {
            title: "Analytics & Engagement",
            icon: <BarChart3 className="w-5 h-5 text-green-600" />,
            items: [
              "<strong>View count</strong> - Total page views for each post",
              "<strong>Comment count</strong> - Number of user comments",
              "<strong>14-day trends</strong> - Engagement graph shows daily views",
              "<strong>Top posts</strong> - Identify most popular content",
              "<strong>Unique readers</strong> - Distinct users who viewed content",
              "Use metrics to <strong>optimize content strategy</strong>"
            ]
          }
        ]}
        features={[
          "Create/edit/delete blog posts",
          "Category & tag management",
          "Featured post highlighting",
          "Image upload & internalization",
          "Draft/published/archived statuses",
          "View & comment analytics",
          "Search & filter posts",
          "SEO-friendly URL slugs"
        ]}
        proTip="For <strong>maximum SEO impact</strong>, use descriptive titles (50-60 characters), add relevant tags, and include <strong>featured images</strong>. Publish <strong>consistently</strong> (2-3 posts/week) to keep audience engaged. Feature your <strong>best-performing posts</strong> to increase visibility."
        warning="<strong>Published posts are immediately visible</strong> to all users and search engines. Always <strong>preview content</strong> before publishing. Deleting posts removes all associated comments and analytics - consider <strong>archiving instead</strong> to preserve data."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl bg-gradient-to-br ${card.bg} p-4 shadow-xl shadow-black/20 border border-white/10 text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/80">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold">{card.value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 border border-white/20">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Snapshots */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-lg xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Engagement</p>
              <h3 className="text-lg font-semibold text-foreground">Views last 14 days</h3>
            </div>
            <span className="text-sm font-semibold text-emerald-600">{metrics.views14d} views</span>
          </div>
          <div className="flex items-end gap-1 sm:gap-2 h-32">
            {metrics.viewsByDay?.map((point, idx) => {
              const height = Math.max(8, (point.count / viewSparkMax) * 100);
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${point.count} views`}
                  />
                  {idx % 3 === 0 && (
                    <span className="text-[10px] text-muted-foreground">{point.date.slice(5)}</span>
                  )}
                </div>
              );
            })}
            {!metrics.viewsByDay?.length && <p className="text-sm text-muted-foreground">No view data</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Snapshot</p>
              <h3 className="text-lg font-semibold text-foreground">Audience & Mix</h3>
            </div>
            <div className="text-xs text-muted-foreground">Avg views/post: <span className="font-semibold text-foreground">{avgViews}</span></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Unique readers</span>
              <span className="font-semibold text-foreground">{metrics.readersUnique ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">View events</span>
              <span className="font-semibold text-foreground">{metrics.viewEvents ?? 0}</span>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Category mix</p>
            {metrics.categoryBreakdown?.length ? (
              <div className="space-y-2">
                {metrics.categoryBreakdown.map((c) => {
                  const pct = c.share ?? Math.round(((c.views || c.posts || 0) / Math.max(1, stats.data?.viewsTotal || stats.data?.total || 0)) * 100);
                  return (
                    <div key={`${c.categoryId ?? "uncat"}`}>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.name}</span>
                        <span className="font-semibold text-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{(c.views || 0).toLocaleString()} views • {c.posts ?? 0} posts</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No category data</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Leaders</p>
              <h3 className="text-lg font-semibold text-foreground">Top Posts by Views</h3>
            </div>
            <span className="text-xs text-muted-foreground">Live data</span>
          </div>
          <div className="space-y-2">
            {metrics.topPosts?.length ? (metrics.topPosts as TopPost[]).map((p, idx) => (
              <div key={p.id} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">{idx + 1}</span>
                    <span className="line-clamp-1">{p.title}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold"><Eye className="h-4 w-4" /> {p.viewCount}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${Math.min(100, (p.viewCount || 0) / Math.max(1, metrics.topPosts[0]?.viewCount || 1) * 100)}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No posts yet</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Demographics</p>
              <h3 className="text-lg font-semibold text-foreground">Status & publication</h3>
            </div>
            <span className="text-xs text-muted-foreground">At a glance</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-xl font-semibold text-foreground">{metrics.published ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Live on site</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-xl font-semibold text-foreground">{metrics.drafts ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Awaiting publish</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Views (sum)</p>
              <p className="text-xl font-semibold text-foreground">{metrics.viewsTotal ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Across all posts</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">View events</p>
              <p className="text-xl font-semibold text-foreground">{metrics.viewEvents ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Recorded interactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background/90 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              placeholder="Search title or content"
              className="w-full rounded-lg border border-border bg-background/60 pl-10 pr-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
          <select
            value={status || ""}
            onChange={(e) => { setStatus(e.target.value ? e.target.value : undefined); setPage(1); }}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
          >
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
            />
            Featured only
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Post</th>
                <th className="px-3 py-2 text-left font-semibold">Category</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Views</th>
                <th className="px-3 py-2 text-left font-semibold">Comments</th>
                <th className="px-3 py-2 text-left font-semibold">Created</th>
                <th className="px-3 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {postsData.map((post: PostItem) => (
                <tr key={post.id} className="hover:bg-background/50">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500/30 to-emerald-700/20">
                        {post.image ? (
                          <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
                        ) : post.imageUrl ? (
                          <img src={post.imageUrl} alt={post.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground line-clamp-1">{post.title}</div>
                        <div className="text-xs text-muted-foreground">{post.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs">{post.category?.name || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`${pill} ${post.status === "PUBLISHED" ? "bg-emerald-500/90 text-white" : "bg-amber-500/80 text-white"}`}>
                      {post.status}
                    </span>
                    {post.featured && <span className={`${pill} bg-cyan-500/90 text-white ml-2`}><Star className="h-3 w-3" /> Featured</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground font-semibold flex items-center gap-1">
                    <Eye className="h-4 w-4 text-emerald-500" /> {post.viewCount}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground font-semibold">{post._count?.comments || 0}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{format(new Date(post.publishedAt || post.createdAt), "dd MMM yyyy")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(post.id)} className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:border-emerald-500">Edit</button>
                      {post.imageUrl && !post.imageInternalized && (
                        <button
                          onClick={() => internalizeImage.mutate({ postId: post.id })}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                        >
                          {internalizeImage.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageDown className="h-3 w-3" />}
                          Internalize
                        </button>
                      )}
                      <button
                        onClick={() => deletePost.mutate({ id: post.id })}
                        className="rounded-lg border border-red-500 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!posts.data?.posts?.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {posts.isLoading ? "Loading posts..." : "No posts found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
          <div>
            Page {posts.data?.page || 1} / {posts.data?.totalPages || 1} · {posts.data?.total || 0} posts
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
              disabled={page >= (posts.data?.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{editingId ? "Edit post" : "Create post"}</p>
                  <h3 className="text-lg font-semibold text-foreground">{editingId ? editingPost?.title : "New blog post"}</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="rounded-lg border border-border px-2 py-1 text-sm text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Slug (optional)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Category</label>
                  <select
                    value={form.categoryId ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Select category</option>
                    {categoriesQuery.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Add category"
                      className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={createCategory.isPending}
                      className="rounded-lg border border-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </button>
                  </div>
                  {!categoriesQuery.data?.length && (
                    <p className="mt-1 text-[11px] text-amber-600">No categories found—add one to tag this post.</p>
                  )}
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Excerpt</label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Content</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                    rows={6}
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">External Image URL (bpichain)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                      placeholder="https://bpichain.africa/blog/..."
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Internal Image (uploaded path)</label>
                  <input
                    value={form.image}
                    onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                    placeholder="/uploads/blog/hero.jpg"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground cursor-pointer hover:border-emerald-500">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadFile(file);
                          e.target.value = "";
                        }}
                      />
                      <UploadCloud className="h-4 w-4" />
                      {isUploadingImage || uploadImage.isPending ? `Uploading ${uploadProgress}%` : "Upload"}
                    </label>
                    {form.image && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{form.image}</span>
                    )}
                  </div>
                  {(isUploadingImage || uploadProgress > 0) && (
                    <div className="mt-2 h-2 w-full rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">Uploads store to /public/uploads/blog (max 5MB).</p>
                </div>
                <div className="col-span-1 flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-foreground">Mark as featured</span>
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                {submitProgress > 0 && (
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={submitProgress}>
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.min(submitProgress, 100)}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">Saving… {Math.min(submitProgress, 100)}%</p>
                  </div>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-emerald-500"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                  type="button"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
