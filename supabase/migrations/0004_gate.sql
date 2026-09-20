-- M5: confirmation gate + attendance. The wedge.

-- Member says "still coming" inside the window (3h before start → start)
create or replace function confirm_attendance(p uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pop popouts%rowtype;
begin
  select * into pop from popouts where id = p;
  if not found or pop.status <> 'open' then raise exception 'popout_not_open'; end if;
  if now() < pop.starts_at - interval '3 hours' then raise exception 'too_early'; end if;
  if now() > pop.starts_at + interval '2 hours' then raise exception 'popout_started'; end if;
  update popout_members set status = 'confirmed'
  where popout_id = p and user_id = auth.uid() and status = 'joined';
end;
$$;

-- Host marks who showed up, from start time onwards. Only attendance counts — no stars.
create or replace function mark_attendance(p uuid, u uuid, showed boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pop popouts%rowtype;
begin
  if not is_host(p) then raise exception 'not_host'; end if;
  select * into pop from popouts where id = p;
  if now() < pop.starts_at then raise exception 'too_early'; end if;
  update popout_members set status = case when showed then 'attended' else 'no_show' end::member_status
  where popout_id = p and user_id = u and status in ('joined', 'confirmed', 'attended', 'no_show');
end;
$$;

-- Host closes the Popout once attendance is marked
create or replace function finish_popout(p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_host(p) then raise exception 'not_host'; end if;
  update popouts set status = 'done' where id = p and status = 'open';
end;
$$;

-- Reliability, the only reputation that counts
create or replace view profile_stats as
select
  pr.id,
  count(*) filter (where m.status = 'attended') as attended,
  count(*) filter (where m.status = 'no_show') as no_shows,
  count(distinct po.id) filter (where po.host_id = pr.id and po.status = 'done') as hosted
from profiles pr
left join popout_members m on m.user_id = pr.id
left join popouts po on po.id = m.popout_id
group by pr.id;

-- Silence counts as a drop: 30 min before start, unconfirmed seats free up. Past Popouts close after 6h.
create extension if not exists pg_cron with schema pg_catalog;

create or replace function gate_sweep() returns void
language sql security definer set search_path = public as $$
  update popout_members m set status = 'dropped'
  from popouts p
  where m.popout_id = p.id and m.status = 'joined' and p.status = 'open'
    and p.starts_at between now() and now() + interval '30 minutes'
    and m.user_id <> p.host_id;
  update popouts set status = 'done'
  where status = 'open' and starts_at < now() - interval '6 hours';
$$;

select cron.schedule('popout-gate-sweep', '*/5 * * * *', $$select public.gate_sweep()$$);
