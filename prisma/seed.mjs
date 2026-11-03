// Idempotent seed: upserts the knowledge base from CSV and creates the
// default personas only when the SystemPrompt table is empty.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_PERSONAS = [
  {
    name: "Juht",
    audience: "manager",
    content:
      "Kasutaja on juht või koolitusjuht. Rõhuta ärilist kasu, korraldust, hinda ja tulemuste mõõtmist.",
  },
  {
    name: "Kontoritöötaja",
    audience: "office",
    content:
      "Kasutaja on kontoritöötaja. Rõhuta igapäevatöö praktilisi näiteid ja seda, mida koolitusel õpitakse.",
  },
  {
    name: "IT-administraator",
    audience: "it",
    content:
      "Kasutaja on IT-administraator. Rõhuta litsentse, turvalisust, õigusi ja tehnilisi eeldusi.",
  },
];

async function main() {
  const csv = readFileSync(join(here, "data", "knowledge_base.csv"), "utf8");
  const rows = parse(csv, { columns: true, bom: true, skip_empty_lines: true, trim: true });

  for (const row of rows) {
    const data = {
      topic: row.topic,
      question: row.question,
      answerShort: row.answer_short,
      answerDetailed: row.answer_detailed,
      keywords: row.keywords,
      audience: row.audience,
    };
    const id = Number(row.id);
    await prisma.knowledgeEntry.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`Seed: upserted ${rows.length} knowledge entries.`);

  if ((await prisma.systemPrompt.count()) === 0) {
    await prisma.systemPrompt.createMany({ data: DEFAULT_PERSONAS });
    console.log(`Seed: created ${DEFAULT_PERSONAS.length} default personas.`);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
