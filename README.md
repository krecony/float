# GroupPay

Hackathon prototype: collaborative group wallet with multi-person transaction approval. See [docs/plan.md](docs/plan.md) for the product checklist.

## Quick start

```bash
nix develop
cp .env.example .env   # add Supabase URL + anon key
npm install
supabase link          # once per machine
supabase db push

In Supabase Dashboard → Authentication → Providers, enable **Anonymous sign-in** for the mobile demo.
npm run dev:mobile     # Expo with --tunnel (for physical device / ADB)
npm run dev:terminal   # Merchant terminal
npm run dev:web        # Landing page
```

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/mobile` | Expo React Native app |
| `apps/terminal` | Vite merchant terminal |
| `apps/web` | Marketing landing |
| `packages/shared` | Types, Supabase client, services, realtime |
| `supabase/` | Migrations and config |

## Docs

- [AGENTS.md](AGENTS.md) — AI / agent onboarding
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/ONBOARDING.md](docs/ONBOARDING.md)
