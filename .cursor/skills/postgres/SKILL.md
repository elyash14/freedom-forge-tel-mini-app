---
name: postgres
description: >-
  Work with the morakab-bazi PostgreSQL database via Prisma, psql, and Docker.
  Use when querying or modifying data, running migrations, seeding, inspecting
  schema, debugging DB issues, or when the user mentions postgres, database,
  prisma, migrations, or SQL.
---

# PostgreSQL — morakab-bazi

## Connection

Read `DATABASE_URL` from the project root `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5477/morakab_bazi"
```

| Field    | Value          |
|----------|----------------|
| Host     | `localhost`    |
| Port     | `5477`         |
| Database | `morakab_bazi` |
| User     | `postgres`     |
| Password | `postgres`     |

**psql (direct):**

```bash
psql "postgresql://postgres:postgres@localhost:5477/morakab_bazi"
```

**psql via script** (loads `.env`, falls back to `docker exec` if `psql` is not installed):

```bash
.cursor/skills/postgres/scripts/psql.sh
.cursor/skills/postgres/scripts/psql.sh -c "SELECT COUNT(*) FROM \"FreedomPlan\";"
```

Never commit `.env` or print credentials in chat output.

## Start / stop Postgres

Docker Compose lives at `_devops/docker-compose.yml` (container: `morakab-bazi-postgres`, image: `postgres:15.8`).

```bash
docker compose -f _devops/docker-compose.yml up -d
docker compose -f _devops/docker-compose.yml down
docker compose -f _devops/docker-compose.yml logs -f postgres
```

## Prisma workflow

This project uses **Prisma 7** with the `@prisma/adapter-pg` driver adapter. Client is generated to `src/generated/prisma/`.

| Task              | Command              |
|-------------------|----------------------|
| Generate client   | `pnpm db:generate`   |
| Apply migrations  | `pnpm db:migrate`    |
| Seed data         | `pnpm db:seed`       |
| GUI browser       | `pnpm db:studio`     |

Config: `prisma.config.ts` (loads `dotenv`). Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.

### Schema change checklist

1. Edit `prisma/schema.prisma`
2. `pnpm db:migrate` — name the migration descriptively
3. `pnpm db:generate` if the client is stale
4. Update `prisma/seed.ts` if seed data needs to change
5. Update API routes / types that consume the model

### App usage

Import the singleton from `@/lib/prisma` in API routes — do not instantiate `PrismaClient` elsewhere.

```typescript
import { prisma } from "@/lib/prisma";
```

## Schema overview

| Model            | Purpose |
|------------------|---------|
| `AppConfig`      | Singleton (`id = "default"`) app defaults: inflation, investment return, USD/Toman rate |
| `ExpenseCategory`| Wizard expense categories (`key` unique, bilingual labels, default Toman amounts) |
| `User`           | Future Telegram users (`telegramId` unique) |
| `FreedomPlan`    | Saved freedom-wizard plans per `sessionId` or `userId`; `expenseItems` is JSON |

Key indexes: `ExpenseCategory.key`, `User.telegramId`, `FreedomPlan.sessionId`, `FreedomPlan.userId`.

For column-level detail, see [schema-reference.md](schema-reference.md).

## Common operations

**Inspect tables:**

```sql
\dt
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**Row counts:**

```sql
SELECT 'AppConfig' AS t, COUNT(*) FROM "AppConfig"
UNION ALL SELECT 'ExpenseCategory', COUNT(*) FROM "ExpenseCategory"
UNION ALL SELECT 'User', COUNT(*) FROM "User"
UNION ALL SELECT 'FreedomPlan', COUNT(*) FROM "FreedomPlan";
```

**Recent plans:**

```sql
SELECT id, "sessionId", "pathMode", "totalMonthlyToman", "createdAt"
FROM "FreedomPlan"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Reset seed data only** (non-destructive to schema):

```bash
pnpm db:seed
```

## Safety rules

- Prefer Prisma migrations over hand-written DDL unless fixing a broken migration
- Ask before `DROP`, `TRUNCATE`, or `docker compose down -v` (destroys volume)
- Use transactions for multi-table manual SQL
- Prisma model/table names are PascalCase and quoted in SQL (`"FreedomPlan"`)
- After schema changes, run `pnpm db:generate` before `pnpm build`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `DATABASE_URL is not set` | Ensure `.env` exists at project root; Prisma CLI uses `prisma.config.ts` + dotenv |
| Connection refused on 5477 | `docker compose -f _devops/docker-compose.yml up -d` |
| Prisma client type errors | `pnpm db:generate` |
| Migration drift | `pnpm db:migrate` or inspect `_prisma_migrations` table |
| Port conflict on 5477 | Check `lsof -i :5477`; stop conflicting process or change compose port |
