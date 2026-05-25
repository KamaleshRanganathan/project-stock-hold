# StockHold

> Inventory reservation platform built for the Allo Health take-home exercise.

**Live demo:** _add your Vercel URL here_
**GitHub:** https://github.com/kamaleshRanganathan/project-stock-hold
**Author:** Kamalesh R — VIT Chennai

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How Concurrency is Handled](#how-concurrency-is-handled)
- [How Expiry Works](#how-expiry-works)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Trade-offs and Limitations](#trade-offs-and-limitations)
- [What I Would Do With More Time](#what-i-would-do-with-more-time)

---

## The Problem

When a customer proceeds to checkout, payment can take several minutes — 3DS verification, UPI confirmations, wallet redirects. During that window, other shoppers are looking at the same product page.

This creates a race condition with two bad outcomes:

**Decrement stock at payment time** — Two customers can pay for the same physical unit simultaneously. One gets a refund, the other gets a bad experience, ops cleans up the mess.

**Decrement stock at add-to-cart** — Inventory looks depleted even though ~80% of carts are abandoned. Conversion tanks.

---

## The Solution

A reservation system. When a customer clicks Reserve, units are temporarily held for 10 minutes. Three outcomes are possible:

```
Reserve (pending)
    ├── Payment succeeds  →  confirm()  →  stock permanently decremented
    ├── Payment fails     →  release()  →  stock returned to available
    └── Timer expires     →  cron job   →  stock returned automatically
```

Available stock at any point = `totalUnits - reservedUnits`

---

## How Concurrency is Handled

This is the core of the exercise. Without protection, two simultaneous requests for the last unit both read `availableUnits = 1`, both pass the check, and both create a reservation — overselling by one.

**The fix: Redis distributed lock**

When a reservation request arrives for product X in warehouse Y:

1. Attempt to acquire a Redis lock with key `lock:{productId}:{warehouseId}` using `SET NX` (set if not exists)
2. Redis guarantees only one caller gets the lock
3. The lock holder reads stock, checks availability, then runs a Prisma transaction that atomically increments `reservedUnits` and creates the `Reservation` record
4. Lock is released immediately after
5. The second request acquires the lock, re-reads stock, sees 0 available, returns `409`

The lock is scoped per product+warehouse so reservations for different products never block each other.

Inside the lock, the stock update and reservation creation are wrapped in a `prisma.$transaction()` — both succeed or both fail together. There is no state where a reservation exists without a corresponding stock increment.

---

## How Expiry Works

A Vercel Cron job runs every minute in production. It hits `GET /api/cron/expire-reservations`, which:

1. Queries all reservations where `status = pending` AND `expiresAt < now()`
2. For each expired reservation, runs a transaction to decrement `reservedUnits` and set `status = released`

This was chosen over lazy cleanup (releasing on read) because it guarantees stock returns promptly even when nobody is browsing. With lazy cleanup, a product could show as out of stock for up to 10 minutes after expiry with no visitors. The cron approach bounds the delay to one minute.

The cron endpoint is protected by a `CRON_SECRET` environment variable checked against an `Authorization: Bearer` header. Vercel sends this header automatically when invoking cron routes.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack in one project, deploys to Vercel |
| Language | TypeScript | End-to-end type safety |
| ORM | Prisma 7 | Type-safe queries, migration tracking |
| Database | Supabase (PostgreSQL) | Hosted, free tier, works with Prisma |
| Cache / Lock | Upstash (Redis) | Hosted Redis via REST, free tier |
| Validation | Zod | Request body validation with clear errors |
| Styling | Tailwind CSS | No custom CSS needed |
| Deployment | Vercel | Native Next.js support, built-in cron |

---

## Data Model

```
Product
  id, name, description, price, imageUrl

Warehouse
  id, name, location

Stock
  id, productId, warehouseId
  totalUnits      -- physical units in warehouse
  reservedUnits   -- currently held by pending reservations
  availableUnits  -- computed: totalUnits - reservedUnits

Reservation
  id, productId, warehouseId, quantity
  status    -- pending | confirmed | released
  expiresAt -- createdAt + 10 minutes
```

When a reservation is **confirmed**: both `totalUnits` and `reservedUnits` are decremented, so available stock stays correct.

When a reservation is **released**: only `reservedUnits` is decremented, returning units to available.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List all products with available stock per warehouse |
| `GET` | `/api/warehouses` | List all warehouses |
| `POST` | `/api/reservations` | Create a reservation. Returns `409` if not enough stock |
| `GET` | `/api/reservations/:id` | Get a single reservation |
| `POST` | `/api/reservations/:id/confirm` | Confirm reservation. Returns `410` if expired |
| `POST` | `/api/reservations/:id/release` | Release reservation early |
| `GET` | `/api/cron/expire-reservations` | Release all expired reservations (cron only) |

---

## Running Locally

**1. Clone and install**

```bash
git clone https://github.com/kamaleshRanganathan/project-stock-hold
cd project-stock-hold
pnpm install
```

**2. Set up environment variables**

Create a `.env` file in the project root:

```env
DATABASE_URL="your-supabase-postgresql-connection-string"
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
CRON_SECRET="any-random-secret-string"
```

You will need:
- A free [Supabase](https://supabase.com) project — copy the connection string from Settings > Database > URI
- A free [Upstash](https://upstash.com) Redis database — copy the REST URL and token

**3. Run migrations**

```bash
npx prisma migrate dev
```

**4. Seed the database**

```bash
npx tsx prisma/seed.ts
```

This creates 2 warehouses, 3 products, and stock entries for each product per warehouse.

**5. Start the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

The app is deployed on Vercel. The database is hosted on Supabase and Redis on Upstash — both free tiers.

Steps to deploy:

1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add all four environment variables in the Vercel dashboard under Settings > Environment Variables
4. Deploy — Vercel picks up `vercel.json` and sets up the cron automatically

The cron job (`vercel.json`) runs every minute in production and handles reservation expiry automatically.

---

## Trade-offs and Limitations

**Redis lock vs Redlock** — This implementation uses a simple `SET NX` lock on a single Redis node rather than the full Redlock algorithm across multiple nodes. Redlock is designed for high-availability environments where a Redis node can fail mid-lock. Since this project uses a single Upstash instance, the simpler approach is correct for this scope. In production with strict availability requirements, Redlock would be the right call.

**Lock timeout** — The lock TTL is 5 seconds. If the database transaction takes longer (slow network, high load), the lock could expire before the transaction finishes, theoretically allowing a second request in. In practice this is unlikely with a managed database, but a watchdog pattern that extends the lock while the transaction is in flight would be more robust.

**No authentication** — Any user can confirm or release any reservation by ID. In production, reservations would be scoped to authenticated user sessions.

**No restocking API** — Stock only goes down. A warehouse manager interface to update `totalUnits` would be a natural next step.

**Cron processes reservations one by one** — For high volume this would be replaced with a single batched `UPDATE` query.

**No optimistic UI** — The frontend waits for API responses before updating state. Optimistic updates would make the experience feel faster.

---

## What I Would Do With More Time

- Implement idempotency on the reserve and confirm endpoints using Redis to store responses keyed by `Idempotency-Key` header, so client retries are safe
- Add authentication with NextAuth and scope reservations to user accounts
- Write integration tests specifically for the concurrent reservation scenario — spin up two simultaneous requests for the last unit and assert exactly one succeeds
- Add a warehouse manager view for restocking and viewing reservation history
- Replace the one-by-one expiry loop with a single batched database update

---

## Project Structure

```
src/
  app/
    page.tsx                          # Landing page
    dashboard/page.tsx                # Product listing
    products/[id]/page.tsx            # Product detail + reserve
    reservations/[id]/page.tsx        # Checkout + countdown
    api/
      products/route.ts
      warehouses/route.ts
      reservations/
        route.ts                      # POST create reservation
        [id]/
          route.ts                    # GET single reservation
          confirm/route.ts            # POST confirm
          release/route.ts            # POST release
      cron/
        expire-reservations/route.ts  # GET cron job
  lib/
    prisma.ts                         # Prisma client singleton
    redis.ts                          # Upstash Redis client
prisma/
  schema.prisma
  seed.ts
  migrations/
vercel.json                           # Cron job config
```