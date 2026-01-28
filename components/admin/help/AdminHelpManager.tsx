"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/client/trpc";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/Modal";
import toast from "react-hot-toast";
import { AiOutlineRobot } from "react-icons/ai";
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";

type AdminRouterOutputs = inferRouterOutputs<AppRouter>["admin"];
type HelpCategory = AdminRouterOutputs["helpListCategories"][number];
type HelpTopic = AdminRouterOutputs["helpListTopics"]["topics"][number];

const parseSteps = (value: string) =>
  value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const parseFaq = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, answer] = line.split("|").map((s) => s.trim());
      return { question: question || "", answer: answer || "" };
    })
    .filter((row) => row.question && row.answer);

export default function AdminHelpManager() {
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    description: "",
    order: 0,
    isActive: true,
  });

  const [topicForm, setTopicForm] = useState({
    categoryId: "",
    title: "",
    slug: "",
    summary: "",
    tags: "",
    steps: "",
    faq: "",
    isPublished: false,
  });

  const categoriesQuery = api.admin.helpListCategories.useQuery();
  const topicsQuery = api.admin.helpListTopics.useQuery({
    search: search || undefined,
    categoryId: selectedCategoryId || undefined,
    page: 1,
    pageSize: 50,
  });

  const topicDetailsQuery = api.admin.helpGetTopic.useQuery(
    { id: editingTopicId || "" },
    { enabled: Boolean(editingTopicId) }
  );

  const createCategory = api.admin.helpCreateCategory.useMutation();
  const updateCategory = api.admin.helpUpdateCategory.useMutation();
  const deleteCategory = api.admin.helpDeleteCategory.useMutation();
  const createTopic = api.admin.helpCreateTopic.useMutation();
  const updateTopic = api.admin.helpUpdateTopic.useMutation();
  const togglePublish = api.admin.helpTogglePublish.useMutation();

  const categories = (categoriesQuery.data ?? []) as HelpCategory[];
  const topics = (topicsQuery.data?.topics ?? []) as HelpTopic[];

  const handleCategorySubmit = async () => {
    const payload = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim(),
      description: categoryForm.description.trim() || undefined,
      order: Number(categoryForm.order) || 0,
      isActive: categoryForm.isActive,
    };

    if (!payload.name || !payload.slug) {
      toast.error("Category name and slug are required.");
      return;
    }

    try {
      if (editingCategoryId) {
        await updateCategory.mutateAsync({ id: editingCategoryId, ...payload });
        toast.success("Category updated.");
      } else {
        await createCategory.mutateAsync(payload);
        toast.success("Category created.");
      }
      setCategoryModalOpen(false);
      setEditingCategoryId(null);
      setCategoryForm({ name: "", slug: "", description: "", order: 0, isActive: true });
      categoriesQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save category.");
    }
  };

  const handleTopicSubmit = async () => {
    const payload = {
      categoryId: topicForm.categoryId || undefined,
      title: topicForm.title.trim(),
      slug: topicForm.slug.trim(),
      summary: topicForm.summary.trim() || undefined,
      tags: topicForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      steps: parseSteps(topicForm.steps),
      faq: parseFaq(topicForm.faq),
      isPublished: topicForm.isPublished,
    };

    if (!payload.title || !payload.slug) {
      toast.error("Topic title and slug are required.");
      return;
    }

    try {
      if (editingTopicId) {
        await updateTopic.mutateAsync({ id: editingTopicId, ...payload });
        toast.success("Topic updated.");
      } else {
        await createTopic.mutateAsync(payload);
        toast.success("Topic created.");
      }
      setTopicModalOpen(false);
      setEditingTopicId(null);
      setTopicForm({ categoryId: "", title: "", slug: "", summary: "", tags: "", steps: "", faq: "", isPublished: false });
      topicsQuery.refetch();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save topic.");
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      order: category.order || 0,
      isActive: category.isActive,
    });
    setCategoryModalOpen(true);
  };

  const openEditTopic = (topic: any) => {
    setEditingTopicId(topic.id);
    setTopicModalOpen(true);
  };

  useEffect(() => {
    if (!topicDetailsQuery.data) return;
    const detail = topicDetailsQuery.data as any;
    setTopicForm({
      categoryId: detail.categoryId || "",
      title: detail.title || "",
      slug: detail.slug || "",
      summary: detail.summary || "",
      tags: (detail.tags || []).join(", "),
      steps: Array.isArray(detail.steps) ? detail.steps.join("\n") : "",
      faq: Array.isArray(detail.faq) ? detail.faq.map((f: any) => `${f.question} | ${f.answer}`).join("\n") : "",
      isPublished: detail.isPublished || false,
    });
  }, [topicDetailsQuery.data]);

  const stats = useMemo(() => {
    const total = topics.length;
    const published = topics.filter((t: any) => t.isPublished).length;
    const drafts = total - published;
    return { total, published, drafts };
  }, [topics]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 text-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <AiOutlineRobot className="h-4 w-4" /> Smart Help Admin
            </div>
            <h1 className="mt-3 text-3xl font-bold">Help Center Management</h1>
            <p className="text-sm text-white/80 max-w-3xl">Create categories, publish topics, and update guidance for new features.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Total {stats.total}</Badge>
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Published {stats.published}</Badge>
            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">Drafts {stats.drafts}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4 p-5 bg-white/90 dark:bg-bpi-dark-card/80 border-border/60 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-foreground">Categories</div>
            <Button size="sm" onClick={() => setCategoryModalOpen(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {categories.map((cat: HelpCategory) => (
              <div key={cat.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2">
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="text-left"
                >
                  <div className="text-sm font-semibold text-foreground">{cat.name}</div>
                  <div className="text-[11px] text-muted-foreground">/{cat.slug}</div>
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{cat.isActive ? "active" : "inactive"}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => openEditCategory(cat)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <div className="text-xs text-muted-foreground">No categories yet.</div>}
          </div>
        </Card>

        <Card className="lg:col-span-8 p-5 bg-white/90 dark:bg-bpi-dark-card/80 border-border/60 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics"
                className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-3 py-2 text-sm"
              />
            </div>
            <Button onClick={() => setTopicModalOpen(true)}>
              <Plus className="h-4 w-4" /> New Topic
            </Button>
          </div>

          <div className="space-y-3">
            {topics.map((topic: any) => (
              <div key={topic.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{topic.title}</div>
                    <div className="text-xs text-muted-foreground">/{topic.slug}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {topic.category?.name && <Badge variant="outline">{topic.category.name}</Badge>}
                      <Badge variant="outline" className="text-[10px]">{topic.isPublished ? "published" : "draft"}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditTopic(topic)}>
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublish.mutate({ id: topic.id, isPublished: !topic.isPublished })}
                    >
                      {topic.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {topics.length === 0 && <div className="text-xs text-muted-foreground">No topics found.</div>}
          </div>
        </Card>
      </div>

      <Modal isOpen={categoryModalOpen} title={editingCategoryId ? "Edit Category" : "New Category"} onClose={() => { setCategoryModalOpen(false); setEditingCategoryId(null); }} maxWidth="lg">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Name</label>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Slug</label>
              <input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Order</label>
              <input
                type="number"
                value={categoryForm.order}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setCategoryModalOpen(false); setEditingCategoryId(null); }}>Cancel</Button>
            <Button onClick={handleCategorySubmit}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={topicModalOpen} title={editingTopicId ? "Edit Topic" : "New Topic"} onClose={() => { setTopicModalOpen(false); setEditingTopicId(null); }} maxWidth="xl">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Title</label>
              <input
                value={topicForm.title}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Slug</label>
              <input
                value={topicForm.slug}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, slug: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Category</label>
              <select
                value={topicForm.categoryId}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat: HelpCategory) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Tags (comma separated)</label>
              <input
                value={topicForm.tags}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Summary</label>
            <textarea
              value={topicForm.summary}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, summary: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">Steps (one per line)</label>
              <textarea
                value={topicForm.steps}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, steps: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={6}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">FAQ (one per line, “Question | Answer”)</label>
              <textarea
                value={topicForm.faq}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, faq: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={6}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={topicForm.isPublished}
              onChange={(e) => setTopicForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
            />
            <span className="text-sm text-muted-foreground">Publish immediately</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setTopicModalOpen(false); setEditingTopicId(null); }}>Cancel</Button>
            <Button onClick={handleTopicSubmit}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
