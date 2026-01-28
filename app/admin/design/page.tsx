"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/client/trpc";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Loader2, Save, Upload, RefreshCw, FileText, Plus, Sparkles } from "lucide-react";

const defaultTermsBody = `BPI MEMBERSHIP TERMS OF SERVICE &\nMEMORANDUM OF UNDERSTANDING (MoU)\nThese Terms of Service ("Agreement") constitute a binding understanding between BeepAgro Africa Ltd ("BeepAgro Africa", "BPI", "the Company") and the subscribing individual ("Member").\nBy registering on the BPI portal and subscribing to any BPI package, you confirm that you have read, understood, and agreed to the terms set out below.\n\n1. Nature of BPI Membership\nBPI operates as a membership-based empowerment ecosystem.\nAll BPI packages are subscription-based membership programs and DO NOT constitute an investment, security, or financial product.\nSubscription to BPI does not guarantee profits, fixed returns, or capital appreciation.\n\n2. Subscription Packages\nBPI membership subscription packages range between:\n- ₦285,000 (Early Retirement Welcome Pack)\n- ₦350,000 (Child Education / Vocational Skill Empowerment Package)\nAll fees are paid strictly for membership access, tools, training, and ecosystem participation, and not for investment purposes.\n\n3. Member Empowerment & Tools\nUpon a valid subscription, BPI empowers members with access to Web3-based retirement and empowerment portfolios, which may include:\n- Web3 payment frameworks\n- Web3 liquidity participation tools\n- Web3 digital farm access\n- Community-based support programs\n- Training, education, and ecosystem engagement\nThese offerings are empowerment tools and learning frameworks, not investment instruments.\n\n4. No Investment Representation\nMembers expressly acknowledge and agree that:\n- BPI does not solicit investments\n- BPI does not offer guaranteed returns\n- BPI does not promise income, profit, or capital growth\n- All participation is voluntary, educational, and community-driven\n\n5. Member Responsibility\nEach Member:\n- Participates voluntarily and at their own discretion\n- Is responsible for their decisions, actions, and outcomes\n- Understands that learning, engagement, and external market conditions affect results\n- Is encouraged to seek independent professional advice where necessary\n\n6. Indemnity\nBy subscribing, the Member agrees to fully indemnify, defend, and hold harmless BeepAgro Africa Ltd and its directors, officers, management, partners, and representatives from any claims, losses, damages, liabilities, or disputes arising from use of the BPI platform, participation in BPI programs, misinterpretation of membership benefits, or personal decisions made by the Member.\n\n7. Limitation of Liability\nBeepAgro Africa shall not be liable for financial losses or opportunity costs, market volatility or digital asset price changes, third-party platform failures or wallet issues, or delays or disruptions beyond reasonable control.\n\n8. Acceptance of Terms\nBy registering on the BPI portal and completing subscription payment, the Member automatically accepts this Agreement, including all policies, updates, and community rules published by BPI. Digital acceptance is legally binding, and no physical signature is required.\n\n9. Risk Disclaimer\nMembers acknowledge that participation in the BPI ecosystem involves inherent risks, including but not limited to market risk, technology risk, regulatory risk, and operational risk. BPI provides education, tools, and community access only and does not provide financial, legal, or investment advice. Members accept that past performance, illustrations, or projections do not guarantee future results.\n\n10. Governing Law\nThis Agreement shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.\n\nBeepAgro Africa Ltd\nBuilding Africa’s Early Retirement & Web3 Empowerment Ecosystem`;

type PageDraft = {
  id?: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  summary?: string;
  body: string;
  heroImage?: string;
  blocks?: string; // JSON string form for editing
};

const presets = [
  { label: "Terms", slug: "terms-of-service", title: "Terms of Service", category: "terms", status: "published" },
  { label: "Privacy", slug: "privacy-policy", title: "Privacy Policy", category: "privacy", status: "published" },
  { label: "Cookies", slug: "cookie-policy", title: "Cookie Policy", category: "cookies", status: "published" },
  { label: "Home Layout", slug: "home", title: "Home Layout", category: "home", status: "draft" },
];

