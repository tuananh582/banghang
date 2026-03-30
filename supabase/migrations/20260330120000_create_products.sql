create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_code text not null,
  product_name text not null,
  description text,
  unit_price numeric(14, 2) not null default 0,
  inventory_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_product_code_not_blank check (char_length(btrim(product_code)) > 0),
  constraint products_product_name_not_blank check (char_length(btrim(product_name)) > 0),
  constraint products_unit_price_non_negative check (unit_price >= 0),
  constraint products_inventory_count_non_negative check (inventory_count >= 0),
  constraint products_owner_product_code_unique unique (user_id, product_code)
);

create index if not exists products_user_id_idx
  on public.products (user_id);

create index if not exists products_user_id_product_code_idx
  on public.products (user_id, product_code);

create index if not exists products_user_id_updated_at_idx
  on public.products (user_id, updated_at desc);

drop trigger if exists set_products_updated_at on public.products;

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "Users can view their own products" on public.products;
create policy "Users can view their own products"
on public.products
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own products" on public.products;
create policy "Users can insert their own products"
on public.products
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own products" on public.products;
create policy "Users can update their own products"
on public.products
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own products" on public.products;
create policy "Users can delete their own products"
on public.products
for delete
using (user_id = auth.uid());
