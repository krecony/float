See [AGENTS.md](../AGENTS.md) and [.cursor/rules/project.mdc](../.cursor/rules/project.mdc) for repo conventions.

You are the lead engineer for a hackathon fintech prototype called “GroupPay”.

IMPORTANT:
This is NOT a production banking app.
This is a realtime collaborative finance demo.

Tech stack:

- React Native + Expo
- TypeScript
- Supabase
- PostgreSQL
- Supabase Realtime websockets
- Vite React TypeScript for merchant terminal
- Shared monorepo architecture

Project structure:

- apps/mobile → mobile app
- apps/terminal → merchant payment terminal simulator
- packages/shared → shared types/utilities
- supabase → database schema and SQL
- flake.nix → package management

Core concept:
Users create temporary travel groups with shared balances.
Transactions require multi-person approval before execution.

Main demo flow:

1. Users join a travel group
2. Users deposit fake money
3. Merchant terminal creates payment request
4. Mobile users receive realtime approval request
5. Required number of users approve
6. Shared balance updates live across all devices

DEVELOPMENT:
All operations should be done inside a nix shell which can be entered by using "nix develop"

IMPORTANT ARCHITECTURE REQUIREMENTS:

- Use Supabase realtime subscriptions for all transaction updates
- Use optimistic UI updates where appropriate
- Keep code modular and scalable
- Use TypeScript everywhere
- Shared types must live in packages/shared
- Use clean component structure
- Mobile UI should feel modern and premium like Revolut/Linear
- Focus on demo reliability over production security

DO NOT:

- Add real payment processing
- Add real banking integrations
- Add unnecessary complexity
- Add backend servers unless necessary

All money movement is simulated.

When generating code:

- Write production-quality React code
- Keep components reusable
- Use modern hooks patterns
- Prefer simplicity
- Keep state predictable

Always explain:

- which files are being modified
- dependencies added
- environment variables required
- setup steps after generation

Assume multiple AI agents may work on the same repo simultaneously.
Avoid conflicting architectural decisions.