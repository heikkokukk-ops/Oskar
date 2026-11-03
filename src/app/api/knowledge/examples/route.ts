import { NextResponse } from "next/server";
import { handleError } from "@/lib/api";
import { loadEntries } from "@/lib/chat";

export const dynamic = "force-dynamic";

const EXAMPLE_COUNT = 4;

// One example question per topic, for the welcome screen.
export async function GET() {
  try {
    const seen = new Set<string>();
    const examples: { id: number; topic: string; question: string }[] = [];
    for (const entry of await loadEntries()) {
      if (seen.has(entry.topic)) continue;
      seen.add(entry.topic);
      examples.push({ id: entry.id, topic: entry.topic, question: entry.question });
      if (examples.length === EXAMPLE_COUNT) break;
    }
    return NextResponse.json(examples);
  } catch (error) {
    return handleError(error);
  }
}
