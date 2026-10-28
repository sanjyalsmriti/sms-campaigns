# Bulk SMS Campaign Manager

A full-stack application for creating and running SMS campaigns. Upload contacts via CSV, compose personalised messages, send immediately or schedule for later, and watch delivery progress in real time.

## Tech Stack

- **Backend:** Node.js, Express, Prisma ORM, SQLite
- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Auth:** bcrypt + JWT
- **Background jobs:** In-process campaign sender + node-cron scheduler

No external services required. SQLite is embedded — just Node.js is needed.

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd <repo>

# 2. Backend
cd server
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev

# 3. Frontend (new terminal)
cd client
npm install
npm run dev
```

The API runs on `http://localhost:4000`, the frontend on `http://localhost:3000` (proxied to the API).

## Seed Accounts

| Email            | Password      | Role  | Credits |
|------------------|---------------|-------|---------|
| admin@test.com   | password123   | ADMIN | 10,000  |
| user@test.com    | password123   | USER  | 100     |

The seed also creates three mock SMS routes and a sample contact group with 10 Nepali phone numbers.

## How It Works

### SMS Counting Rules

Every message cost depends on its encoding and length:

- **GSM-7** (standard A–Z, digits, common symbols): 160 chars per single SMS, 153 per part in multi-part messages.
- **Unicode** (Nepali, emoji, etc.): 70 chars per single SMS, 67 per part.

The `{name}` placeholder is resolved per contact *before* counting, so different names can produce different part counts.

### Phone Validation

Valid Nepali mobile numbers: 10 digits starting with `97` or `98`. Prefixes `+977` and `977` are stripped automatically. Invalid numbers are rejected during CSV upload.

### Credit Deduction

1. When a campaign is created, the total cost is calculated per-contact (because `{name}` changes message length) and deducted upfront from the user's wallet.
2. Each message is sent through mock routes with failover.
3. If a message fails on every route, its cost is refunded to the user.

This upfront-deduct-then-refund approach prevents overspending while ensuring failed messages aren't permanently charged.

### No Double Charging

Three safeguards:

- **Unique constraint** on `(campaignId, contactId)` — duplicate message records can't be created.
- **Idempotent processing** — the sender only picks up `PENDING` messages. Once marked `SENT` or `FAILED`, a message is never reprocessed.
- **Atomic transactions** — status updates and credit adjustments happen inside database transactions.

On server restart, any campaign stuck in `SENDING` is automatically resumed. Only its remaining `PENDING` messages are processed.

### Mock SMS Routes

| Route   | Priority | Initial Balance | Failure Rate |
|---------|----------|-----------------|-------------|
| ROUTE_A | 1        | 1,000           | 30%         |
| ROUTE_B | 2        | 500             | 20%         |
| ROUTE_C | 3        | 300             | 10%         |

The sender tries the highest-priority route with available balance first. On failure, it falls through to the next route. Route balances are tracked in the database and decrease with each successful send.

### Background Sending

The campaign sender processes messages in batches of 50.

### Live Reporting

The campaign report page polls the API every 2 seconds while a campaign is sending. The progress bar, sent/failed counts, and credits used update in real time.
