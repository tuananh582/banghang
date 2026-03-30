alter table public.products
  drop column if exists description,
  drop column if exists inventory_count,
  drop column if exists is_active;
