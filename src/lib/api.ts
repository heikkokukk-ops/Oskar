import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const DB_ERROR_MESSAGE =
  "Andmebaasiga ei õnnestunud ühendust luua. Proovi hetke pärast uuesti.";

// Prisma error codes that mean the database could not be reached.
const CONNECTION_CODES = new Set(["P1000", "P1001", "P1002", "P1008", "P1017", "P2024"]);

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  console.error(error);
  const unreachable =
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && CONNECTION_CODES.has(error.code));
  if (unreachable) return jsonError(DB_ERROR_MESSAGE, 503);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return jsonError("Kirjet ei leitud.", 404);
  }
  return jsonError("Midagi läks valesti. Proovi uuesti.", 500);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
