import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, jsonError, readJson } from "@/lib/api";
import { DEFAULT_TITLE, getChatDetail, parseUnit } from "@/lib/chat";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const chat = await getChatDetail((await params).id);
    return chat ? NextResponse.json(chat) : jsonError("Vestlust ei leitud.", 404);
  } catch (error) {
    return handleError(error);
  }
}

// Updates chat settings; `clear: true` removes all messages from the chat.
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const body = await readJson(request);

    const data: {
      title?: string;
      answerStyle?: string;
      personaId?: string | null;
      temperature?: number;
      topP?: number;
    } = {
      temperature: parseUnit(body.temperature),
      topP: parseUnit(body.topP),
    };
    if (body.answerStyle === "short" || body.answerStyle === "detailed") data.answerStyle = body.answerStyle;
    if (body.personaId === null || typeof body.personaId === "string") data.personaId = body.personaId;
    if (body.clear === true) data.title = DEFAULT_TITLE;

    await prisma.$transaction([
      ...(body.clear === true ? [prisma.message.deleteMany({ where: { sessionId: id } })] : []),
      prisma.chatSession.update({ where: { id }, data }),
    ]);

    return NextResponse.json(await getChatDetail(id));
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await prisma.chatSession.delete({ where: { id: (await params).id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
