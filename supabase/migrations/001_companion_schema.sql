-- Companion product schema + RLS
-- Apply via Supabase SQL editor or CLI.
-- Embeddings: optional. Run 002_pgvector.sql after enabling the vector extension.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  birthday date,
  timezone text default 'America/Chicago',
  age_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age int,
  personality text,
  backstory text,
  tone text default 'warm',
  example_lines text,
  voice_style text default 'soft',
  system_prompt text not null,
  avatar_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigserial primary key,
  companion_id uuid not null references public.companions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  modality text not null default 'text' check (modality in ('text', 'voice', 'image')),
  media_url text,
  created_at timestamptz not null default now()
);

-- Long-term memory facts (JSONB metadata; embedding via optional 002 migration)
create table if not exists public.memory_facts (
  id bigserial primary key,
  companion_id uuid not null references public.companions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fact text not null,
  category text default 'general',
  importance int not null default 5 check (importance between 1 and 10),
  metadata jsonb default '{}'::jsonb,
  last_recalled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.scheduled_outreaches (
  id bigserial primary key,
  companion_id uuid not null references public.companions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occasion text not null,
  scheduled_for date not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  message_id bigint references public.messages(id) on delete set null,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (companion_id, occasion, scheduled_for)
);

-- Stripe subscription stub
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  plan text default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_companions_owner on public.companions(owner_id);
create index if not exists idx_companions_public on public.companions(is_public) where is_public = true;
create index if not exists idx_messages_companion on public.messages(companion_id, created_at);
create index if not exists idx_memory_companion on public.memory_facts(companion_id, importance desc);
create index if not exists idx_outreaches_pending on public.scheduled_outreaches(status, scheduled_for)
  where status = 'pending';

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.subscriptions (user_id, status, plan)
  values (new.id, 'inactive', 'free')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.companions enable row level security;
alter table public.messages enable row level security;
alter table public.memory_facts enable row level security;
alter table public.scheduled_outreaches enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "companions_select_own_or_public" on public.companions;
drop policy if exists "companions_insert_own" on public.companions;
drop policy if exists "companions_update_own" on public.companions;
drop policy if exists "companions_delete_own" on public.companions;
create policy "companions_select_own_or_public" on public.companions
  for select using (auth.uid() = owner_id or is_public = true);
create policy "companions_insert_own" on public.companions
  for insert with check (auth.uid() = owner_id);
create policy "companions_update_own" on public.companions
  for update using (auth.uid() = owner_id);
create policy "companions_delete_own" on public.companions
  for delete using (auth.uid() = owner_id);

drop policy if exists "messages_select_own" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

drop policy if exists "memory_select_own" on public.memory_facts;
drop policy if exists "memory_insert_own" on public.memory_facts;
drop policy if exists "memory_update_own" on public.memory_facts;
drop policy if exists "memory_delete_own" on public.memory_facts;
create policy "memory_select_own" on public.memory_facts
  for select using (auth.uid() = user_id);
create policy "memory_insert_own" on public.memory_facts
  for insert with check (auth.uid() = user_id);
create policy "memory_update_own" on public.memory_facts
  for update using (auth.uid() = user_id);
create policy "memory_delete_own" on public.memory_facts
  for delete using (auth.uid() = user_id);

drop policy if exists "outreaches_select_own" on public.scheduled_outreaches;
create policy "outreaches_select_own" on public.scheduled_outreaches
  for select using (auth.uid() = user_id);

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
