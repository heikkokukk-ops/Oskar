import type { KnowledgeEntry } from "@prisma/client";
import type { AnswerStyle } from "./types";

export interface AnswerSettings {
  temperature: number;
  topP: number;
}

export interface Answer {
  content: string;
  sourceTopic: string | null;
  knowledgeEntryId: number | null;
  suggestions: string[];
}

export const FALLBACK_TEXT =
  "Sellele küsimusele ma kahjuks vastust ei leidnud. Proovi mõnda allolevatest küsimustest või võta OIXIO Digitaliga otse ühendust aadressil oixio.eu.";

const MIN_SCORE = 3;
// Demo behaviour: a "creative" temperature adds related questions to the answer.
const RELATED_TEMPERATURE = 0.7;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return [...new Set(normalize(text).split(" ").filter(Boolean))];
}

export function scoreEntry(
  entry: KnowledgeEntry,
  normalizedText: string,
  tokens: string[],
  personaAudience: string | null,
): number {
  let score = 0;

  const stems = entry.keywords
    .split(";")
    .map((k) => normalize(k))
    .filter(Boolean);
  for (const stem of stems) {
    const matches = stem.includes(" ")
      ? normalizedText.includes(stem)
      : tokens.some((t) => t.startsWith(stem) || t.includes(stem)) || normalizedText.includes(stem);
    if (matches) score += 3;
  }

  const question = normalize(entry.question);
  for (const token of tokens) {
    if (token.length > 3 && question.includes(token)) score += 1;
  }

  if (personaAudience && entry.audience === personaAudience) score += 1;

  return score;
}

export function relatedQuestions(entry: KnowledgeEntry, entries: KnowledgeEntry[]): string[] {
  return entries
    .filter((e) => e.topic === entry.topic && e.id !== entry.id)
    .slice(0, 2)
    .map((e) => e.question);
}

// One question from each of three different topics, preferring the persona's audience.
export function fallbackSuggestions(entries: KnowledgeEntry[], personaAudience: string | null): string[] {
  const byTopic = new Map<string, KnowledgeEntry[]>();
  for (const e of entries) byTopic.set(e.topic, [...(byTopic.get(e.topic) ?? []), e]);
  return [...byTopic.values()].slice(0, 3).map((group) => {
    const preferred = group.find((e) => personaAudience && e.audience === personaAudience);
    return (preferred ?? group[0]).question;
  });
}

export function findAnswer(
  text: string,
  style: AnswerStyle,
  personaAudience: string | null,
  settings: AnswerSettings,
  entries: KnowledgeEntry[],
): Answer {
  const normalizedText = normalize(text);
  const tokens = tokenize(text);

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    const score = scoreEntry(entry, normalizedText, tokens, personaAudience);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < MIN_SCORE) {
    return {
      content: FALLBACK_TEXT,
      sourceTopic: null,
      knowledgeEntryId: null,
      suggestions: fallbackSuggestions(entries, personaAudience),
    };
  }

  return {
    content: style === "detailed" ? best.answerDetailed : best.answerShort,
    sourceTopic: best.topic,
    knowledgeEntryId: best.id,
    suggestions: settings.temperature >= RELATED_TEMPERATURE ? relatedQuestions(best, entries) : [],
  };
}

// Recomputes the clickable chips for stored assistant messages so they survive a reload.
export function suggestionsFor(
  message: { role: string; knowledgeEntryId: number | null },
  entries: KnowledgeEntry[],
  personaAudience: string | null,
  temperature: number,
): string[] {
  if (message.role !== "assistant") return [];
  if (message.knowledgeEntryId == null) return fallbackSuggestions(entries, personaAudience);
  if (temperature < RELATED_TEMPERATURE) return [];
  const entry = entries.find((e) => e.id === message.knowledgeEntryId);
  return entry ? relatedQuestions(entry, entries) : [];
}
