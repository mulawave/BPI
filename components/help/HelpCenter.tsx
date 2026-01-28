"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/client/trpc";
import type { AppRouter } from "@/server/trpc/router/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { AiOutlineRobot } from "react-icons/ai";
import { Search, MessageCircle, BookOpen, ArrowRight, LifeBuoy, Loader2 } from "lucide-react";

const pillClass = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";

type HelpRouterOutputs = inferRouterOutputs<AppRouter>["help"];
type HelpCategory = HelpRouterOutputs["listCategories"][number];
type HelpTopic = HelpRouterOutputs["listTopics"]["topics"][number];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  topics?: { title: string; slug: string }[];
};

const chatHistoryKey = "bpi:helpChatHistory";
const learningPathKey = "bpi:helpLearningPath";
const feedbackKey = "bpi:helpChatFeedback";

const greetingSet = new Set([
  "hi",
  "hey",
  "yo",
  "what's up",
  "whats up",
  "howdy",
  "hello",
]);

const normalizeInput = (value: string) =>
  value
    .toLowerCase()
    .replace(/[!?.,]/g, "")
    .trim();

export default function HelpCenter({ isAdmin = false }: { isAdmin?: boolean }) {
  const [search, setSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I’m RAVEN, Your personal help, support and assistant AI. Ask about dashboard, store, CSP, blog, or account settings and i will tell you anything you need to know to guarantee a superb user experience on BPI",
    },
  ]);

  const userDetailsQuery = api.user.getDetails.useQuery(undefined, { refetchOnWindowFocus: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(chatHistoryKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {
        localStorage.removeItem(chatHistoryKey);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
  }, [messages]);

  const userName = userDetailsQuery.data?.name;

  useEffect(() => {
    if (!userName) return;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === "welcome"
          ? {
              ...msg,
              text: `Hi${userName ? ` ${userName}` : ""}! I’m RAVEN, Your personal help, support and assistant AI. Ask about dashboard, store, CSP, blog, or account settings and i will tell you anything you need to know to guarantee a superb user experience on BPI`,
            }
          : msg
      )
    );
  }, [userName]);

  const categoriesQuery = api.help.listCategories.useQuery();
  const topicsQuery = api.help.listTopics.useQuery({
    search: search || undefined,
    categorySlug,
    page,
    pageSize: 9,
  });

  const chatSearchQuery = api.help.listTopics.useQuery(
    { search: chatInput || undefined, page: 1, pageSize: 5 },
    { enabled: false }
  );

  const categories = categoriesQuery.data ?? [];
  const topics = topicsQuery.data?.topics ?? [];

  const isAdminOnlyTopic = (topic: HelpTopic) =>
    topic.category?.slug === "help-center" || topic.tags?.includes("admin-only");

  const visibleTopics = useMemo(
    () => topics.filter((topic: HelpTopic) => (isAdmin ? true : !isAdminOnlyTopic(topic))),
    [topics, isAdmin]
  );

  const featuredTopics = useMemo(() => visibleTopics.slice(0, 3), [visibleTopics]);

  const handleAsk = async () => {
    const prompt = chatInput.trim();
    if (!prompt) {
      toast.error("Type a question first.");
      return;
    }

    setPendingAction("ask");

    const normalized = normalizeInput(prompt);
    if (greetingSet.has(normalized)) {
      setIsTyping(true);
      const greetingResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: `Hello${userDetailsQuery.data?.name ? ` ${userDetailsQuery.data.name}` : ""}! I’m RAVEN. Tell me what you need help with, and I’ll guide you step‑by‑step.`,
      };
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: prompt,
      };
      setMessages((prev) => [...prev, userMessage]);
      setChatInput("");
      setTimeout(() => {
        setMessages((prev) => [...prev, greetingResponse]);
        setIsTyping(false);
      }, 650);
      setPendingAction(null);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 650));
      const result = await chatSearchQuery.refetch();
      const matches = result.data?.topics ?? [];

      if (!matches.length) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: "I couldn’t find an exact match. Try keywords like ‘claim code’, ‘checkout’, ‘PIN’, or ‘CSP eligibility’.",
          },
        ]);
        setIsTyping(false);
        setPendingAction(null);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: "Here are the closest help topics:",
          topics: (matches as HelpTopic[]).map((t: HelpTopic) => ({ title: t.title, slug: t.slug })),
        },
      ]);
      setIsTyping(false);
      setPendingAction(null);

      if (typeof window !== "undefined") {
        const path = JSON.parse(localStorage.getItem(learningPathKey) || "[]") as Array<{ query: string; matched: string[]; ts: number }>;
        const entry = {
          query: prompt,
          matched: (matches as HelpTopic[]).map((t: HelpTopic) => t.slug),
          ts: Date.now(),
        };
        localStorage.setItem(learningPathKey, JSON.stringify([...path, entry].slice(-50)));
      }
    } catch (error: any) {
      toast.error(error?.message || "Unable to search help topics.");
      setIsTyping(false);
      setPendingAction(null);
    } finally {
      setChatInput("");
    }
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!pendingLink) return;
    const id = setTimeout(() => setPendingLink(null), 4000);
    return () => clearTimeout(id);
  }, [pendingLink]);

  return (
    <div className="space-y-8 px-4 md:px-10 lg:px-16 py-6">
      <div className="rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <AiOutlineRobot className="h-4 w-4" /> Smart Help
            </div>
            <h1 className="mt-3 text-3xl font-bold">Help & Support Center</h1>
            <p className="text-sm text-white/80 max-w-3xl">
              Find answers, follow step‑by‑step guides, and get instant help from the Smart Help assistant.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs">
            <div className="font-semibold">Quick tip</div>
            <div className="text-white/80">Search by feature name or action (e.g., “confirm pickup”).</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5 shadow-lg bg-white/90 dark:bg-bpi-dark-card/80 border-border/60">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder="Search help topics"
                className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                setPendingAction("refresh");
                await topicsQuery.refetch();
                setPendingAction(null);
              }}
              disabled={pendingAction === "refresh"}
            >
              {pendingAction === "refresh" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => {
                setPendingAction("category:all");
                setCategorySlug(undefined);
                setPage(1);
                setTimeout(() => setPendingAction(null), 300);
              }}
              className={cn(pillClass, !categorySlug ? "bg-emerald-600 text-white" : "bg-muted text-foreground")}
            >
              {pendingAction === "category:all" ? <Loader2 className="h-3 w-3 animate-spin" /> : "All Topics"}
            </button>
            {categories
              .filter((cat: HelpCategory) => (isAdmin ? true : cat.slug !== "help-center"))
              .map((cat: HelpCategory) => (
              <button
                key={cat.id}
                onClick={() => {
                  setPendingAction(`category:${cat.slug}`);
                  setCategorySlug(cat.slug);
                  setPage(1);
                  setTimeout(() => setPendingAction(null), 300);
                }}
                className={cn(
                  pillClass,
                  categorySlug === cat.slug ? "bg-emerald-600 text-white" : "bg-muted text-foreground"
                )}
              >
                {pendingAction === `category:${cat.slug}` ? <Loader2 className="h-3 w-3 animate-spin" /> : cat.name}
                <Badge variant="outline" className="text-[10px] ml-1">{cat.topicCount}</Badge>
              </button>
            ))}
          </div>

          {topicsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, idx: number) => (
                <Card key={idx} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : visibleTopics.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">No help topics found.</Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleTopics.map((topic: HelpTopic) => (
                <Link key={topic.id} href={`/help/${topic.slug}`} onClick={() => setPendingLink(`/help/${topic.slug}`)}>
                  <Card className="p-4 h-full border-border/60 bg-background/70 hover:border-emerald-500/50 hover:shadow-lg transition">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground line-clamp-2">{topic.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{topic.summary || "Open for step‑by‑step guidance."}</div>
                      </div>
                      {pendingLink === `/help/${topic.slug}` ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase text-muted-foreground">
                      {topic.category?.name && <span className="rounded-full bg-muted px-2 py-1">{topic.category.name}</span>}
                      {isAdminOnlyTopic(topic) && isAdmin && (
                        <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-1">Admin eyes only</span>
                      )}
                      {topic.tags?.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-1">{tag}</span>
                      ))}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Page {topicsQuery.data?.page || 1} / {topicsQuery.data?.totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || pendingAction === "prev"}
                onClick={() => {
                  setPendingAction("prev");
                  setPage((p) => Math.max(1, p - 1));
                  setTimeout(() => setPendingAction(null), 300);
                }}
              >
                {pendingAction === "prev" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Prev"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (topicsQuery.data?.totalPages || 1) || pendingAction === "next"}
                onClick={() => {
                  setPendingAction("next");
                  setPage((p) => p + 1);
                  setTimeout(() => setPendingAction(null), 300);
                }}
              >
                {pendingAction === "next" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 border-border/60 bg-white/90 dark:bg-bpi-dark-card/80 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <AiOutlineRobot className="h-5 w-5 text-emerald-500" /> RAVEN Personal Assistant
              </div>
              <div className="mt-3 space-y-3 max-h-[280px] overflow-y-auto" ref={chatContainerRef}>
                {messages.map((msg: ChatMessage) => (
                  <div key={msg.id} className={cn("rounded-xl px-3 py-2 text-sm", msg.role === "assistant" ? "bg-emerald-50/70 dark:bg-emerald-900/20" : "bg-muted")}
                  >
                    <p className="text-foreground">{msg.text}</p>
                    {msg.topics && msg.topics.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.topics.map((topic: { title: string; slug: string }) => (
                          <Link
                            key={topic.slug}
                            href={`/help/${topic.slug}`}
                            className="block text-xs text-emerald-600 hover:underline"
                            onClick={() => {
                              setPendingLink(`/help/${topic.slug}`);
                              if (typeof window === "undefined") return;
                              const path = JSON.parse(localStorage.getItem(learningPathKey) || "[]") as Array<{ query: string; matched: string[]; ts: number }>;
                              const entry = { query: `clicked:${topic.slug}`, matched: [topic.slug], ts: Date.now() };
                              localStorage.setItem(learningPathKey, JSON.stringify([...path, entry].slice(-50)));
                            }}
                          >
                            <span className="inline-flex items-center gap-2">
                              {topic.title}
                              {pendingLink === `/help/${topic.slug}` && <Loader2 className="h-3 w-3 animate-spin" />}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {msg.role === "assistant" && msg.id !== "welcome" && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Was this helpful?</span>
                        <button
                          className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
                          onClick={() => {
                            setPendingAction(`feedback:${msg.id}:yes`);
                            if (typeof window === "undefined") return;
                            const feedback = JSON.parse(localStorage.getItem(feedbackKey) || "[]") as Array<{ id: string; helpful: boolean; ts: number }>;
                            localStorage.setItem(feedbackKey, JSON.stringify([...feedback, { id: msg.id, helpful: true, ts: Date.now() }].slice(-100)));
                            toast.success("Thanks for the feedback!");
                            setTimeout(() => setPendingAction(null), 300);
                          }}
                          disabled={pendingAction === `feedback:${msg.id}:yes`}
                        >
                          {pendingAction === `feedback:${msg.id}:yes` ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                        </button>
                        <button
                          className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
                          onClick={() => {
                            setPendingAction(`feedback:${msg.id}:no`);
                            if (typeof window === "undefined") return;
                            const feedback = JSON.parse(localStorage.getItem(feedbackKey) || "[]") as Array<{ id: string; helpful: boolean; ts: number }>;
                            localStorage.setItem(feedbackKey, JSON.stringify([...feedback, { id: msg.id, helpful: false, ts: Date.now() }].slice(-100)));
                            toast.success("Thanks for the feedback!");
                            setTimeout(() => setPendingAction(null), 300);
                          }}
                          disabled={pendingAction === `feedback:${msg.id}:no`}
                        >
                          {pendingAction === `feedback:${msg.id}:no` ? <Loader2 className="h-3 w-3 animate-spin" /> : "No"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="rounded-xl px-3 py-2 text-sm bg-emerald-50/70 dark:bg-emerald-900/20">
                    <em className="text-muted-foreground">RAVEN is typing...</em>
                  </div>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask RAVEN"
                  className="flex-1 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                />
                <Button onClick={handleAsk} disabled={isTyping || pendingAction === "ask"}>
                  {isTyping || pendingAction === "ask" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
                </Button>
              </div>
            </Card>

          <Card className="p-5 border-border/60 bg-white/90 dark:bg-bpi-dark-card/80 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-emerald-500" /> Featured Help
            </div>
            <div className="mt-3 space-y-2">
              {featuredTopics.length ? (
                featuredTopics.map((topic: HelpTopic) => (
                  <Link
                    key={topic.id}
                    href={`/help/${topic.slug}`}
                    className="block rounded-lg border border-border/60 px-3 py-2 text-sm hover:border-emerald-500"
                    onClick={() => setPendingLink(`/help/${topic.slug}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{topic.title}</span>
                      {pendingLink === `/help/${topic.slug}` && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No featured topics yet.</p>
              )}
            </div>
          </Card>

          <Card className="p-5 border-border/60 bg-white/90 dark:bg-bpi-dark-card/80 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <LifeBuoy className="h-4 w-4 text-emerald-500" /> Need more help?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              If you can’t find an answer, contact support with your email and a short description.
            </p>
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => {
                setPendingAction("contact");
                setTimeout(() => setPendingAction(null), 600);
              }}
              disabled={pendingAction === "contact"}
            >
              {pendingAction === "contact" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Contact Support"}
            </Button>
          </Card>
        </div>
      </div>

      <Card className="p-5 border-border/60 bg-white/90 dark:bg-bpi-dark-card/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Quick tips</div>
            <p className="text-xs text-muted-foreground">Popular tasks that users ask about most often.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Confirm pickup",
            "Find claim code",
            "Enable 2FA",
            "CSP eligibility",
          ].map((tip: string) => (
            <div key={tip} className="rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-sm text-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                {tip}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
