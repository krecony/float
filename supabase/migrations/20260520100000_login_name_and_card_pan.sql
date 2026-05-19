-- Demo name login + full card PAN on payment_methods

create extension if not exists citext;

alter table public.users add column if not exists login_name citext;

create unique index if not exists users_login_name_idx on public.users (login_name);

alter table public.payment_methods add column if not exists pan text;

update public.payment_methods
set pan = repeat('0', 12) || last_four
where pan is null;

alter table public.payment_methods alter column pan set not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_login_name text;
  meta_display_name text;
begin
  meta_login_name := nullif(trim(coalesce(new.raw_user_meta_data->>'login_name', '')), '');
  meta_display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');

  insert into public.users (id, display_name, login_name)
  values (
    new.id,
    coalesce(meta_display_name, meta_login_name, 'Traveler'),
    meta_login_name
  );
  return new;
end;
$$;
