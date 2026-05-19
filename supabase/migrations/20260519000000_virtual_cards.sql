-- Virtual cards + remove group balance for pay-as-you-go model

alter table public.groups drop column if exists balance_cents;

create table public.virtual_cards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.groups (id) on delete cascade,
  pan text not null,
  exp_month int not null,
  exp_year int not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint virtual_cards_status_check check (status in ('active', 'paused'))
);

create index virtual_cards_group_id_idx on public.virtual_cards (group_id);

alter table public.virtual_cards enable row level security;

create policy "virtual_cards_all_authenticated" on public.virtual_cards
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.virtual_cards;
