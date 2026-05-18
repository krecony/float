-- GroupPay initial schema

create extension if not exists "pgcrypto";

-- Profiles keyed to Supabase Auth
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  legal_name text,
  date_of_birth date,
  id_document_last4 text,
  id_verified boolean not null default false,
  id_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  label text not null,
  last_four text not null,
  brand text not null,
  exp_month int not null,
  exp_year int not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  balance_cents bigint not null default 0,
  approval_threshold int not null default 2,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  amount_cents bigint not null,
  status text not null default 'pending',
  description text,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now()
);

create table public.transaction_participants (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  share_cents bigint,
  created_at timestamptz not null default now(),
  primary key (transaction_id, user_id)
);

create table public.transaction_approvals (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  approved boolean not null,
  created_at timestamptz not null default now(),
  primary key (transaction_id, user_id)
);

-- Indexes
create index transactions_group_id_idx on public.transactions (group_id);
create index transaction_approvals_transaction_id_idx on public.transaction_approvals (transaction_id);
create index transaction_participants_transaction_id_idx on public.transaction_participants (transaction_id);
create index payment_methods_user_id_idx on public.payment_methods (user_id);
create index groups_invite_code_idx on public.groups (invite_code);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Traveler'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS (permissive demo policies)
alter table public.users enable row level security;
alter table public.payment_methods enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_participants enable row level security;
alter table public.transaction_approvals enable row level security;

create policy "users_all_authenticated" on public.users
  for all to authenticated using (true) with check (true);

create policy "payment_methods_all_authenticated" on public.payment_methods
  for all to authenticated using (true) with check (true);

create policy "groups_all_authenticated" on public.groups
  for all to authenticated using (true) with check (true);

create policy "group_members_all_authenticated" on public.group_members
  for all to authenticated using (true) with check (true);

create policy "transactions_all_authenticated" on public.transactions
  for all to authenticated using (true) with check (true);

create policy "transaction_participants_all_authenticated" on public.transaction_participants
  for all to authenticated using (true) with check (true);

create policy "transaction_approvals_all_authenticated" on public.transaction_approvals
  for all to authenticated using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.transaction_approvals;
alter publication supabase_realtime add table public.transaction_participants;
