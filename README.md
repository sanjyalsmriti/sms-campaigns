# Bulk SMS Campaign Manager

Upload contacts via CSV, compose a message with a `{name}` placeholder, and send to a group immediately or on a schedule. A background job handles delivery in batches using mock SMS routes with failover.

## Stack

- **Backend:** Node.js, Express, Prisma, SQLite
- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Auth:** JWT (bcrypt for passwords)
- **Scheduling:** node-cron

## Setup

```bash
# Backend
cd server
cp .env.example .env   # edit JWT_SECRET
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev            # http://localhost:4000

# Frontend (new terminal)
cd client
npm install
npm run dev            # http://localhost:3000
```

## Seed accounts

| Email           | Password    | Role  | Credits |
|-----------------|-------------|-------|---------|
| admin@test.com  | password123 | ADMIN | 10,000  |
| user@test.com   | password123 | USER  | 100     |

These are for local development only. Change or remove them before deploying.

## SMS rules

Part counts follow the Nest Nepal spec:

| Encoding | Single SMS | Multi-part |
|----------|-----------|------------|
| GSM-7    | 160 chars | 153 per part |
| Unicode  | 70 chars  | 67 per part  |

Any character outside the GSM-7 alphabet (Nepali script, emoji, etc.) switches the whole message to Unicode. `{name}` is substituted per contact before counting, so contacts with longer names may produce more parts and cost more.

Valid Nepali mobile numbers are 10 digits starting with `97` or `98`. Prefixes `+977` and `977` are stripped on upload.

## Credit flow

Credits are deducted upfront when a campaign is created (inside a single database transaction that also checks the balance). If a message fails on every route, the cost is refunded to the user in the same transaction that marks it FAILED.

The balance check and deduction happen atomically, so two concurrent campaign creations cannot both pass a balance check they shouldn't.

## Mock SMS routes

| Route   | Priority | Balance | Failure rate |
|---------|----------|---------|-------------|
| ROUTE_A | 1        | 1,000   | 30%         |
| ROUTE_B | 2        | 500     | 20%         |
| ROUTE_C | 3        | 300     | 10%         |

The sender tries routes lowest-priority-number first. A failed attempt moves to the next route with sufficient balance.

## Background sending

Messages are processed in batches of 50. The scheduler checks every 30 seconds for campaigns whose `scheduledAt` has passed and claims them with an atomic `updateMany` (so two overlapping ticks cannot start the same campaign twice). On restart, any campaign still in SENDING status is resumed automatically — only PENDING messages are picked up, so already-sent messages are not retried.