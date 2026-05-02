# API Notes

ServiceFlow uses Next.js route handlers only where the framework requires them.

Current API entrypoints:

- `src/app/api/auth/[...nextauth]/route.ts` wires Auth.js handlers from `@backend/auth/config`.

Server mutations live in `ServiceFlow_v2Backend/src/features/*/actions.ts`.
Database reads live in `ServiceFlow_v2Backend/src/features/*/queries.ts`.
