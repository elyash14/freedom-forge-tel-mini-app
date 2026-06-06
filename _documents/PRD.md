cat << 'EOF' > PRD.md

# Product Requirement Document (PRD)

## Project Name: FreedomForge (Telegram Mini-App & Bot)

### Target Tech Stack: Next.js 14+ (App Router), TailwindCSS, Prisma, PostgreSQL, Telegraf/Aiogram

---

## 1. Project Overview & Philosophy

FreedomForge is a gamified financial tracking and motivation tool built inside Telegram. Inspired by classic wealth-building principles, it helps users (specifically freelancers and developers with unpredictable or crypto incomes) calculate their **Financial Freedom Line**, track their monthly savings target (default: 20%), and stay motivated through community gamification without sacrificing financial privacy.

### Core Architecture Principle: "Blind Data & Zero Financial Leak"

To guarantee maximum user privacy, the central database **NEVER** stores raw monetary values (Rials, Dollars, or Crypto). 

- All financial inputs remain strictly local in the client's state.
- Before syncing with the PostgreSQL database, numbers are converted into **XP (Experience Points)**, **Progress Percentages**, or **Streak Counts**.
- The public group leaderboard only displays gamified metrics (Level, Title, Streak, and Monthly Target % Accomplished).

---

## 2. System Architecture & Tech Stack

- **Framework:** Next.js (App Router) using Server Actions for secure backend operations.
- **Database ORM:** Prisma with PostgreSQL.
- **UI/UX:** TailwindCSS, Shadcn/ui (optimized for Telegram WebApp Dark/Light themes).
- **Telegram SDK:** `https://telegram.org/js/telegram-web-app.js` for seamless native integration.
- **Bot Integration:** Node.js polling/webhook server (integrated into Next.js API routes or as a standalone microservice using Telegraf).

---

## 3. Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String         @id @default(cuid())
  telegramId       BigInt         @unique
  username         String?
  firstName        String
  totalXp          Int            @default(0)
  currentLevel     Int            @default(1)
  currentTitle     String         @default("Pedestrian")
  currentStreak    Int            @default(0)
  lastSavedMonth   DateTime?      // To validate streaks
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  SavingsLogs      SavingsLog[]
  AntiTrashLogs    AntiTrashLog[]
}

model SavingsLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  month       DateTime // Format: YYYY-MM-01
  percentage  Float    // The logged savings percentage (e.g., 22.5%)
  xpGained    Int
  createdAt   DateTime @default(now())

  @@unique([userId, month])
}

model AntiTrashLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```



## 4. Feature Requirements & User Flow

### Feature 1: Core Financial Calculator (Client-Side Only)

- **Input Fields:**
  - Monthly Expenses (in Iranian Rials/Toman).
  - Expected Savings Percentage Goal (Default: 20%).
  - Current USD/Toman Live Rate (Fetched via public API or fallback).
- **Calculations (Local State):**
  - Converts monthly expenses to USD.
  - Calculates **Financial Freedom Line** using the formula:
    $$\text{Freedom Line (USD)} = \frac{\text{Annual Expenses (USD)}}{\text{Safe Withdrawal Rate (0.30)}}$$
- **Visual Output:** A sleek gauge showing the dollar amount required to reach complete freedom.

### Feature 2: The Saving Logger & Progress Tracker

- User enters their total income and saved amount for the current month locally.
- The client calculates the percentage ($\text{Saved} / \text{Income} \times 100$).
- **Action Button ("Lock My 20%"):** Sends *only* the percentage to the Server Action.
- **XP Allocation System:**
  - Reaching 100% of the goal (e.g., saving 20% of income) = `+100 XP`.
  - Partial tracking is allowed (e.g., saving 10% out of 20% goal = `+50 XP`).
  - **Streak Bonus:** If `lastSavedMonth` was consecutive, apply a multiplier ($1.0x \rightarrow 1.2x \rightarrow 1.5x$ max).

### Feature 3: "Anti-Trash Purchase" (Mochamo Gereftam Button)

- A rapid-action floating button.
- When a user avoids an impulsive, wasteful expenditure (buying expensive tech items, clothing brands, or fast food they didn't need) and channels that money into savings.
- Clicking it creates an `AntiTrashLog` entry, granting a flat `+20 XP` (Cap: Once per day).

### Feature 4: Gamification, Levels & Titles

XP accumulation triggers level-ups and modifies native Telegram titles.


|           |              |                                |                           |
| --------- | ------------ | ------------------------------ | ------------------------- |
| **Level** | **XP Range** | **Title**                      | **Feature Unlocked**      |
| **Lvl 1** | 0 - 500      | Pedestrian (پیاده‌رو)          | Basic Freedom Calculator  |
| **Lvl 2** | 501 - 2000   | Market Surfer (موج‌سوار بورس)  | Anti-Trash Log Access     |
| **Lvl 3** | 2001 - 5000  | Inflation Hunter (شکارچی تورم) | Advanced Analytics Charts |
| **Lvl 4** | 5001+        | Captain (ناخدا / آزاد)         | Golden Badge UI Template  |


## 5. Telegram Bot Integration & Social Hooks

The companion bot interacts within the user's specific group using the following commands and triggers:

1. `/forge` **or** `/freedom`**:** Replies with an inline button that opens the Next.js WebApp directly inside Telegram, securely passing the encrypted `initData` for validation.
2. **Broadcast Achievements (Webhook Trigger):** When a user logs their monthly 20% or levels up inside the WebApp, the backend fires a webhook to the bot. The bot sends an upbeat automated message to the group:
  > *"🔥 @Username just locked their 20% savings target for June! Streak: 3 Months. Level Up to 'Inflation Hunter'! 🚀"*
3. **The Monthly Leaderboard:** Every Monday or upon `/leaderboard` command, the bot generates a dynamic text card showing the top-performing members based strictly on **Current Streak** and **Total XP Gained this month**. Actual wealth numbers remain hidden.

