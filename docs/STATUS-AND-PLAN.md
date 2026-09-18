# Companion — status (2026-09-18)

**Repo:** https://github.com/fthhomes54-code/ai-companions  
**Brand:** Companion

## Shipped in this branch

- Brand UI + landing emotional loop
- Create form (name, age, personality, backstory, tone, example lines, voice style, 18+)
- Rich `buildSystemPrompt` (`lib/prompt.ts`)
- Supabase Auth SSR + `/auth/callback`
- Migrations + RLS: profiles, companions, messages (modality), memory_facts, scheduled_outreaches, subscriptions stub
- Chat persists messages; extracts + injects memory facts
- `POST/GET /api/cron/outreaches` + `vercel.json` + docs/CRON.md
- Voice MVP: `/api/voice/stt`, `/api/voice/tts` + Mic/Speak in chat
- Optional image gen: `/api/image` env-flagged
- `.env.example` complete; Stripe stub tables only

## Next

- Stripe Checkout + webhook → `subscriptions`
- Public gallery
- pgvector similarity recall (optional migration ready)
