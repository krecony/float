# Onboarding

## Prerequisites

- Nix with flakes
- Supabase project (cloud) or local Supabase CLI
- Node 20 (via `nix develop`)

## Setup

```bash
cd /path/to/slop
nix develop
cp .env.example .env
# Fill EXPO_PUBLIC_* and VITE_* from Supabase dashboard → Settings → API
npm install
supabase link    # once
supabase db push
```

## Run apps

```bash
npm run dev:mobile    # Expo with --tunnel --clear (physical Android / ADB)

If you still see the old “Open up App.tsx” screen, the phone is serving a **cached bundle** (Metro is already correct). On the emulator/device:

1. Stop Metro (Ctrl+C), run `npm run dev:mobile` again (clears Metro cache).
2. In Expo Go: remove the project or **Settings → Apps → Expo Go → Clear storage**.
3. Or: `adb shell pm clear host.exp.exponent` then scan the QR code again.
4. In the Metro terminal, press `r` to reload after the app opens.
npm run dev:terminal  # http://localhost:5173
npm run dev:web       # http://localhost:5174
```

## Working with AI

Point your agent at these files for context:

| Task | @-mention |
|------|-----------|
| Product rules | `.cursor/rules/project.mdc` |
| Repo map | `AGENTS.md` |
| Schema | `docs/DATABASE.md`, `supabase/migrations/` |
| Types / API | `packages/shared/src/` |
| Mobile UI | `apps/mobile/app/` |
| Terminal | `apps/terminal/src/` |

### Example prompts

- “Add a deposit flow that increments `groups.balance_cents`” → mention `services/groups.ts` and RLS
- “Show participant names on the approvals screen” → join `transaction_participants` with `users`
- “Fix realtime not updating group overview” → check `subscribeToGroupTransactions` and publication

### Do

- Keep types in `@grouppay/shared`
- Use `nix develop` for shell commands
- Update `docs/DATABASE.md` when changing schema

### Don’t

- Store real card numbers or run real payments
- Add a custom Express/Fastify API without team agreement
- Bypass shared services for DB access in UI layers

## Product checklist

See [plan.md](plan.md) for the full feature list. [ARCHITECTURE.md](ARCHITECTURE.md) maps each item to code.
