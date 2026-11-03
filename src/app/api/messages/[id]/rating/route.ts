import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, jsonError, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

// Body: { rating: 1 | -1 | null }; null removes the rating.
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { rating } = await readJson(request);
    if (rating !== 1 && rating !== -1 && rating !== null) {
      return jsonError("Hinnang peab olema 1, -1 või null.", 400);
    }
    const message = await prisma.message.update({
      where: { id: (await params).id },
      data: { rating },
    });
    return NextResponse.json({ id: message.id, rating: message.rating });
  } catch (error) {
    return handleError(error);
  }
}
