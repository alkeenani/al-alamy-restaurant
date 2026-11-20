-- Add independent visibility/availability states for categories and products.
-- Safe to run multiple times. Preserves all existing rows/data.

alter table public.categories
  add column if not exists is_available boolean;

update public.categories
set is_available = true
where is_available is null;

alter table public.categories
  alter column is_available set default true;

alter table public.categories
  alter column is_available set not null;

alter table public.products
  add column if not exists is_active boolean;

update public.products
set is_active = true
where is_active is null;

alter table public.products
  alter column is_active set default true;

alter table public.products
  alter column is_active set not null;

-- Semantics:
-- categories.is_active    = visibility on customer site (ظاهر/مخفي)
-- categories.is_available = availability for ordering (متوفر/غير متوفر حاليًا)
-- products.is_active      = visibility on customer site (ظاهر/مخفي)
-- products.is_available   = availability for ordering (متوفر/غير متوفر)
--
-- RLS note: public (anon) read policies must allow selecting rows where
-- is_active = true even if is_available = false, so unavailable-but-visible
-- items can be rendered to customers. Adjust policies if they currently
-- restrict on is_available.
