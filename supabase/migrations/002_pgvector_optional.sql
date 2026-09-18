-- OPTIONAL: enable after turning on the vector extension in Supabase Dashboard → Database → Extensions
create extension if not exists vector;

alter table public.memory_facts
  add column if not exists embedding vector(1536);

create index if not exists idx_memory_embedding
  on public.memory_facts
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
