-- PatriaSoul admin: user dashboard, account overview, result control and progression rebuild.
-- Run this once in Supabase SQL Editor after schema.sql and progression.sql.

alter table public.profiles
  add column if not exists role text not null default 'player'
  check (role in ('player', 'admin'));

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = ''
as $$ select exists (select 1 from public.profiles where id=(select auth.uid()) and role='admin'); $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.rebuild_player_progress(p_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r record; old_xp integer; streak integer; best_streak integer; last_date date; today date; quiz_xp integer; pct numeric(5,2);
begin
  delete from public.player_progress where user_id=p_user_id;
  delete from public.player_badges where user_id=p_user_id;
  for r in select id,quiz_type,score,total,created_at from public.quiz_results where user_id=p_user_id order by created_at asc,id asc loop
    select coalesce(xp,0),coalesce(current_streak,0),coalesce(best_streak,0),last_played_date into old_xp,streak,best_streak,last_date
      from public.player_progress where user_id=p_user_id and quiz_type=r.quiz_type;
    if not found then old_xp:=0; streak:=0; best_streak:=0; last_date:=null; end if;
    today:=timezone('Europe/Zagreb',r.created_at)::date;
    pct:=round((r.score::numeric/r.total::numeric)*100,2);
    if r.quiz_type='daily' then
      if last_date=today-1 then streak:=streak+1; elsif last_date=today then streak:=greatest(streak,1); else streak:=1; end if;
    else streak:=0; end if;
    quiz_xp:=50+(r.score*10);
    if pct=100 then quiz_xp:=quiz_xp+100; elsif pct>=90 then quiz_xp:=quiz_xp+50; elsif pct>=80 then quiz_xp:=quiz_xp+25; end if;
    if r.quiz_type='daily' then quiz_xp:=quiz_xp+25; end if;
    if r.quiz_type='daily' and streak=7 then quiz_xp:=quiz_xp+100; end if;
    if r.quiz_type='daily' and streak=30 then quiz_xp:=quiz_xp+500; end if;
    best_streak:=greatest(best_streak,streak);
    insert into public.player_progress(user_id,quiz_type,xp,level,quizzes_played,best_percentage,current_streak,best_streak,last_played_date)
    values(p_user_id,r.quiz_type,quiz_xp,greatest(1,floor(quiz_xp/100)+1),1,pct,streak,best_streak,today)
    on conflict(user_id,quiz_type) do update set
      xp=public.player_progress.xp+excluded.xp,
      level=greatest(1,floor((public.player_progress.xp+excluded.xp)/100)+1),
      quizzes_played=public.player_progress.quizzes_played+1,
      best_percentage=greatest(public.player_progress.best_percentage,excluded.best_percentage),
      current_streak=excluded.current_streak,best_streak=greatest(public.player_progress.best_streak,excluded.best_streak),last_played_date=excluded.last_played_date,updated_at=now();
  end loop;

  insert into public.player_badges(user_id,quiz_type,badge_id,badge_name)
  select p_user_id,p.quiz_type,p.quiz_type||'_level_'||b.required_level::text,
    case p.quiz_type
      when 'croatian' then case b.required_level when 1 then 'Početnik Hrvatske' when 10 then 'Poznavatelj' when 20 then 'Istraživač Hrvatske' when 30 then 'Čuvar baštine' when 40 then 'Poznavatelj Domovine' when 50 then 'Čuvar Domovine' when 60 then 'Učitelj baštine' when 70 then 'Čuvar znanja' when 80 then 'Patria znalac' else 'PatriaSoul legenda' end
      when 'city' then case b.required_level when 1 then 'Prvi stražar' when 10 then 'Branitelj' when 20 then 'Čuvar grada' when 30 then 'Ratnik grada' when 40 then 'Vitez grada' when 50 then 'Čuvar tvrđave' when 60 then 'Veliki branitelj' when 70 then 'Legenda grada' when 80 then 'Patria branitelj' else 'PatriaSoul legenda' end
      else case b.required_level when 1 then 'Prvi korak' when 10 then 'Ustrajni' when 20 then 'Redoviti' when 30 then 'Nepokolebljivi' when 40 then 'Majstor kontinuiteta' when 50 then 'Dnevni prvak' when 60 then 'Legenda dana' when 70 then 'Neprekidni niz' when 80 then 'Patria vjernik' else 'PatriaSoul legenda' end
    end
  from public.player_progress p cross join (values(1),(10),(20),(30),(40),(50),(60),(70),(80),(90)) b(required_level)
  where p.user_id=p_user_id and p.level>=b.required_level on conflict(user_id,badge_id) do nothing;

  if (select coalesce(sum(score),0) from public.quiz_results where user_id=p_user_id and quiz_type='croatian')>=10 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','croatian_first_10','Prvih 10') on conflict do nothing; end if;
  if (select count(*) from public.quiz_results where user_id=p_user_id and quiz_type='croatian' and percentage=100)>=1 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','croatian_perfect','Bez pogreške') on conflict do nothing; end if;
  if (select coalesce(quizzes_played,0) from public.player_progress where user_id=p_user_id and quiz_type='croatian')>=100 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','croatian_100_quizzes','Učenik baštine') on conflict do nothing; end if;
  if (select count(*) from public.quiz_results where user_id=p_user_id and quiz_type='croatian' and percentage>=90)>=50 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','croatian_90_50','Poznavatelj Domovine') on conflict do nothing; end if;
  if (select count(*) from public.quiz_results where user_id=p_user_id and quiz_type='croatian' and percentage=100)>=10 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','croatian_perfect_10','Majstor Hrvatske') on conflict do nothing; end if;
  if (select count(distinct city_slug) from public.quiz_results where user_id=p_user_id and quiz_type='city' and city_slug is not null)>=1 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'city','city_first','Prvi grad') on conflict do nothing; end if;
  if (select count(distinct city_slug) from public.quiz_results where user_id=p_user_id and quiz_type='city' and city_slug is not null)>=3 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'city','city_3','Tri grada') on conflict do nothing; end if;
  if (select count(distinct city_slug) from public.quiz_results where user_id=p_user_id and quiz_type='city' and city_slug is not null)>=10 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'city','city_10','Deset gradova') on conflict do nothing; end if;
  if (select count(distinct city_slug) from public.quiz_results where user_id=p_user_id and quiz_type='city' and city_slug is not null)>=25 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'city','city_25','Čuvar hrvatskih gradova') on conflict do nothing; end if;
  if (select count(*) from public.quiz_results where user_id=p_user_id and quiz_type='daily')>=1 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'daily','daily_first','Prvi dan') on conflict do nothing; end if;
  if (select coalesce(best_streak,0) from public.player_progress where user_id=p_user_id and quiz_type='daily')>=7 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'daily','daily_7','7 dana') on conflict do nothing; end if;
  if (select coalesce(best_streak,0) from public.player_progress where user_id=p_user_id and quiz_type='daily')>=30 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'daily','daily_30','30 dana') on conflict do nothing; end if;
  if (select coalesce(best_streak,0) from public.player_progress where user_id=p_user_id and quiz_type='daily')>=100 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'daily','daily_100','100 dana') on conflict do nothing; end if;
  if (select coalesce(best_streak,0) from public.player_progress where user_id=p_user_id and quiz_type='daily')>=365 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'daily','daily_365','365 dana') on conflict do nothing; end if;
  if (select count(*) from public.player_progress where user_id=p_user_id and quiz_type in('croatian','city','daily'))=3 and (select coalesce(min(level),0) from public.player_progress where user_id=p_user_id and quiz_type in('croatian','city','daily'))>=50 then insert into public.player_badges(user_id,quiz_type,badge_id,badge_name) values(p_user_id,'croatian','patria_guardian','PATRIA SOUL — ČUVAR NASLJEĐA') on conflict(user_id,badge_id) do nothing; end if;
