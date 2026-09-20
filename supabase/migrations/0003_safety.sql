-- M4: host removal + blocks in the feed (enum value added in 0002_member_status_removed)

-- Host kicks a member. They stay on the row as 'removed' so join_popout can refuse them.
create or replace function remove_member(p uuid, u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_host(p) then raise exception 'not_host'; end if;
  if u = auth.uid() then raise exception 'host_cannot_leave'; end if;
  update popout_members set status = 'removed' where popout_id = p and user_id = u;
end;
$$;

-- join_popout: refuse removed members, keep everything else
create or replace function join_popout(p uuid) returns void
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
  if pop.min_age is not null and me.age < pop.min_age then raise exception 'not_eligible'; end if;
  if pop.max_age is not null and me.age > pop.max_age then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'women_only' and me.gender is distinct from 'woman' then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'men_only' and me.gender is distinct from 'man' then raise exception 'not_eligible'; end if;
  if is_blocked_either_way(pop.host_id) then raise exception 'not_eligible'; end if;
  select count(*) into n from popout_members where popout_id = p and status not in ('dropped', 'removed');
  if n >= pop.max_people then raise exception 'popout_full'; end if;
  insert into popout_members (popout_id, user_id, status) values (p, auth.uid(), 'joined')
  on conflict (popout_id, user_id) do update set status = 'joined', joined_at = now();
end;
$$;

-- Membership helper used by RLS treats removed like dropped
create or replace function is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from popout_members
    where popout_id = p and user_id = auth.uid() and status not in ('dropped', 'removed')
  );
$$;

-- Who have I blocked / who blocked me — for hiding pins in the feed
create or replace function my_blocked_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select blocked_id from blocks where blocker_id = auth.uid()
  union
  select blocker_id from blocks where blocked_id = auth.uid();
$$;

-- Messages carry the sender's name so realtime payloads don't need a join
alter table messages add column if not exists sender_name text;
