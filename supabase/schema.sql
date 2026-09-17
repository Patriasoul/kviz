create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('croatian', 'city', 'daily')),
  category text,
  city_slug text,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  percentage numeric(5,2) generated always as (round((score::numeric / total::numeric) * 100, 2)) stored,
  time_seconds integer check (time_seconds is null or time_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists quiz_results_leaderboard_idx
  on public.quiz_results (quiz_type, percentage desc, time_seconds asc, created_at asc);
create index if not exists quiz_results_user_idx
  on public.quiz_results (user_id, created_at desc);

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

alter table public.profiles enable row level security;
alter table public.quiz_results enable row level security;
alter table public.cities enable row level security;
alter table public.city_questions enable row level security;

drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
on public.profiles for select
using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists quiz_results_select_own on public.quiz_results;
create policy quiz_results_select_own
on public.quiz_results for select
using (auth.uid() = user_id);

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

revoke insert, update, delete on public.quiz_results from anon, authenticated;
revoke insert, update, delete on public.cities from anon, authenticated;
revoke insert, update, delete on public.city_questions from anon, authenticated;

grant select on public.cities to anon, authenticated;
grant select on public.city_questions to anon, authenticated;

create or replace function public.record_quiz_result(
  p_quiz_type text,
  p_category text default null,
  p_city_slug text default null,
  p_score integer default 0,
  p_total integer default 0,
  p_time_seconds integer default null
)
returns public.quiz_results
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_result public.quiz_results;
begin
  if auth.uid() is null then
    raise exception 'Prijava je potrebna za spremanje rezultata';
  end if;

  if p_quiz_type not in ('croatian', 'city', 'daily') then
    raise exception 'Nepoznata vrsta kviza';
  end if;

  if p_total <= 0 or p_score < 0 or p_score > p_total then
    raise exception 'Neispravan rezultat kviza';
  end if;

  if p_time_seconds is not null and p_time_seconds < 0 then
    raise exception 'Neispravno vrijeme kviza';
  end if;

  insert into public.quiz_results (
    user_id, quiz_type, category, city_slug, score, total, time_seconds
  )
  values (
    auth.uid(), p_quiz_type, p_category, p_city_slug, p_score, p_total, p_time_seconds
  )
  returning * into inserted_result;

  return inserted_result;
end;
$$;

revoke all on function public.record_quiz_result(text, text, text, integer, integer, integer) from public;
grant execute on function public.record_quiz_result(text, text, text, integer, integer, integer) to authenticated;

create or replace view public.quiz_leaderboard as
select
  r.id,
  r.quiz_type,
  r.category,
  r.city_slug,
  r.score,
  r.total,
  r.percentage,
  r.time_seconds,
  r.created_at,
  coalesce(nullif(p.display_name, ''), 'Igrač') as user_name
from public.quiz_results r
left join public.profiles p on p.id = r.user_id;

grant select on public.quiz_leaderboard to anon, authenticated;