end;
$$;
revoke all on function public.rebuild_player_progress(uuid) from public,anon,authenticated;

create or replace function public.admin_list_quiz_results()
returns table(id uuid,user_id uuid,user_email text,user_name text,quiz_type text,category text,city_slug text,score integer,total integer,percentage numeric,time_seconds integer,created_at timestamptz)
language plpgsql security definer stable set search_path=''
as $$ begin
  if not public.is_admin() then raise exception 'Niste administrator.'; end if;
  return query select r.id,r.user_id,u.email::text,coalesce(nullif(p.display_name,''),'Igrač'),r.quiz_type,r.category,r.city_slug,r.score,r.total,r.percentage,r.time_seconds,r.created_at
  from public.quiz_results r left join auth.users u on u.id=r.user_id left join public.profiles p on p.id=r.user_id order by r.created_at desc;
end; $$;
revoke all on function public.admin_list_quiz_results() from public,anon;
grant execute on function public.admin_list_quiz_results() to authenticated;

create or replace function public.admin_list_users()
returns table(id uuid,email text,display_name text,role text,created_at timestamptz,last_sign_in_at timestamptz,total_quizzes bigint,total_xp bigint,last_quiz_at timestamptz)
language plpgsql security definer stable set search_path=''
as $$ begin
  if not public.is_admin() then raise exception 'Niste administrator.'; end if;
  return query
  select u.id,u.email::text,coalesce(nullif(p.display_name,''),'Igrač'),coalesce(p.role,'player'),u.created_at,u.last_sign_in_at,
    coalesce((select count(*) from public.quiz_results r where r.user_id=u.id),0),
    coalesce((select sum(pp.xp) from public.player_progress pp where pp.user_id=u.id),0),
    (select max(r.created_at) from public.quiz_results r where r.user_id=u.id)
  from auth.users u left join public.profiles p on p.id=u.id order by u.created_at desc;
end; $$;
revoke all on function public.admin_list_users() from public,anon;
grant execute on function public.admin_list_users() to authenticated;

create or replace function public.admin_dashboard_stats()
returns table(total_users bigint,active_users_30d bigint,total_results bigint,results_30d bigint,total_xp bigint)
language plpgsql security definer stable set search_path=''
as $$ begin
  if not public.is_admin() then raise exception 'Niste administrator.'; end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from auth.users where last_sign_in_at >= now()-interval '30 days'),
    (select count(*) from public.quiz_results),
    (select count(*) from public.quiz_results where created_at >= now()-interval '30 days'),
    (select coalesce(sum(xp),0) from public.player_progress);
end; $$;
revoke all on function public.admin_dashboard_stats() from public,anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

create or replace function public.admin_delete_quiz_result(p_result_id uuid)
returns json language plpgsql security definer set search_path=''
as $$ declare target_user uuid;
begin
  if not public.is_admin() then raise exception 'Niste administrator.'; end if;
  select user_id into target_user from public.quiz_results where id=p_result_id;
  if target_user is null then raise exception 'Rezultat nije pronađen.'; end if;
  delete from public.quiz_results where id=p_result_id;
  perform public.rebuild_player_progress(target_user);
  return json_build_object('deleted_result_id',p_result_id,'user_id',target_user);
end; $$;
revoke all on function public.admin_delete_quiz_result(uuid) from public,anon;
grant execute on function public.admin_delete_quiz_result(uuid) to authenticated;
