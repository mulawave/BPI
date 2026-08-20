"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/client/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, MessageCircle, ThumbsDown, ThumbsUp, Loader2 } from "lucide-react";

const premiumCardClass = "rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10";

export default function HelpTopicDetail({ isAdmin = false }: { isAdmin?: boolean }) {
  const params = useParams();
  const slug = params?.slug as string;
  const topicQuery = api.help.getTopicBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const incrementView = api.help.incrementView.useMutation();
  const recordHelpful = api.help.recordHelpful.useMutation();
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const [pendingHelpful, setPendingHelpful] = useState<null | "yes" | "no">(null);

  useEffect(() => {
    if (topicQuery.data?.id) {
      incrementView.mutate({ topicId: topicQuery.data.id });
    }
  }, [topicQuery.data?.id]);

  const topic = topicQuery.data;

  if (topicQuery.isLoading) {
    return (
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <Card className="h-48 animate-pulse bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <Card className="p-6 text-sm text-slate-500 dark:text-slate-400">Topic not found.</Card>
        <Link
          href="/help"
          className="text-sm text-emerald-600 hover:underline mt-3 inline-flex items-center gap-2"
          onClick={() => setPendingLink("/help")}
        >
          {pendingLink === "/help" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
          Back to help
        </Link>
      </div>
    );
  }

  const steps = Array.isArray(topic.steps) ? (topic.steps as string[]) : [];
  const faq = Array.isArray(topic.faq) ? (topic.faq as { question: string; answer: string }[]) : [];

  const handleHelpful = async (helpful: boolean) => {
    setPendingHelpful(helpful ? "yes" : "no");
    try {
      await recordHelpful.mutateAsync({ topicId: topic.id, helpful });
      toast.success("Thanks for the feedback!");
    } catch (error: any) {
      toast.error(error?.message || "Unable to record feedback.");
    } finally {
      setPendingHelpful(null);
    }
  };

  const isAdminOnly =
    topic.category?.slug === "help-center" || topic.tags?.includes("admin-only");

  if (isAdminOnly && !isAdmin) {
    return (
      <div className="px-4 md:px-10 lg:px-16 py-6">
        <Card className="p-6 text-sm text-slate-500 dark:text-slate-400">This article is restricted.</Card>
        <Link
          href="/help"
          className="text-sm text-emerald-600 hover:underline mt-3 inline-flex items-center gap-2"
          onClick={() => setPendingLink("/help")}
        >
          {pendingLink === "/help" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
          Back to help
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-10 lg:px-16 py-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/help"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline"
          onClick={() => setPendingLink("/help")}
        >
          {pendingLink === "/help" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
          Back to help
        </Link>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {topic.category?.name && <Badge variant="outline">{topic.category.name}</Badge>}
          {isAdminOnly && isAdmin && (
            <Badge variant="outline" className="border-amber-300 text-amber-700">Admin eyes only</Badge>
          )}
          <span>Updated {new Date(topic.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <Card className={cn(premiumCardClass, "p-6")}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{topic.title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{topic.summary || "Follow the steps below."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {topic.tags?.map((tag: string) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={cn(premiumCardClass, "lg:col-span-2 p-6")}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Step‑by‑step
          </div>
          <ol className="mt-4 space-y-3 text-sm text-slate-900 dark:text-white">
            {steps.length ? (
              steps.map((step: string, idx: number) => (
                <li key={idx} className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 px-4 py-3 ring-1 ring-amber-300/10">
                  <span className="font-semibold">Step {idx + 1}:</span> {step}
                </li>
              ))
            ) : (
              <li className="text-slate-500 dark:text-slate-400">Steps are being prepared for this topic.</li>
            )}
          </ol>
        </Card>

        <Card className={cn(premiumCardClass, "p-6")}>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <MessageCircle className="h-4 w-4 text-emerald-500" /> Quick FAQ
          </div>
          <div className="mt-4 space-y-3 text-sm">
            {faq.length ? (
              faq.map((item: { question: string; answer: string }, idx: number) => (
                <div key={idx} className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 px-4 py-3 ring-1 ring-amber-300/10">
                  <div className="font-semibold text-slate-900 dark:text-white">{item.question}</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1">{item.answer}</div>
                </div>
              ))
            ) : (
              <div className="text-slate-500 dark:text-slate-400">No FAQ entries yet.</div>
            )}
          </div>
        </Card>
      </div>

      <Card className={cn(premiumCardClass, "p-5 flex flex-wrap items-center justify-between gap-3")}>
        <div className="text-sm text-slate-500 dark:text-slate-400">Was this helpful?</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleHelpful(true)} disabled={pendingHelpful === "yes"}>
            {pendingHelpful === "yes" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />} Yes
          </Button>
          <Button variant="outline" onClick={() => handleHelpful(false)} disabled={pendingHelpful === "no"}>
            {pendingHelpful === "no" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />} No
          </Button>
        </div>
      </Card>
    </div>
  );
}
