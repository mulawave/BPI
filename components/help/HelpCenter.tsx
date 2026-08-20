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
import {
  Search, MessageCircle, BookOpen, ArrowRight, LifeBuoy, Loader2,
  Send, Sparkles, GraduationCap, Wallet, Store, Shield, Trophy,
  Users, Newspaper, Calculator, ChevronRight, Mail, X,
} from "lucide-react";

const pillClass = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";

const premiumCardClass = "rounded-2xl border border-amber-300/30 dark:border-amber-400/15 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-md dark:shadow-emerald-950/20 ring-1 ring-amber-300/10";

// ── RAVEN Knowledge Base ───────────────────────────────────────
const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  response: string;
  links?: { label: string; href: string }[];
}> = [
  {
    keywords: ["dashboard", "home", "overview", "portfolio"],
    response: "Your Dashboard is the central hub showing your Total Portfolio Value, wallet balances, BPI tokens, membership license, and rewards. You can Deposit, Withdraw, Transfer, manage Auto-Debit settings, and upgrade your membership from here.",
    links: [{ label: "Go to Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["wallet", "deposit", "withdraw", "transfer", "balance", "fund"],
    response: "Your Wallet supports deposits via multiple payment gateways, withdrawals (including USDT), and transfers between BPI users. You can access these from the Dashboard's Total Portfolio card. Auto-Debit settings are available at /wallet/settings for scheduled payments.",
    links: [{ label: "Wallet Settings", href: "/wallet/settings" }, { label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["store", "shop", "buy", "product", "cart", "checkout", "purchase", "order"],
    response: "The BPI Superstore lets you purchase products using fiat, crypto, or hybrid checkout. Browse products, add to cart, and checkout with your preferred payment method. You can also track orders and verify pickups.",
    links: [{ label: "Visit Store", href: "/store" }, { label: "My Orders", href: "/store/orders" }],
  },
  {
    keywords: ["csp", "community", "support", "program", "palliative"],
    response: "The Community Support Program (CSP) provides structured community assistance, palliative activations, and empowerment initiatives. You can check your CSP eligibility and status from the CSP page.",
    links: [{ label: "CSP Page", href: "/csp" }],
  },
  {
    keywords: ["blog", "news", "article", "magazine", "update"],
    response: "The BPI Blog features articles, news, and updates about the platform. You can browse the magazine and read individual posts.",
    links: [{ label: "Read Blog", href: "/blog" }],
  },
  {
    keywords: ["kyc", "verify", "verification", "identity", "document"],
    response: "KYC (Know Your Customer) verification is required to unlock full platform access. You'll need to provide personal info, address, a government-issued ID, and a selfie. Verification typically takes 24-48 hours.",
    links: [{ label: "Start KYC", href: "/kyc" }],
  },
  {
    keywords: ["membership", "tier", "upgrade", "elite", "club", "package"],
    response: "Membership tiers unlock exclusive benefits and higher earning potential. Visit the Elite Club to explore available tiers and upgrade your membership.",
    links: [{ label: "Elite Club", href: "/elite-club" }],
  },
  {
    keywords: ["empowerment", "empower", "program"],
    response: "The Empowerment program provides tools and resources for personal and financial growth. Explore available empowerment initiatives on the Empowerment page.",
    links: [{ label: "Empowerment", href: "/empowerment" }],
  },
  {
    keywords: ["techquiz", "quiz", "cbt", "exam", "school", "test"],
    response: "TechQuiz offers computer-based testing (CBT) and quiz competitions for schools and individuals. You can participate in quizzes, view results, and schools can administer exams.",
    links: [{ label: "TechQuiz", href: "/techquiz" }],
  },
  {
    keywords: ["settings", "profile", "account", "password", "2fa", "security"],
    response: "Account Settings lets you manage your profile, change your password, enable two-factor authentication (2FA), and configure security preferences.",
    links: [{ label: "Account Settings", href: "/settings" }],
  },
  {
    keywords: ["claim", "code", "pickup", "verify"],
    response: "After placing an order in the store, you'll receive a claim code. Use it to verify pickup at designated pickup centers. Go to Pickup Verify and enter your claim code to confirm collection.",
    links: [{ label: "Verify Pickup", href: "/store/pickup-verify" }, { label: "Pickup Centers", href: "/store/pickup-centers" }],
  },
  {
    keywords: ["referral", "refer", "invite", "downline", "team"],
    response: "You can refer others to BPI using your referral link. Track your referrals, downline activity, and team growth from the Dashboard's community section.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["token", "bpt", "coin", "crypto"],
    response: "BPI Token (BPT) is the platform's native token. You can use it for store purchases, staking, and other platform activities. Your BPT balance is shown on the Dashboard.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["reward", "cashback", "rebate", "bonus"],
    response: "Rewards include cashback, educational credits, and bonuses earned through platform activity. Your rewards balance is displayed on the Dashboard and can be used in the store.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["learn", "learning", "education", "guide", "tutorial", "training"],
    response: "The Learning Center provides structured guides and tutorials to help you get the most out of BPI. Topics include getting started, wallet management, store usage, CSP, and advanced features.",
    links: [{ label: "Learning Center", href: "/learning" }],
  },
];

const QUICK_TOPICS = [
  { label: "How to deposit funds", keywords: "deposit wallet fund" },
  { label: "Store checkout process", keywords: "store checkout cart" },
  { label: "KYC verification", keywords: "kyc verify identity" },
  { label: "Membership upgrade", keywords: "membership upgrade elite" },
  { label: "Claim code & pickup", keywords: "claim code pickup verify" },
  { label: "CSP eligibility", keywords: "csp community support" },
];

function searchKnowledgeBase(query: string): typeof KNOWLEDGE_BASE {
  const normalized = query.toLowerCase().replace(/[!?.,]/g, "").trim();
  const words = normalized.split(/\s+/);
  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) score += 3;
      for (const word of words) {
        if (kw.includes(word) && word.length > 2) score += 1;
      }
    }
    return { entry, score };
  }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry);
}

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
      const kbResults = searchKnowledgeBase(prompt);
      const result = await chatSearchQuery.refetch();
      const matches = result.data?.topics ?? [];

      if (kbResults.length > 0) {
        const top = kbResults[0];
        setMessages((prev) => [...prev, {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: top.response,
          topics: top.links?.map(l => ({ title: l.label, slug: l.href })),
        }]);
        setIsTyping(false);
        setPendingAction(null);
        return;
      }

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
      <div className="rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#04231a] via-[#0a3d2b] to-[#062818] bg-[radial-gradient(ellipse_at_top_left,rgba(255,215,140,0.10),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)] text-white p-6 shadow-2xl ring-1 ring-amber-300/20">
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
        <Card className={cn(premiumCardClass, "lg:col-span-2 p-5")}>
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
                  <Card className="p-4 h-full border-amber-300/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 hover:border-emerald-500/50 hover:shadow-lg transition ring-1 ring-amber-300/10">
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
          <Card className={cn(premiumCardClass, "p-5")}>
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

          <Card className={cn(premiumCardClass, "p-5")}>
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

          <Card className={cn(premiumCardClass, "p-5")}>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <LifeBuoy className="h-4 w-4 text-emerald-500" /> Need more help?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              If you can’t find an answer, contact support with your email and a short description.
            </p>
            <Link href="mailto:support@bpi.com?subject=BPI%20Support%20Request" className="block mt-3">
              <Button
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <Mail className="h-4 w-4" /> Contact Support
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      <Card className={cn(premiumCardClass, "p-5")}>
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
            <div key={tip} className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 px-3 py-3 text-sm text-foreground ring-1 ring-amber-300/10">
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
