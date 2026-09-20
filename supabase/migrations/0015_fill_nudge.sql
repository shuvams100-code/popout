-- Host nudge: 3h before start, if seats are open, tell the host to share it. Same tick as the "still coming?" gate.
create or replace function gate_sweep() returns void
language plpgsql security definer set search_path = public as $$
declare r record; ids uuid[]; open_seats int;
begin
  for r in
    select id, title, starts_at, host_id, max_people from popouts
    where status = 'open' and gate_notified_at is null
      and starts_at between now() and now() + interval '3 hours'
  loop
    update popouts set gate_notified_at = now() where id = r.id;
    select array_agg(user_id) into ids from popout_members m where m.popout_id = r.id and m.status = 'joined';
    perform push_send(push_items(ids, 'Still coming?', r.title || ' starts ' || to_char(r.starts_at at time zone 'Asia/Kolkata', 'HH12:MI AM') || '. Confirm or free your seat.', '/p/' || r.id));
    open_seats := r.max_people - seats_taken(r.id);
    if open_seats > 0 then
      perform push_send(push_items(array[r.host_id], open_seats || ' seat' || case when open_seats = 1 then '' else 's' end || ' still open',
        'Drop "' || r.title || '" in a group. It fills faster from people you know.', '/p/' || r.id || '?fill=1'));
    end if;
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
