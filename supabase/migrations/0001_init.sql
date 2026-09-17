-- Popout V1 schema. Six tables. A Crew is a popout with event_id set.

create type member_status as enum ('joined', 'confirmed', 'attended', 'dropped', 'no_show');
create type popout_status as enum ('open', 'cancelled', 'done');
create type gender as enum ('man', 'woman', 'other');
create type gender_pref as enum ('anyone', 'women_only', 'men_only');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age int check (age between 18 and 99),
  gender gender,
  area text,
  photo_url text,
  bio text check (char_length(bio) <= 140),
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text not null,
  lat double precision not null,
  lng double precision not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  price text,
  booking_url text,
  organizer text,
  created_at timestamptz not null default now()
);

create table popouts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  title text not null check (char_length(title) <= 80),
  venue text not null,
  lat double precision not null,
  lng double precision not null,
  starts_at timestamptz not null,
  max_people int not null default 4 check (max_people between 2 and 6),
  min_age int check (min_age >= 18),
  max_age int check (max_age <= 99),
  gender_pref gender_pref not null default 'anyone',
  description text check (char_length(description) <= 280),
  status popout_status not null default 'open',
  created_at timestamptz not null default now()
);
create index popouts_active_idx on popouts (starts_at) where status = 'open';
create index popouts_bbox_idx on popouts (lat, lng);
create index events_bbox_idx on events (lat, lng);

create table popout_members (
  popout_id uuid not null references popouts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status member_status not null default 'joined',
  joined_at timestamptz not null default now(),
  primary key (popout_id, user_id)
);

create table messages (
  id bigint generated always as identity primary key,
  popout_id uuid not null references popouts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_popout_idx on messages (popout_id, created_at);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  subject_type text not null check (subject_type in ('profile', 'popout', 'message')),
  subject_id text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Helpers used by policies
create or replace function is_member(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from popout_members
    where popout_id = p and user_id = auth.uid() and status <> 'dropped'
  );
$$;

create or replace function is_host(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from popouts where id = p and host_id = auth.uid());
$$;

create or replace function is_blocked_either_way(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = auth.uid() and blocked_id = other)
       or (blocker_id = other and blocked_id = auth.uid())
  );
$$;

-- Auto-create profile from Google sign-in
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, photo_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Someone'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Host is always a member of their own popout
create or replace function add_host_as_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into popout_members (popout_id, user_id, status) values (new.id, new.host_id, 'confirmed');
  return new;
end;
$$;
create trigger on_popout_created
  after insert on popouts
  for each row execute function add_host_as_member();

-- Atomic join: eligibility + capacity checked under row lock so 4/4 never becomes 5/4
create or replace function join_popout(p uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  pop popouts%rowtype;
  me profiles%rowtype;
  n int;
begin
  select * into pop from popouts where id = p for update;
  if not found or pop.status <> 'open' then raise exception 'popout_not_open'; end if;
  if pop.starts_at < now() then raise exception 'popout_started'; end if;
  select * into me from profiles where id = auth.uid();
  if me.age is null then raise exception 'profile_incomplete'; end if;
  if pop.min_age is not null and me.age < pop.min_age then raise exception 'not_eligible'; end if;
  if pop.max_age is not null and me.age > pop.max_age then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'women_only' and me.gender is distinct from 'woman' then raise exception 'not_eligible'; end if;
  if pop.gender_pref = 'men_only' and me.gender is distinct from 'man' then raise exception 'not_eligible'; end if;
  if is_blocked_either_way(pop.host_id) then raise exception 'not_eligible'; end if;
  select count(*) into n from popout_members where popout_id = p and status <> 'dropped';
  if n >= pop.max_people then raise exception 'popout_full'; end if;
  insert into popout_members (popout_id, user_id, status) values (p, auth.uid(), 'joined')
  on conflict (popout_id, user_id) do update set status = 'joined', joined_at = now();
end;
$$;

create or replace function leave_popout(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if is_host(p) then raise exception 'host_cannot_leave'; end if;
  update popout_members set status = 'dropped' where popout_id = p and user_id = auth.uid();
end;
$$;

-- RLS
alter table profiles enable row level security;
alter table events enable row level security;
alter table popouts enable row level security;
alter table popout_members enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

create policy "profiles are public" on profiles for select using (true);
create policy "own profile" on profiles for update using (auth.uid() = id);

create policy "events are public" on events for select using (true);

create policy "popouts are public" on popouts for select using (true);
create policy "create popout" on popouts for insert with check (auth.uid() = host_id);
create policy "host edits popout" on popouts for update using (auth.uid() = host_id);

create policy "members are public" on popout_members for select using (true);
create policy "host removes or marks members" on popout_members for update using (is_host(popout_id));
create policy "member updates own status" on popout_members for update using (auth.uid() = user_id);

create policy "members read thread" on messages for select using (is_member(popout_id));
create policy "members post" on messages for insert with check (auth.uid() = user_id and is_member(popout_id));

create policy "file report" on reports for insert with check (auth.uid() = reporter_id);

create policy "own blocks" on blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Realtime for group thread
alter publication supabase_realtime add table messages;
