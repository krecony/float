# Float

A real-time collaborative payments demo built for the open track of the [Rotterdam Buildathon](https://www.buildathon.eu/).
Groups of travellers share a virtual debit card. Every purchase requires multi-person approval before it goes through.

---

## What it does

1. **Create or join a travel group** — invite friends with a shareable code
2. **Get a group virtual card** — provisioned automatically on group creation
3. **Pay via NFC** — We allow NFC payments to make the experience hassle free for everyone
4. **Choose who splits** — the payer picks which group members share the cost and adds a description
5. **Everyone approves** — selected members get a push notification and tap Approve or Reject
6. **Live status** — all member devices update in real time as votes come in

All money movement is **simulated**. There are no real banking integrations.

---

## Apps

| App | Path | Description |
|-----|------|-------------|
| **Float** (mobile) | `apps/mobile` | Consumer app — groups, virtual card, NFC payment, approvals |
| **Float Terminal** (mobile) | `apps/terminal-mobile` | Merchant terminal — enter amount, read NFC, show approval status |
| **Landing page** | `website` | Marketing site |
| **Shared package** | `packages/shared` | Types, Supabase client, realtime helpers, service layer |

---

## Tech stack

- **React Native + Expo** (SDK 55, Expo Router, dev build)
- **TypeScript** everywhere
- **Supabase** — Auth, PostgreSQL, Realtime websockets
- **Vite + React** — web terminal and landing page
- **NFC** — `react-native-hce` (payer phone emulates a card) · `react-native-nfc-manager` (terminal reads tag)
- **Nix flake** — reproducible dev shell with Android SDK

---

## NFC payment flow

```
Payer phone                        Float Terminal
──────────────────────────────     ─────────────────────────────
Open group → "Pay with NFC"        Enter amount → "Open terminal"
HCE broadcasts GP|groupId|userId ──► NFC read
Subscribe to broadcast channel ◄── Subscribe to same channel
                                   Broadcast CHARGE_REQUEST {amountCents}
Show split form (amount, who)  ◄──
Payer confirms ──────────────────► Receive SPLIT_CONFIRMED
                                   {description, participantIds}
                                   Show charge screen → press Charge
                                   createTransaction(participants) ──► Supabase
Each participant:
  Receive push notification ◄───────────────────────────────────────── tx_participants INSERT
  Tap Approve / Reject
  finalizeIfComplete() ──────────────────────────────────────────────► transactions UPDATE
Terminal shows ✓ / ✕ ◄──────────────────────────────────────────────── realtime onUpdate
```

The NFC handshake uses **Supabase Realtime broadcast** (ephemeral, no DB) so the split is confirmed _before_ any transaction is created.

---

## Project structure

```
apps/
  mobile/               Expo Router app (consumer)
  terminal-mobile/      Expo Router app (Float Terminal)
website/                Landing Page
packages/
  shared/               @grouppay/shared
    src/
      types/            domain.ts — all shared TypeScript types
      supabase/         client.ts · realtime.ts
      services/         groups.ts · transactions.ts · users.ts · virtualCards.ts
supabase/
  migrations/           SQL schema files
flake.nix               Nix dev shell (Node 20 + Android SDK)
```

---

## Prerequisites

- [Nix](https://nixos.org/download/) with flakes enabled
- A [Supabase](https://supabase.com) project (free tier works)
- An Android device with NFC (for the full NFC flow)

---

## Setup

```bash
# 1. Enter the dev shell (installs Node 20, Android SDK, etc.)
nix develop

# 2. Copy env template and fill in your Supabase credentials
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
#             VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 3. Install dependencies
npm install

# 4. Apply the database schema
supabase link       # connect to your Supabase project
supabase db push    # run all migrations
```

### Supabase Auth setup

This app uses **Email** provider with synthetic addresses (`name@grouppay.demo`). No real email is needed.

1. Supabase Dashboard → **Authentication → Providers** → enable **Email**
2. Disable **Confirm email** (or enable auto-confirm) for frictionless demo sign-ups
3. Set `EXPO_PUBLIC_DEMO_AUTH_PASSWORD` in `.env` (default: `grouppay-demo`)

---

## Running locally

All commands must be run inside `nix develop`.

```bash
# Float mobile app (physical Android device via ADB or tunnel)
npm run dev:mobile

# Float Terminal mobile app
npm run dev:terminal-mobile

# Web terminal (browser)
npm run dev:terminal        # http://localhost:5173

# Landing page
npm run dev:web             # http://localhost:5174
```

### First run on a physical device

The mobile apps require an Expo **development build** (not Expo Go) because they use native NFC modules.

```bash
# Build and install the Float dev build on a connected device
cd apps/mobile
npx expo run:android

# Build and install the Float Terminal dev build
cd apps/terminal-mobile
npx expo run:android
```

After the native build is installed once, `npm run dev:mobile` / `npm run dev:terminal-mobile` will hot-reload JavaScript changes without rebuilding.

---

## Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | mobile, terminal-mobile | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile, terminal-mobile | Supabase anon key |
| `VITE_SUPABASE_URL` | terminal (web), web | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | terminal (web), web | Supabase anon key |
| `EXPO_PUBLIC_DEMO_AUTH_PASSWORD` | mobile | Shared demo login password |
| `VITE_DEMO_AUTH_PASSWORD` | terminal (web) | Shared demo login password |

---

## Database schema

| Table | Purpose |
|-------|---------|
| `users` | Profile linked to Supabase Auth |
| `payment_methods` | Card-on-file per user |
| `groups` | Travel group with invite code |
| `group_members` | M:N users ↔ groups |
| `virtual_cards` | One virtual card per group |
| `transactions` | Purchase records (`pending → completed / rejected`) |
| `transaction_participants` | Which members share a given transaction |
| `transaction_approvals` | Per-member approve/reject votes |

Realtime is enabled on `transactions`, `transaction_approvals`, `transaction_participants`, and `group_members`.

---

## Architecture notes

- **No custom API server.** All server-side behaviour is handled by Supabase (Auth, PostgREST, Realtime, RLS).
- **All DB access goes through `packages/shared/src/services/`** — no ad-hoc queries in UI code.
- **Realtime helpers** live in `packages/shared/src/supabase/realtime.ts`.
- **RLS policies** are permissive (demo mode) — a production app would tighten these per user/group membership.
- **Approval finalization** is client-driven: the last voter to submit calls `finalizeTransactionIfComplete`, which queries participants + approvals and updates the transaction status. A DB trigger would be cleaner for production.

---

## Scripts reference

```bash
npm install                   # install all workspaces
npm run dev:mobile            # Expo dev server for Float
npm run dev:terminal-mobile   # Expo dev server for Float Terminal
npm run dev:terminal          # Vite dev server for web terminal
npm run dev:web               # Vite dev server for landing page
```

---

## Disclaimer

This is a hackathon prototype. It uses simulated payments only and is not suitable for production use without significant security hardening (RLS, input validation, server-side approval logic, real payment processor integration).
