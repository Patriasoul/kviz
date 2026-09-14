-- PatriaSoul progression: run this after supabase/schema.sql

create table if not exists public.player_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('croatian', 'city', 'daily')),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  quizzes_played integer not null default 0 check (quizzes_played >= 0),
  best_percentage numeric(5,2) not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_played_date date,
  updated_at timestamptz not null default now(),
  primary key (user_id, quiz_type)
);

create table if not exists public.player_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('croatian', 'city', 'daily')),
  badge_id text not null,
  badge_name text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.player_progress enable row level security;
alter table public.player_badges enable row level security;

drop policy if exists player_progress_select_public on public.player_progress;
create policy player_progress_select_public on public.player_progress for select using (true);

drop policy if exists player_badges_select_public on public.player_badges;
create policy player_badges_select_public on public.player_badges for select using (true);

revoke insert, update, delete on public.player_progress from anon, authenticated;
revoke insert, update, delete on public.player_badges from anon, authenticated;

create or replace function public.record_quiz_progress(
  p_quiz_type text,
  p_score integer,
  p_total integer,
  p_time_seconds integer default null,
  p_xp integer default 0
)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_xp integer := 0;
  new_xp integer;
  old_level integer := 1;
  new_level integer;
  pct numeric(5,2);
  played integer := 0;
  best_pct numeric(5,2) := 0;
  streak integer := 0;
  best_streak integer := 0;
  last_date date;
  today date := current_date;
  badge_record record;
  new_badges json := '[]'::json;
begin
  if uid is null then raise exception 'Prijava je potrebna za napredovanje'; end if;
  if p_quiz_type not in ('croatian','city','daily') then raise exception 'Nepoznata vrsta kviza'; end if;
  if p_total <= 0 or p_score < 0 or p_score > p_total then raise exception 'Neispravan rezultat kviza'; end if;

  pct := round((p_score::numeric / p_total::numeric) * 100, 2);

  select xp, level, quizzes_played, best_percentage, current_streak, best_streak, last_played_date
    into old_xp, old_level, played, best_pct, streak, best_streak, last_date
  from public.player_progress
  where user_id = uid and quiz_type = p_quiz_type;

  if not found then
    old_xp := 0; old_level := 1; played := 0; best_pct := 0; streak := 0; best_streak := 0; last_date := null;
  end if;

  if p_quiz_type = 'daily' then
    if last_date = today - 1 then streak := streak + 1;
    elsif last_date = today then streak := greatest(streak, 1);
    else streak := 1;
    end if;
  end if;

  new_xp := old_xp + greatest(p_xp, 0);
  new_level := greatest(1, floor(new_xp / 100) + 1);
  played := played + 1;
  best_pct := greatest(best_pct, pct);
  best_streak := greatest(best_streak, streak);

  insert into public.player_progress(user_id, quiz_type, xp, level, quizzes_played, best_percentage, current_streak, best_streak, last_played_date)
  values(uid, p_quiz_type, new_xp, new_level, played, best_pct, streak, best_streak, today)
  on conflict (user_id, quiz_type) do update set
    xp = excluded.xp,
    level = excluded.level,
    quizzes_played = excluded.quizzes_played,
    best_percentage = excluded.best_percentage,
    current_streak = excluded.current_streak,
    best_streak = excluded.best_streak,
    last_played_date = excluded.last_played_date,
    updated_at = now();

  -- Main level badges. Award the highest newly reached badge, if any.
  for badge_record in
    select * from (values
      ('1',1),('10',10),('20',20),('30',30),('40',40),('50',50),('60',60),('70',70),('80',80),('90',90)
    ) as b(badge_level, required_level)
    where new_level >= required_level
  loop
    insert into public.player_badges(user_id, quiz_type, badge_id, badge_name)
    values(uid, p_quiz_type, p_quiz_type || '_level_' || badge_record.badge_level, 'Level ' || badge_record.badge_level)
    on conflict (user_id, badge_id) do nothing;
  end loop;

  return json_build_object(
    'quiz_type', p_quiz_type,
    'xp_earned', greatest(p_xp, 0),
    'xp', new_xp,
    'level', new_level,
    'previous_level', old_level,
    'quizzes_played', played,
    'best_percentage', best_pct,
    'current_streak', streak,
    'best_streak', best_streak
  );
end;
$$;

revoke all on function public.record_quiz_progress(text, integer, integer, integer, integer) from public;
grant execute on function public.record_quiz_progress(text, integer, integer, integer, integer) to authenticated;
