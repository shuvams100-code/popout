-- Terms acceptance, versioned so a future change can re-prompt
alter table profiles add column if not exists terms_version text, add column if not exists terms_accepted_at timestamptz;

create or replace function accept_terms(v text) returns void
language sql security definer set search_path = public as $$
  update profiles set terms_version = v, terms_accepted_at = now() where id = auth.uid();
$$;
