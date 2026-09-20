-- Share attribution: ?via=<user id> on shared links -> cookie -> stamped on the profile at first sign-in.
alter table profiles add column if not exists referred_by uuid references profiles(id) on delete set null;

-- Only sticks on a brand-new profile (first sign-in), never self, never twice.
create or replace function set_referrer(r uuid) returns void
language sql security definer set search_path = public as $$
  update profiles set referred_by = r
  where id = auth.uid() and referred_by is null and r <> auth.uid()
    and created_at > now() - interval '10 minutes'
    and exists (select 1 from profiles where id = r);
$$;

-- Admin-only: is sharing bringing anyone in?
create or replace function referral_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when is_admin() then jsonb_build_object(
    'signups_7d', (select count(*) from profiles where created_at > now() - interval '7 days'),
    'referred_7d', (select count(*) from profiles where created_at > now() - interval '7 days' and referred_by is not null),
    'referrers', (select count(distinct referred_by) from profiles where referred_by is not null)
  ) end;
$$;
