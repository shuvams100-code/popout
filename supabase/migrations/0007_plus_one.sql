-- Bring a friend: a member can hold two seats. Capacity counts seats, not rows.

alter table popout_members add column if not exists plus_one boolean not null default false;

create or replace function seats_taken(p uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when plus_one then 2 else 1 end), 0)::int
  from popout_members where popout_id = p and status not in ('dropped', 'removed');
$$;

create or replace function join_popout(p uuid, plus_one boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare
  pop popouts%rowtype;
  me profiles%rowtype;
  n int;
  prev member_status;
begin
  select * into pop from popouts where id = p for update;
  if not found or pop.status <> 'open' then raise exception 'popout_not_open'; end if;
  if pop.starts_at < now() then raise exception 'popout_started'; end if;
  select status into prev from popout_members where popout_id = p and user_id = auth.uid();
  if prev = 'removed' then raise exception 'not_eligible'; end if;
  select * into me from profiles where id = auth.uid();
  if me.age is null then raise exception 'profile_incomplete'; end if;
  if pop.verified_only and me.verified_at is null then raise exception 'not_verified'; end if;
  if pop.min_age is not null and me.age < pop.min_age then raise exception 'not_eligible'; end if;
  if pop.max_age is not null and me.age > pop.max_age then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'women_only' and me.gender is distinct from 'woman' then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'men_only' and me.gender is distinct from 'man' then raise exception 'not_eligible'; end if;
  if is_blocked_either_way(pop.host_id) then raise exception 'not_eligible'; end if;
  n := seats_taken(p);
  if n + (case when plus_one then 2 else 1 end) > pop.max_people then raise exception 'popout_full'; end if;
  insert into popout_members (popout_id, user_id, status, plus_one) values (p, auth.uid(), 'joined', plus_one)
  on conflict (popout_id, user_id) do update set status = 'joined', joined_at = now(), plus_one = excluded.plus_one;
end;
$$;

-- Drop the old single-arg signature so PostgREST doesn't see two overloads
drop function if exists join_popout(uuid);
