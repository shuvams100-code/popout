-- City unlock counter: anyone can see how close a city is; requests remember who shared the link.
alter table launch_requests add column if not exists referred_by uuid references profiles(id) on delete set null;

create or replace function launch_counts() returns table (city text, requests bigint)
language sql stable security definer set search_path = public as $$
  select initcap(city), count(*) from launch_requests group by initcap(city) order by count(*) desc, initcap(city) limit 50;
$$;
grant execute on function launch_counts() to anon, authenticated;
