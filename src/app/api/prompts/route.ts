import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, jsonError, readJson } from "@/lib/api";
import type { Audience } from "@/lib/types";

export const dynamic = "force-dynamic";

const AUDIENCES: Audience[] = ["all", "manager", "office", "it"];

function parsePersona(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const audience = AUDIENCES.includes(body.audience as Audience) ? (body.audience as Audience) : "all";
  if (!name) return { error: "Sihtrühma nimi on kohustuslik." };
  if (name.length > 60) return { error: "Sihtrühma nimi võib olla kuni 60 tähemärki." };
  if (content.length > 1000) return { error: "Kirjeldus võib olla kuni 1000 tähemärki." };
  return { data: { name, content, audience } };
}

export async function GET() {
  try {
    return NextResponse.json(await prisma.systemPrompt.findMany({ orderBy: { createdAt: "asc" } }));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parsePersona(await readJson(request));
    if (!parsed.data) return jsonError(parsed.error, 400);
    return NextResponse.json(await prisma.systemPrompt.create({ data: parsed.data }), { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await readJson(request);
    if (typeof body.id !== "string") return jsonError("Sihtrühma id puudub.", 400);
    const parsed = parsePersona(body);
    if (!parsed.data) return jsonError(parsed.error, 400);
    return NextResponse.json(await prisma.systemPrompt.update({ where: { id: body.id }, data: parsed.data }));
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/prompts?id=<id>
export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return jsonError("Sihtrühma id puudub.", 400);
    await prisma.systemPrompt.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}
