drop policy if exists "Users can view their own products" on public.products;
drop policy if exists "Users can insert their own products" on public.products;
drop policy if exists "Users can update their own products" on public.products;
drop policy if exists "Users can delete their own products" on public.products;

drop index if exists products_user_id_product_code_idx;

alter table public.products
  drop constraint if exists products_owner_product_code_unique;

create unique index if not exists products_product_code_unique_idx
  on public.products (product_code);

create index if not exists products_product_code_idx
  on public.products (product_code);

create policy "Authenticated users can view all products"
on public.products
for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can create products"
on public.products
for insert
with check (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Authenticated users can update all products"
on public.products
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete all products"
on public.products
for delete
using (auth.role() = 'authenticated');
