-- "Launch here" waitlist from outside Bangalore. Anyone can add one row; only admins read them.
create table if not exists launch_requests (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  lat double precision,
  lng double precision,
  user_id uuid references profiles(id) on delete set null,
  email text,
  created_at timestamptz not null default now()
);
create index if not exists launch_requests_city_idx on launch_requests (lower(city));
alter table launch_requests enable row level security;
create policy "anyone can request" on launch_requests for insert to anon, authenticated with check (true);

create or replace function launch_demand() returns table (city text, requests bigint, latest timestamptz)
language sql stable security definer set search_path = public as $$
  select initcap(city), count(*), max(created_at) from launch_requests
  where is_admin()
  group by initcap(city) order by count(*) desc, max(created_at) desc;
$$;