export default function AdminDesignPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>(presets[0].slug);
  const [draft, setDraft] = useState<PageDraft>({
    slug: presets[0].slug,
    title: presets[0].title,
    category: presets[0].category,
    status: presets[0].status,
    body: "",
  });

  const { data: pageData, isFetching: loadingPage, refetch: refetchPage } = api.content.adminGetPage.useQuery(
    { slug: selectedSlug },
    { enabled: !!selectedSlug }
  );

  const listQuery = api.content.adminListPages.useQuery({ page: 1, pageSize: 20 });
  const upsertMutation = api.content.adminUpsertPage.useMutation({
    onSuccess: () => {
      toast.success("Page saved");
      listQuery.refetch();
      refetchPage();
    },
    onError: (err) => toast.error(err.message || "Save failed"),
  });

  useEffect(() => {
    if (pageData) {
      setDraft({
        id: pageData.id,
        slug: pageData.slug,
        title: pageData.title,
        category: pageData.category,
        status: pageData.status,
        summary: pageData.summary || "",
        body: pageData.body || "",
        heroImage: pageData.heroImage || "",
        blocks: pageData.blocks ? JSON.stringify(pageData.blocks, null, 2) : "",
      });
    } else {
      const preset = presets.find((p) => p.slug === selectedSlug);
      setDraft({
        slug: preset?.slug || "",
        title: preset?.title || "",
        category: preset?.category || "custom",
        status: preset?.status || "draft",
        summary: "",
        body: "",
        heroImage: "",
        blocks: "",
      });
    }
  }, [pageData, selectedSlug]);

  const parsedBlocks = useMemo(() => {
    if (!draft.blocks) return undefined;
    try {
      return JSON.parse(draft.blocks);
    } catch (e) {
      return undefined;
    }
  }, [draft.blocks]);

  const handleSave = () => {
    try {
      const blocksJson = draft.blocks ? JSON.parse(draft.blocks) : undefined;
      upsertMutation.mutate({
        id: draft.id,
        slug: draft.slug.trim().toLowerCase(),
        title: draft.title,
        category: draft.category,
        status: draft.status,
        summary: draft.summary,
        body: draft.body,
        heroImage: draft.heroImage,
        blocks: blocksJson,
      });
    } catch (e: any) {
      toast.error("Blocks JSON is invalid");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Design</h1>
          <p className="text-sm text-muted-foreground">Manage policies, terms, custom pages, and home layout sections.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetchPage()}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
          >
            {loadingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reload
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-3 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="grid gap-3 md:grid-cols-4">
        {presets.map((p) => (
          <button
            key={p.slug}
            onClick={() => setSelectedSlug(p.slug)}
            className={`rounded-xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${selectedSlug === p.slug ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-border bg-card/60"}`}
          >
            <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" /> {p.label}</div>
            <div className="text-[11px] text-muted-foreground">{p.slug}</div>
          </button>
        ))}
        <button
          onClick={() => setSelectedSlug("")}
          className={`rounded-xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow ${selectedSlug === "" ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-dashed"}`}
        >
          <div className="text-sm font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> New Page</div>
          <div className="text-[11px] text-muted-foreground">Start from scratch</div>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-2 space-y-4 rounded-2xl border border-border bg-card/70 p-4 shadow"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Title</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Slug</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              >
                {["draft", "published"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Hero Image URL (optional)</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
                value={draft.heroImage || ""}
                onChange={(e) => setDraft((d) => ({ ...d, heroImage: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Summary</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-background"
              rows={2}
              value={draft.summary || ""}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs text-muted-foreground">Body</label>
              <p className="text-[11px] text-muted-foreground">Supports markdown/plain text. Paste provided Terms to keep content synced.</p>
            </div>
            <button
              type="button"
              onClick={() => setDraft((d) => ({ ...d, body: defaultTermsBody }))}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <FileText className="h-4 w-4" /> Load Provided Terms
            </button>
          </div>
          <textarea
            className="w-full rounded-2xl border px-3 py-2 text-sm bg-background"
            rows={12}
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          />

          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-muted-foreground">Blocks (JSON)</label>
                <p className="text-[11px] text-muted-foreground">Use for home sections or structured layouts. Keep it valid JSON.</p>
              </div>
              <span className={`text-[11px] ${draft.blocks && !parsedBlocks ? "text-red-500" : "text-muted-foreground"}`}>
                {draft.blocks ? (parsedBlocks ? "Valid JSON" : "Invalid JSON") : "Optional"}
              </span>
            </div>
            <textarea
              className="mt-1 w-full rounded-2xl border px-3 py-2 text-xs font-mono bg-background"
              rows={10}
              value={draft.blocks || ""}
              onChange={(e) => setDraft((d) => ({ ...d, blocks: e.target.value }))}
              placeholder='[{"section":"hero","headline":"..."}]'
            />
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border bg-card/70 p-4 shadow"
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-[hsl(var(--primary))]" />
              <div>
                <h3 className="text-sm font-semibold">Home Layout Blocks</h3>
                <p className="text-[11px] text-muted-foreground">Store hero/features/CTA as JSON. Frontend will render by slug "home".</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>Slug "home" (category "home") will drive the main landing layout when implemented.</div>
              <div>Use blocks to organize sections: hero, features, stats, CTA, footer links.</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border bg-card/70 p-4 shadow"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[hsl(var(--primary))]" />
              <div>
                <h3 className="text-sm font-semibold">Pages</h3>
                <p className="text-[11px] text-muted-foreground">Quick snapshot of existing pages. Select to edit.</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto">
              {listQuery.data?.items.map((p: NonNullable<typeof listQuery.data>["items"][number]) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedSlug(p.slug)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${selectedSlug === p.slug ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-border hover:bg-muted"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{p.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{p.slug} · {p.category}</div>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border bg-card/70 p-4 shadow"
          >
            <div className="text-sm font-semibold">Content Tips</div>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              <li>Keep slugs lowercase and hyphenated for clean URLs.</li>
              <li>Mark policies as "published" to surface in the user footer.</li>
              <li>Use Blocks JSON to describe home sections (hero, features, CTA, footer links).</li>
              <li>Use the provided Terms loader to ensure the MoU stays in sync.</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
