# Architecture

See also the product checklist in [plan.md](plan.md).

## Monorepo

```mermaid
flowchart TB
  Mobile[apps/mobile]
  Terminal[apps/terminal]
  Web[apps/web]
  Shared[packages/shared]
  Supabase[(Supabase)]
  Mobile --> Shared
  Terminal --> Shared
  Web --> Shared
  Shared --> Supabase
```

| Package / app | Role |
|---------------|------|
| `packages/shared` | Types, env validation, Supabase client, realtime helpers, service layer |
| `apps/mobile` | Expo Router consumer app |
| `apps/terminal` | Vite merchant terminal |
| `apps/web` | Marketing landing |

There is **no custom Node API**. Supabase Auth + PostgREST + Realtime implement server behavior.

## docs/plan.md coverage

| Feature | Status in groundwork |
|---------|----------------------|
| group ↔ people M:N | `group_members` |
| group → transactions | `transactions` |
| person card info | `payment_methods` |
| person legal / ID | `users` + `verify-id` screen |
| transaction participant subset | `transaction_participants` |
| API: user / group / join / transaction | `packages/shared/src/services/*` |
| Create account | `login` + anonymous auth |
| Verify ID | `verify-id` |
| Create / join group | `group/create`, `group/join` |
| Spend / approve | terminal + `approvals` tab |
| Group view | `group/index` |
| Landing site | `apps/web` |

## Mobile navigation

```mermaid
flowchart TD
  Login --> Verified{id_verified?}
  Verified -->|no| VerifyId
  VerifyId --> PaymentMethod
  PaymentMethod --> HasGroup{active group?}
  Verified -->|yes| HasGroup
  HasGroup -->|no| JoinOrCreate
  HasGroup -->|yes| Tabs[Group / Wallet / Approvals / Members]
```

**Approvals “notifications”:** `usePendingApprovals` subscribes to realtime `transactions` inserts/updates; tab badge shows pending count. Push notifications are a later addition.

## Realtime

Enabled tables: `transactions`, `transaction_approvals`, `transaction_participants`.

Helpers live in `packages/shared/src/supabase/realtime.ts`.

## Extension points

- Approval quorum and balance updates → `services/transactions.ts` + DB triggers (later)
- Production RLS → new migration tightening policies
- Type codegen → `supabase gen types typescript`
