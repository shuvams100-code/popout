-- Threads with messages newer than my last read, for the menu dot
create or replace function unread_count() returns int
language sql stable security definer set search_path = public as $$
  select count(distinct m.popout_id)::int
  from popout_members pm
  join popouts p on p.id = pm.popout_id and p.status = 'open'
  join messages m on m.popout_id = pm.popout_id and m.user_id <> pm.user_id
    and m.created_at > coalesce(pm.last_read_at, pm.joined_at)
  where pm.user_id = auth.uid() and pm.status not in ('dropped', 'removed');
$$;

-- My Popouts, with unread flag and last message, newest start first
create or replace function my_popouts() returns table (
  id uuid, title text, venue text, starts_at timestamptz, status popout_status, max_people int,
  host_id uuid, host_name text, seats int, unread int, last_message text, last_sender text, last_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, p.title, p.venue, p.starts_at, p.status, p.max_people, p.host_id, h.name,
    seats_taken(p.id),
    (select count(*)::int from messages m where m.popout_id = p.id and m.user_id <> auth.uid() and m.created_at > coalesce(pm.last_read_at, pm.joined_at)),
    lm.body, lm.sender_name, lm.created_at
  from popout_members pm
  join popouts p on p.id = pm.popout_id
  join profiles h on h.id = p.host_id
  left join lateral (select body, sender_name, created_at from messages where popout_id = p.id order by created_at desc limit 1) lm on true
  where pm.user_id = auth.uid() and pm.status not in ('dropped', 'removed')
  order by (p.status = 'open') desc, p.starts_at asc;
$$;
