-- Selfie verification: private upload, admin eyeballs it, badge on approval.

alter table profiles
  add column if not exists selfie_path text,
  add column if not exists selfie_submitted_at timestamptz,
  add column if not exists verified_at timestamptz;

alter table popouts add column if not exists verified_only boolean not null default false;

-- Who can approve. Emails, so no UUID juggling.
create table if not exists admins (email text primary key);
alter table admins enable row level security;
insert into admins (email) values ('shuvams100@gmail.com') on conflict do nothing;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = auth.jwt() ->> 'email');
$$;

-- Private bucket; each user writes only their own file
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('selfies', 'selfies', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "own selfie upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own selfie replace" on storage.objects for update to authenticated
  using (bucket_id = 'selfies' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admins read selfies" on storage.objects for select to authenticated
  using (bucket_id = 'selfies' and is_admin());

-- User records that they've submitted; admin approves or rejects
create or replace function submit_selfie(path text) returns void
language sql security definer set search_path = public as $$
  update profiles set selfie_path = path, selfie_submitted_at = now(), verified_at = null where id = auth.uid();
$$;

create or replace function review_selfie(u uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  if approve then
    update profiles set verified_at = now() where id = u;
  else
    update profiles set verified_at = null, selfie_submitted_at = null, selfie_path = null where id = u;
  end if;
end;
$$;

-- Admin queue: pending selfies
create or replace function pending_selfies() returns table (id uuid, name text, age int, selfie_path text, submitted_at timestamptz)
language sql stable security definer set search_path = public as $$
  select id, name, age, selfie_path, selfie_submitted_at
  from profiles
  where is_admin() and selfie_submitted_at is not null and verified_at is null
  order by selfie_submitted_at;
$$;

-- Verified-only Popouts: join refuses the unverified
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
  if pop.verified_only and me.verified_at is null then raise exception 'not_verified'; end if;
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
