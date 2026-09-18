-- AI Companions schema
-- Run this in your Postgres / Supabase SQL editor

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists companions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id) on delete cascade,
  name text not null,
  personality text,
  backstory text,
  tone text default 'friendly',
  example_lines text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id bigserial primary key,
  companion_id uuid references companions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_companions_owner on companions(owner_id);
create index if not exists idx_companions_public on companions(is_public) where is_public = true;
create index if not exists idx_messages_companion on messages(companion_id);