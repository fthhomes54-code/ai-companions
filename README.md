# AI Companions

User-generated AI companion platform. People create their own AI girlfriends, boyfriends, friends, or mentors. Chat with memory, share publicly, and subscribe for more.

## Quick Start (Local)
1. Clone this repo.
2. Copy `.env.example` to `.env` and add your OpenAI (or compatible) API key.
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth) or any Postgres
- OpenAI-compatible LLM API
- Stripe for subscriptions (later)

## Core Flow
- User signs up
- Creates a companion: name, personality, backstory, tone, example lines
- System builds a system prompt from that
- Chat with memory of past conversations
- Optional: publish to public gallery

Built step by step. Next: full chat UI + memory + auth.