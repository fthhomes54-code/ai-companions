# Companion1

User-generated AI companion platform — Chinese viral **emotional-attachment** style.

Create someone who feels alive: long-term memory, proactive holiday/birthday notes, voice messages, optional self-photos. Stripe subscribe is stubbed for later.

## Quick start

1. Clone · copy `.env.example` → `.env.local` and fill keys (see below).
2. In Supabase SQL editor, run `supabase/migrations/001_companion_schema.sql`.  
   Optional: enable `vector` extension, then run `002_pgvector_optional.sql`.
3. Auth → URL config: add `http://localhost:3000/auth/callback` (and your prod URL).
4. `npm install` · `npm run dev` · open http://localhost:3000

## Product flow

1. **Create** — name, age, personality, backstory, tone, example lines, voice style + **18+ gate**. Builds a rich system prompt stored on the user account.
2. **Chat** — messages persist in Supabase; memory facts extracted after replies and injected into prompts.
3. **Voice** — Mic → Whisper STT · Speak → TTS.
4. **Outreaches** — Vercel Cron hits `/api/cron/outreaches` for Valentine's, Christmas, New Year, birthday, major holidays (LLM-written, not templates). See [docs/CRON.md](docs/CRON.md).
5. **Images** — optional DALL·E when `ENABLE_IMAGE_GEN=true`.
6. **Stripe** — `subscriptions` table stub; Checkout later.

## Stack

- Next.js 14 (App Router) + TypeScript  
- Supabase Auth (SSR cookies) + Postgres RLS  
- OpenAI-compatible LLM / Whisper / TTS / DALL·E  
- Vercel Cron  

## Env vars Don must provide

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | yes | Chat, memory extract, outreaches, STT/TTS |
| `OPENAI_BASE_URL` | no | Default OpenAI; set for compatible proxies |
| `OPENAI_MODEL` | no | Default `gpt-4o-mini` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes* | Auth + DB |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes* | Browser + SSR client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes* | Cron outreaches (bypasses RLS) |
| `CRON_SECRET` | yes* | Protect `/api/cron/outreaches` |
| `ENABLE_IMAGE_GEN` / `NEXT_PUBLIC_ENABLE_IMAGE_GEN` | no | DALL·E self-photos (`true` to enable) |
| `STRIPE_*` | later | Subscription stub |

\*Required for persistence & cron. Guest create/chat works locally without Supabase but will not save memory.

## Scripts

- `npm run dev` — local  
- `npm run build` — production build (must pass)  

## Safety

Adults only (18+ gate on create). Romantic tone must stay consensual. No secrets in the repo.
