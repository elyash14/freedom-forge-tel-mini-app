# Schema reference

Source of truth: `prisma/schema.prisma`

## AppConfig

Singleton row (`id = "default"`).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String | `"default"` | PK |
| defaultInflationRate | Float | 0.45 | Annual rate |
| defaultInvestmentReturnRate | Float | 0.55 | Annual rate |
| defaultUsdTomanRate | Int | 90000 | FX rate |
| updatedAt | DateTime | auto | |

## ExpenseCategory

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String | cuid | PK |
| key | String | — | Unique slug (`housing`, `food`, …) |
| labelFa | String | — | Persian label |
| labelEn | String | — | English label |
| defaultToman | Int | — | Default monthly amount |
| sortOrder | Int | 0 | Display order |
| isActive | Boolean | true | Soft-disable |
| createdAt | DateTime | now | |
| updatedAt | DateTime | auto | |

## User

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | String | cuid | PK |
| telegramId | BigInt? | — | Unique when set |
| locale | String | `"fa"` | |
| createdAt | DateTime | now | |
| updatedAt | DateTime | auto | |

## FreedomPlan

| Column | Type | Notes |
|--------|------|-------|
| id | String | PK (cuid) |
| userId | String? | FK → User, ON DELETE SET NULL |
| sessionId | String | Anonymous session key (indexed) |
| locale | String | Default `"fa"` |
| expenseItems | Json | Array of wizard line items |
| totalMonthlyToman | Float | Sum of expenses |
| pathMode | String | `"years"` or `"investment"` |
| yearsToFreedom | Float? | User target (years path) |
| monthlyInvestmentUsd | Float? | User target (investment path) |
| usdTomanRate | Float | FX at save time |
| inflationRate | Float | Rate at save time |
| investmentReturnRate | Float | Rate at save time |
| currentSavingsUsd | Float | Default 0 |
| monthlyExpensesUsd | Float | Computed |
| annualExpensesUsd | Float | Computed |
| futureMonthlyToman | Float | Inflation-adjusted |
| freedomLineUsd | Float | Target portfolio |
| requiredMonthlyUsd | Float? | Required monthly investment |
| calculatedYears | Float? | Computed years to freedom |
| createdAt | DateTime | |
| updatedAt | DateTime | |

## API routes using Prisma

| Route | Models |
|-------|--------|
| `src/app/api/config/route.ts` | AppConfig |
| `src/app/api/expense-categories/route.ts` | ExpenseCategory |
| `src/app/api/plans/route.ts` | FreedomPlan |
