# GroupPay — Agent onboarding

Read [.cursor/rules/project.mdc](.cursor/rules/project.mdc) for product constraints (simulated money, no real banking).

## Repo map

```
apps/mobile/     Expo Router — consumer app
apps/terminal/   Vite — merchant payment requests
apps/web/        Vite — landing page
packages/shared/ @grouppay/shared — types, env, supabase, services
supabase/        SQL migrations
```

## Conventions

- **Types** live in `packages/shared` only.
- **DB access** goes through `packages/shared/src/services/*`, not ad-hoc queries in UI (groundwork pattern).
- **Realtime** via `packages/shared/src/supabase/realtime.ts`.
- Run commands inside `nix develop`.
- Install deps from repo root: `npm install`.

## Common tasks

| Task | Where to work |
|------|----------------|
| New screen | `apps/mobile/app/` |
| Schema change | `supabase/migrations/` + `packages/shared/src/types/` |
| API / business logic | `packages/shared/src/services/` |
| Terminal UI | `apps/terminal/src/` |

## Expo

Mobile uses Expo SDK 55 — see [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md).
