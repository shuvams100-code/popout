-- Cancel, events admin, ground rules, post-meet check-in, selfie→admin push, kill metrics

-- 1. Host cancels; members get told
create or replace function cancel_popout(p uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pop popouts%rowtype; ids uuid[];
begin
  if not is_host(p) then raise exception 'not_host'; end if;
  select * into pop from popouts where id = p;
  if pop.status <> 'open' then return; end if;
  update popouts set status = 'cancelled' where id = p;
  select array_agg(user_id) into ids from popout_members
  where popout_id = p and user_id <> pop.host_id and status not in ('dropped', 'removed');
  perform push_send(push_items(ids, 'Cancelled: ' || pop.title, split_part((select name from profiles where id = pop.host_id), ' ', 1) || ' called it off. Sorry — find another one nearby.', '/'));
end;
$$;

-- 2. Events: admins manage them from the app
create policy "admins manage events" on events for all using (is_admin()) with check (is_admin());

-- 3a. Ground rules accepted once
alter table profiles add column if not exists rules_accepted_at timestamptz;
create or replace function accept_rules() returns void
language sql security definer set search_path = public as $$
  update profiles set rules_accepted_at = coalesce(rules_accepted_at, now()) where id = auth.uid();
$$;

-- 3b. Post-meet check-in nudge, 30 min after start
alter table popouts add column if not exists checkin_notified_at timestamptz;

-- 4. Selfie submitted → admins
create or replace function notify_selfie_submitted() returns trigger
language plpgsql security definer set search_path = public as $$
declare ids uuid[];
begin
  if new.selfie_submitted_at is not null and new.selfie_submitted_at is distinct from old.selfie_submitted_at then
    select array_agg(u.id) into ids from auth.users u where u.email in (select email from admins);
    perform push_send(push_items(ids, 'Selfie to review', split_part(new.name, ' ', 1) || ' just uploaded one.', '/admin'));
  end if;
  return new;
end;
$$;
drop trigger if exists on_selfie_submitted on profiles;
create trigger on_selfie_submitted after update of selfie_submitted_at on profiles for each row execute function notify_selfie_submitted();

-- Sweep: add the check-in nudge
create or replace function gate_sweep() returns void
language plpgsql security definer set search_path = public as $$
declare r record; ids uuid[];
begin
  for r in
    select id, title, starts_at from popouts
    where status = 'open' and gate_notified_at is null
      and starts_at between now() and now() + interval '3 hours'
  loop
    update popouts set gate_notified_at = now() where id = r.id;
    select array_agg(user_id) into ids from popout_members m where m.popout_id = r.id and m.status = 'joined';
    perform push_send(push_items(ids, 'Still coming?', r.title || ' starts ' || to_char(r.starts_at at time zone 'Asia/Kolkata', 'HH12:MI AM') || '. Confirm or free your seat.', '/p/' || r.id));
  end loop;

  for r in
    select id, title, host_id from popouts
    where status = 'open' and checkin_notified_at is null
      and starts_at between now() - interval '60 minutes' and now() - interval '30 minutes'
  loop
    update popouts set checkin_notified_at = now() where id = r.id;
    select array_agg(user_id) into ids from popout_members m
    where m.popout_id = r.id and m.user_id <> r.host_id and m.status in ('joined', 'confirmed', 'attended');
    perform push_send(push_items(ids, 'All good?', 'Quick check-in on ' || r.title || '. Tap if something''s off.', '/p/' || r.id || '?checkin=1'));
  end loop;

  update popout_members m set status = 'dropped'
  from popouts p
  where m.popout_id = p.id and m.status = 'joined' and p.status = 'open'
    and p.starts_at between now() and now() + interval '30 minutes'
    and m.user_id <> p.host_id;
  update popouts set status = 'done'
  where status = 'open' and starts_at < now() - interval '6 hours';
end;
$$;

-- 5. Kill criteria, admin-only. Founder = anyone in admins.
create or replace function kill_metrics() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  admin_ids uuid[];
  completed_8w int; attended int; no_shows int;
  first_timers int; repeaters int;
  created_by_others_7d int; repeat_hosts int;
  women int; men int; founder_done int; all_done int;
begin
  if not is_admin() then raise exception 'not_admin'; end if;
  select array_agg(u.id) into admin_ids from auth.users u where u.email in (select email from admins);

  -- completed = done with 2+ attended (incl. host, who is 'confirmed' → count host as present)
  select count(*) into completed_8w from popouts p
  where p.status = 'done' and p.starts_at > now() - interval '8 weeks'
    and (select count(*) from popout_members m where m.popout_id = p.id and m.status = 'attended') >= 1;

  select count(*) filter (where status = 'attended'), count(*) filter (where status = 'no_show')
  into attended, no_shows from popout_members m join popouts p on p.id = m.popout_id
  where p.status = 'done' and m.user_id <> p.host_id;

  with per_user as (
    select m.user_id, count(*) n from popout_members m join popouts p on p.id = m.popout_id
    where m.status = 'attended' and p.starts_at > now() - interval '30 days' group by m.user_id
  )
  select count(*), count(*) filter (where n >= 2) into first_timers, repeaters from per_user;

  select count(*) into created_by_others_7d from popouts
  where created_at > now() - interval '7 days' and not (host_id = any(admin_ids)) and host_id not in (select id from profiles where id in (select id from auth.users where email like '%@mock.popout.local'));

  select count(*) into repeat_hosts from (
    select host_id from popouts where status = 'done' and not (host_id = any(admin_ids))
      and host_id not in (select id from auth.users where email like '%@mock.popout.local')
    group by host_id having count(*) >= 2
  ) h;

  select count(*) filter (where pr.gender = 'woman'), count(*) filter (where pr.gender = 'man')
  into women, men from popout_members m join profiles pr on pr.id = m.user_id
  where m.status = 'attended';

  select count(*) filter (where host_id = any(admin_ids)), count(*) into founder_done, all_done
  from popouts where status = 'done' and starts_at > now() - interval '8 weeks';

  return jsonb_build_object(
    'completed_8w', completed_8w,
    'attendance_rate', case when attended + no_shows > 0 then round(100.0 * attended / (attended + no_shows)) else null end,
    'repeat_rate', case when first_timers > 0 then round(100.0 * repeaters / first_timers) else null end,
    'created_by_others_7d', created_by_others_7d,
    'repeat_hosts', repeat_hosts,
    'women', women, 'men', men,
    'founder_share', case when all_done > 0 then round(100.0 * founder_done / all_done) else null end
  );
end;
$$;
