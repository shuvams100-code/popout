-- Web push: subscriptions, unread tracking, and pg_net triggers that call /api/push

create extension if not exists pg_net with schema extensions;

create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
alter table push_subscriptions enable row level security;
create policy "own subscriptions" on push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Read tracking for unread dots
alter table popout_members add column if not exists last_read_at timestamptz;
create or replace function mark_read(p uuid) returns void
language sql security definer set search_path = public as $$
  update popout_members set last_read_at = now() where popout_id = p and user_id = auth.uid();
$$;

-- Gate notification dedupe
alter table popouts add column if not exists gate_notified_at timestamptz;

-- Private config: site URL + shared secret for the push route. RLS on, no policies → only definer functions can read.
create table if not exists app_config (key text primary key, value text not null);
alter table app_config enable row level security;
insert into app_config (key, value) values
  ('site_url', 'https://popout-alpha.vercel.app'),
  ('push_secret', 'REPLACE_WITH_PUSH_SECRET')
on conflict (key) do update set value = excluded.value;

-- Ship a batch of notifications to the app. Payload: [{sub:{endpoint,keys:{p256dh,auth}}, note:{title,body,url}}]
create or replace function push_send(items jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare url text; secret text;
begin
  if items is null or jsonb_array_length(items) = 0 then return; end if;
  select value into url from app_config where key = 'site_url';
  select value into secret from app_config where key = 'push_secret';
  perform net.http_post(
    url := url || '/api/push',
    body := jsonb_build_object('items', items),
    headers := jsonb_build_object('content-type', 'application/json', 'x-push-secret', secret)
  );
end;
$$;

-- Build items for a set of users
create or replace function push_items(user_ids uuid[], title text, body text, path text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'sub', jsonb_build_object('endpoint', s.endpoint, 'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth)),
    'note', jsonb_build_object('title', title, 'body', body, 'url', path)
  )), '[]'::jsonb)
  from push_subscriptions s where s.user_id = any(user_ids);
$$;

-- New message → everyone else in the thread
create or replace function notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text; ids uuid[];
begin
  select title into t from popouts where id = new.popout_id;
  select array_agg(user_id) into ids from popout_members
  where popout_id = new.popout_id and user_id <> new.user_id and status not in ('dropped','removed');
  perform push_send(push_items(ids, t, coalesce(split_part(new.sender_name, ' ', 1), 'Someone') || ': ' || left(new.body, 120), '/p/' || new.popout_id));
  return new;
end;
$$;
drop trigger if exists on_message_notify on messages;
create trigger on_message_notify after insert on messages for each row execute function notify_message();

-- Someone joined → host
create or replace function notify_join() returns trigger
language plpgsql security definer set search_path = public as $$
declare pop popouts%rowtype; who text;
begin
  if new.status <> 'joined' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'joined' then return new; end if;
  select * into pop from popouts where id = new.popout_id;
  if new.user_id = pop.host_id then return new; end if;
  select split_part(name, ' ', 1) into who from profiles where id = new.user_id;
  perform push_send(push_items(array[pop.host_id], pop.title, who || ' joined' || case when new.plus_one then ' with a friend' else '' end || ' · ' || seats_taken(pop.id) || '/' || pop.max_people, '/p/' || pop.id));
  return new;
end;
$$;
drop trigger if exists on_join_notify on popout_members;
create trigger on_join_notify after insert or update of status on popout_members for each row execute function notify_join();

-- Selfie approved → that user
create or replace function notify_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.verified_at is not null and old.verified_at is null then
    perform push_send(push_items(array[new.id], 'You''re verified ✓', 'Your face check is approved. The badge is on your profile now.', '/profile'));
  end if;
  return new;
end;
$$;
drop trigger if exists on_verified_notify on profiles;
create trigger on_verified_notify after update of verified_at on profiles for each row execute function notify_verified();

-- Gate: 3h before start, nudge everyone who hasn't confirmed. Runs inside the existing 5-min sweep.
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
    select array_agg(user_id) into ids from popout_members m
    where m.popout_id = r.id and m.status = 'joined';
    perform push_send(push_items(ids, 'Still coming?', r.title || ' starts ' || to_char(r.starts_at at time zone 'Asia/Kolkata', 'HH12:MI AM') || '. Confirm or free your seat.', '/p/' || r.id));
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

-- Called by /api/push with the shared secret to forget subscriptions the push service says are gone
create or replace function prune_push(endpoints text[], secret text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if secret is distinct from (select value from app_config where key = 'push_secret') then raise exception 'nope'; end if;
  delete from push_subscriptions where endpoint = any(endpoints);
end;
$$;
