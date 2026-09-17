create table if not exists public.cities (
  slug text primary key,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.city_questions (
  id uuid primary key default gen_random_uuid(),
  city_slug text not null references public.cities(slug) on delete cascade,
  source_key text not null,
  question text not null,
  answers jsonb not null check (jsonb_typeof(answers) = 'array'),
  correct_index smallint not null check (correct_index between 0 and 3),
  category text not null default 'gradovi',
  source_url text,
  source_type text not null default 'verified' check (source_type in ('verified', 'online')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_slug, source_key)
);

create index if not exists city_questions_city_idx
  on public.city_questions (city_slug, active);

create index if not exists city_questions_source_idx
  on public.city_questions (source_type);

alter table public.cities enable row level security;
alter table public.city_questions enable row level security;

revoke all on public.cities from anon, authenticated;
revoke all on public.city_questions from anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.city_questions to anon, authenticated;

drop policy if exists cities_public_read on public.cities;
create policy cities_public_read
on public.cities for select
to anon, authenticated
using (active = true);

drop policy if exists city_questions_public_read on public.city_questions;
create policy city_questions_public_read
on public.city_questions for select
to anon, authenticated
using (active = true);

-- Data import/update is intentionally reserved for the server-side service role.
-- The browser never receives a service-role key.
