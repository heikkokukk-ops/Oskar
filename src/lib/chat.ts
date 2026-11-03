import type { ChatSession, KnowledgeEntry, Message, SystemPrompt } from "@prisma/client";
import { prisma } from "./prisma";
import { suggestionsFor } from "./answer";
import type { AnswerStyle, ChatDetail, ChatMessage, ChatSummary } from "./types";

export const DEFAULT_TITLE = "Uus vestlus";
const TITLE_LENGTH = 40;

export function makeTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > TITLE_LENGTH ? `${clean.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : clean;
}

export function loadEntries() {
  return prisma.knowledgeEntry.findMany({ orderBy: { id: "asc" } });
}

export function toSummary(chat: ChatSession): ChatSummary {
  return { id: chat.id, title: chat.title, updatedAt: chat.updatedAt.toISOString() };
}

export function toMessage(message: Message, suggestions: string[] = []): ChatMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    sourceTopic: message.sourceTopic,
    knowledgeEntryId: message.knowledgeEntryId,
    rating: message.rating,
    createdAt: message.createdAt.toISOString(),
    suggestions,
  };
}

export function toDetail(
  chat: ChatSession & { messages: Message[]; persona: SystemPrompt | null },
  entries: KnowledgeEntry[],
): ChatDetail {
  const audience = chat.persona?.audience ?? null;
  return {
    ...toSummary(chat),
    answerStyle: chat.answerStyle as AnswerStyle,
    personaId: chat.personaId,
    temperature: chat.temperature,
    topP: chat.topP,
    messages: chat.messages.map((m) => toMessage(m, suggestionsFor(m, entries, audience, chat.temperature))),
  };
}

export async function getChatDetail(id: string): Promise<ChatDetail | null> {
  const [chat, entries] = await Promise.all([
    prisma.chatSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } }, persona: true },
    }),
    loadEntries(),
  ]);
  return chat ? toDetail(chat, entries) : null;
}

// Validates and clamps a 0.0–1.0 slider value to one decimal.
export function parseUnit(value: unknown): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.round(Math.min(1, Math.max(0, value)) * 10) / 10;
}
