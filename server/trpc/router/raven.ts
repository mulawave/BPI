import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { KNOWLEDGE_BASE, RAVEN_CONTEXT, searchKnowledgeBase } from "@/lib/raven-knowledge";

const prismaAny = prisma as any;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const MAX_MESSAGE_LEN = 1000;
const MAX_HISTORY = 10;

function formatKnowledgeBase(): string {
  return KNOWLEDGE_BASE.map((entry, i) => {
    const links = entry.links?.map((l) => `- ${l.label}: ${l.href}`).join("\n") ?? "";
    return `Entry ${i + 1}: ${entry.keywords.join(", ")}\n${entry.response}\n${links}`;
  }).join("\n\n");
}

async function callOpenAI(message: string, history: { role: "user" | "assistant"; content: string }[], context: string) {
  const messages = [
    { role: "system" as const, content: context },
    ...history.slice(-MAX_HISTORY).map((h) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: message },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "OpenAI request failed");
    throw new Error(err);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response right now. Please try again.";
}

export const ravenRouter = createTRPCRouter({
  ask: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(MAX_MESSAGE_LEN),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ input }) => {
      const { message, history } = input;

      // 1. Knowledge-base lookup for deterministic fallback and scoring
      const kbMatches = searchKnowledgeBase(message);
      const topKb = kbMatches[0];

      // 2. Pull relevant help topics from the database
      const helpMatches = await prismaAny.helpTopic.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: message, mode: "insensitive" } },
            { summary: { contains: message, mode: "insensitive" } },
            { tags: { has: message.toLowerCase() } },
          ],
        },
        take: 3,
        orderBy: { viewCount: "desc" },
        select: { title: true, slug: true, summary: true },
      });

      // 3. Pull relevant published blog posts from the database
      const blogMatches = await prismaAny.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: message, mode: "insensitive" } },
            { excerpt: { contains: message, mode: "insensitive" } },
            { content: { contains: message, mode: "insensitive" } },
          ],
        },
        take: 3,
        orderBy: { viewCount: "desc" },
        select: { title: true, slug: true, excerpt: true },
      });

      // 4. Build the context prompt
      const helpContext = (helpMatches as { title: string; slug: string; summary: string | null }[])
        .map((h) => `Help topic: ${h.title}\nSlug: /help/${h.slug}\nSummary: ${h.summary ?? "N/A"}`)
        .join("\n\n");

      const blogContext = (blogMatches as { title: string; slug: string; excerpt: string | null }[])
        .map((b) => `Blog post: ${b.title}\nSlug: /blog/${b.slug}\nExcerpt: ${b.excerpt ?? "N/A"}`)
        .join("\n\n");

      const context = `You are RAVEN, the friendly and knowledgeable help & support AI for BPI (BeepAgro Africa). Use the following context to answer the user's question. If the context doesn't contain the answer, say you don't know and suggest contacting support at info@beepagro.com or +234 706 710 8437. Keep answers concise, accurate, and helpful. When relevant, mention the user can click the links shown below the answer.

${RAVEN_CONTEXT}

Knowledge base:
${formatKnowledgeBase()}

${helpContext ? `Relevant help topics:\n${helpContext}\n\n` : ""}${blogContext ? `Relevant blog posts:\n${blogContext}\n\n` : ""}`.trim();

      // 5. If no OpenAI key, return the deterministic knowledge-base result
      if (!OPENAI_API_KEY) {
        if (topKb) {
          return {
            text: topKb.response,
            topics: [
              ...(topKb.links?.map((l) => ({ title: l.label, slug: l.href })) ?? []),
              ...helpMatches.map((h: any) => ({ title: h.title, slug: `/help/${h.slug}` })),
              ...blogMatches.map((b: any) => ({ title: b.title, slug: `/blog/${b.slug}` })),
            ],
          };
        }
        return {
          text: "I couldn't find an exact match. Try keywords like 'claim code', 'checkout', 'wallet', 'CSP eligibility', or 'KYC'.",
          topics: [] as { title: string; slug: string }[],
        };
      }

      // 6. Call OpenAI
      const reply = await callOpenAI(message, history, context);

      const topics = [
        ...(topKb?.links?.map((l) => ({ title: l.label, slug: l.href })) ?? []),
        ...helpMatches.map((h: any) => ({ title: h.title, slug: `/help/${h.slug}` })),
        ...blogMatches.map((b: any) => ({ title: b.title, slug: `/blog/${b.slug}` })),
      ];

      return { text: reply, topics };
    }),
});
