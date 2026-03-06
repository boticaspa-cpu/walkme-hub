-- Create reservation_items table to store individual tour items per reservation
create table public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  tour_id uuid references public.tours(id),
  tour_date date,
  qty_adults integer not null default 0,
  qty_children integer not null default 0,
  unit_price_mxn numeric not null default 0,
  unit_price_child_mxn numeric not null default 0,
  subtotal_mxn numeric not null default 0,
  zone text not null default '',
  nationality text not null default '',
  package_name text,
  created_at timestamptz not null default now()
);

alter table public.reservation_items enable row level security;

create policy "Authenticated users can manage reservation_items"
  on public.reservation_items
  for all
  to authenticated
  using (true)
  with check (true);
