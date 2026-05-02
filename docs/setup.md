# Developer Setup

Use `pnpm` for all package operations.

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Run these checks before handing off changes:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```
