# Oskar – OIXIO Digital koolitusabiline

A training-guide chatbot that answers questions about OIXIO Digital's AI, Microsoft 365 Copilot and Power BI trainings. Answers come from a knowledge base in PostgreSQL; no external AI API is used. The UI is in Estonian.

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui-style components (Radix UI), lucide-react, Prisma 6, PostgreSQL.

## Deployment (Railway)

- Railway builds and deploys automatically from the `main` branch.
- The app service needs `DATABASE_URL` set as a reference to the Postgres service (`${{Postgres.DATABASE_URL}}`).
- `npm run build` runs `prisma generate && next build`.
- `npm start` applies migrations, runs the idempotent seed (`prisma/seed.mjs`) and starts Next.js on `$PORT`.

## Knowledge base

`prisma/data/knowledge_base.csv` is the source of truth. The seed upserts every row by `id` on each start, so edit the CSV and push to update answers. Default personas are created only when the `SystemPrompt` table is empty.

Answer matching lives in `src/lib/answer.ts` (`findAnswer`).
