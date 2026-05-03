# ServiceFlow

A full-stack internal service request management system built for teams that want clarity over chaos. Submit, assign, track, and resolve every internal request in one place, with a complete audit trail at every step.

**Live demo:** *(add Vercel URL after deploy)*

---

## What it does

ServiceFlow gives your team a single place to handle internal requests, whether that is IT support tickets, document processing, facility maintenance, or office supply orders. Admins get a dashboard with analytics, a full activity log, and the ability to assign requests to specific people. Regular users can submit requests, track their status, and comment directly on a ticket.

There is no public sign-up. Accounts are created and managed by admins through the Users panel. This keeps the system clean and avoids the usual sprawl you get with open registration.

---

## Features

| Feature | Details |
|---------|---------|
| Request tracking | Submit, categorize, and track requests from open to resolved |
| Real-time dashboard | KPI cards, status distribution, department breakdown, monthly trend |
| Role-based access | Superadmin, Admin, and User roles with enforced hierarchy |
| Activity log | Immutable per-request timeline covering every status change, edit, assignment, and comment |
| Threaded comments | Users can add and edit their own comments; only admins can delete |
| Assignee field | Admins can assign requests to specific users |
| Email notifications | Automatic emails on new requests, status changes, assignments, and comments |
| Password reset | Secure token-based reset flow with 1-hour expiry |
| Admin user management | Create users, reset passwords, change roles, and deactivate accounts with no public signup |
| Global activity feed | Admin-only view of the last 100 events across all requests |
| Profile page | Users update their name, department, and password |
| Dark and light themes | Both fully designed, switchable from the header |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript 5 strict mode |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (JWT, Credentials provider) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Email | Resend |
| Validation | Zod |
| Charts | Recharts |
| Forms | React Hook Form |
| Deployment | Vercel |

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/JayaTci/ServiceFlow-V2.git
cd ServiceFlow-V2/ServiceFlow_v2
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase pooler connection string |
| `AUTH_SECRET` | 32-byte random secret — run `openssl rand -base64 32` |
| `AUTH_URL` | Full URL of your app (e.g. `http://localhost:3000`) |
| `RESEND_API_KEY` | From resend.com |
| `EMAIL_FROM` | Sender address, e.g. `noreply@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Same as AUTH_URL |

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Seed the database

```bash
pnpm db:seed
```

This is a destructive local sample-data seed. It clears existing users and requests, then creates three bootstrap accounts:

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@serviceflow.com | local@dm1n123 |
| Admin | maria@serviceflow.com | admin123 |
| User | john@serviceflow.com | user123 |

### 6. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
ServiceFlow_v2Frontend/
├── src/components/      # Reusable UI and layout components
├── src/features/        # Domain-specific React components
└── src/assets/styles/   # Global styling

ServiceFlow_v2Backend/
├── src/auth/            # Auth.js configuration
├── src/features/        # Server actions and database queries by domain
├── src/email/           # Resend client and email templates
├── src/config/          # Environment validation
└── src/utils/           # Backend-only helpers

ServiceFlow_v2Database/
├── src/schema.ts        # Drizzle schema source of truth
├── src/client.ts        # Drizzle client
├── migrations/          # Generated migrations
└── seeds/               # Demo seed data

ServiceFlow_v2Shared/
├── src/constants/       # Cross-boundary constants
├── src/types/           # Shared TypeScript types
├── src/validation/      # Zod schemas
└── src/utils/           # Pure shared utilities

src/app/                 # Required Next.js App Router adapter
docs/                    # Setup, API, and architecture notes
infrastructure/          # Deployment and cloud config placeholder
scripts/                 # Automation placeholder
tests/                   # End-to-end tests only
```

`src/app` stays at the project root because Next.js only detects App Router routes from `app` or `src/app`. The other `src/components`, `src/features`, `src/lib`, `src/shared`, and `src/types` entries are thin compatibility shims. New code should import from `@frontend`, `@backend`, `@database`, or `@shared`.

### Quality checks

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

---

## Deployment on Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel and set the root directory to `ServiceFlow_v2`.
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. `AUTH_SECRET` is mandatory on Vercel. Generate one locally with `openssl rand -base64 32` and set the same value in the Vercel project.
5. Point `DATABASE_URL` at the same Supabase database you migrated and seeded. If the production database is empty, no bootstrap users will exist and sign-in will fail.
6. Run migrations against your production database before the first deploy:
   ```bash
   DATABASE_URL=<prod-url> pnpm db:migrate
   ```
7. If you need the default bootstrap accounts in production without wiping existing data, run:
   ```bash
   DATABASE_URL=<prod-url> pnpm db:bootstrap-users
   ```
8. Deploy. Vercel detects Next.js automatically.

For Supabase, use the pooler connection string with `?pgbouncer=true&connection_limit=1` for serverless compatibility.

---

## Demo accounts

After seeding, log in at `/login` with:

- **Superadmin:** admin@serviceflow.com / local@dm1n123
- **Admin:** maria@serviceflow.com / admin123
- **User:** john@serviceflow.com / user123

These are for local development only. Rotate or remove them before production.

---

## Contributing

This project is a portfolio piece, but pull requests are welcome for bug fixes and small improvements. Open an issue first for anything larger.

---

## License

MIT
