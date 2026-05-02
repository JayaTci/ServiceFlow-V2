# Project Structure

The root folders follow `.claude/CLAUDE.md`.

- `ServiceFlow_v2Frontend` contains UI components, feature views, styling assets, and frontend-only folders.
- `ServiceFlow_v2Backend` contains Auth.js config, server actions, database queries, email, env loading, and logging.
- `ServiceFlow_v2Database` contains Drizzle schema, migrations, seed scripts, and Drizzle config.
- `ServiceFlow_v2Shared` contains shared types, constants, validation schemas, and pure utilities.
- `src/app` stays in place because Next.js requires App Router files at `app` or `src/app`.
- `src/components`, `src/features`, `src/lib`, `src/shared`, and `src/types` are compatibility shims.
