import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, jsonError, readJson } from "@/lib/api";
import { findAnswer } from "@/lib/answer";
import { DEFAULT_TITLE, loadEntries, makeTitle, toMessage, toSummary } from "@/lib/chat";
import { MAX_MESSAGE_LENGTH, type AnswerStyle } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPING_DELAY_MS = 1000;

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await readJson(request);
    const text = typeof body.content === "string" ? body.content.trim() : "";
    const attachment = typeof body.attachmentName === "string" ? body.attachmentName.trim() : "";

    if (!text) return jsonError("Sõnum ei saa olla tühi.", 400);
    if (text.length > MAX_MESSAGE_LENGTH) {
      return jsonError(`Sõnum on liiga pikk. Lubatud on kuni ${MAX_MESSAGE_LENGTH} tähemärki.`, 400);
    }

    const chat = await prisma.chatSession.findUnique({ where: { id }, include: { persona: true } });
    if (!chat) return jsonError("Vestlust ei leitud.", 404);

    const userMessage = await prisma.message.create({
      data: {
        sessionId: id,
        role: "user",
        content: attachment ? `${text}\n(manus: ${attachment})` : text,
      },
    });

    const answer = findAnswer(
      text,
      chat.answerStyle as AnswerStyle,
      chat.persona?.audience ?? null,
      { temperature: chat.temperature, topP: chat.topP },
      await loadEntries(),
    );

    await new Promise((resolve) => setTimeout(resolve, TYPING_DELAY_MS));

    const assistantMessage = await prisma.message.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: answer.content,
        sourceTopic: answer.sourceTopic,
        knowledgeEntryId: answer.knowledgeEntryId,
      },
    });

    const updated = await prisma.chatSession.update({
      where: { id },
      // Touch updatedAt so the chat moves to the top of the history.
      data: chat.title === DEFAULT_TITLE ? { title: makeTitle(text) } : { updatedAt: new Date() },
    });

    return NextResponse.json({
      chat: toSummary(updated),
      userMessage: toMessage(userMessage),
      assistantMessage: toMessage(assistantMessage, answer.suggestions),
    });
  } catch (error) {
    return handleError(error);
  }
}
