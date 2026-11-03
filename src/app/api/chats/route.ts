import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, readJson } from "@/lib/api";
import { getChatDetail, parseUnit, toSummary } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chats = await prisma.chatSession.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(chats.map(toSummary));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const chat = await prisma.chatSession.create({
      data: {
        answerStyle: body.answerStyle === "detailed" ? "detailed" : "short",
        personaId: typeof body.personaId === "string" ? body.personaId : null,
        temperature: parseUnit(body.temperature),
        topP: parseUnit(body.topP),
      },
    });
    return NextResponse.json(await getChatDetail(chat.id), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
