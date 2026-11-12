-- =============================================================================
-- Matka & Me Threads — CMS schema for Supabase
-- =============================================================================
-- Safe to run more than once. It never drops tables or deletes rows:
--   * tables use CREATE TABLE IF NOT EXISTS
--   * functions use CREATE OR REPLACE
--   * triggers / policies are dropped and recreated (these hold no data)
--
-- Run it in: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- After running, add your first administrator (see README → "Create the first
-- administrator"):
--   insert into public.admin_users (user_id, email)
--   select id, email from auth.users where email = 'you@example.com'
--   on conflict (user_id) do nothing;
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Admin authorization
-- -----------------------------------------------------------------------------
-- Being signed in is NOT enough to manage content. A user must have a row in
-- admin_users. Rows can only be added from the SQL editor / service role:
-- there are deliberately no INSERT/UPDATE/DELETE policies on this table.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users: read own row" on public.admin_users;
create policy "admin_users: read own row"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

revoke all on public.admin_users from anon;
revoke insert, update, delete on public.admin_users from authenticated;
grant select on public.admin_users to authenticated;

-- SECURITY DEFINER so it can read admin_users regardless of the caller's RLS.
-- It only ever answers "is the *current* user an admin?" from the verified JWT.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. Shared helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Recursive JSONB merge: objects are merged key by key, anything else
-- (strings, numbers, arrays) in `patch` replaces the value in `base`.
create or replace function public.jsonb_deep_merge(base jsonb, patch jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when jsonb_typeof(base) = 'object' and jsonb_typeof(patch) = 'object' then
      coalesce(
        (
          select jsonb_object_agg(
            key,
            case
              when base ? key and patch ? key then public.jsonb_deep_merge(base -> key, patch -> key)
              when patch ? key then patch -> key
              else base -> key
            end
          )
          from (
            select jsonb_object_keys(base) as key
            union
            select jsonb_object_keys(patch)
          ) keys
        ),
        '{}'::jsonb
      )
    when patch is null then base
    else patch
  end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Product categories ("Collections" on the homepage, filters on /shop)
-- -----------------------------------------------------------------------------

create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  image_url   text,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists product_categories_public_idx
  on public.product_categories (published, sort_order);

drop trigger if exists product_categories_updated_at on public.product_categories;
create trigger product_categories_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. Products
-- -----------------------------------------------------------------------------
-- stock_status maps to the badges already used on /shop:
--   available   → "N Available"   (N = quantity, defaults to 1)
--   sample      → "Sample Pattern"
--   coming_soon → "Coming Soon", no inquire button
--   sold_out    → "Sold"
--   none        → no badge

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(btrim(name)) between 1 and 160),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description    text not null default '' check (char_length(description) <= 5000),
  category_id    uuid references public.product_categories (id) on delete set null,
  featured_image text,
  gallery_images text[] not null default '{}',
  price          numeric(10, 2) check (price is null or price >= 0),
  sale_price     numeric(10, 2) check (sale_price is null or sale_price >= 0),
  sku            text unique,
  quantity       integer check (quantity is null or quantity >= 0),
  stock_status   text not null default 'sample'
                 check (stock_status in ('available', 'sample', 'coming_soon', 'sold_out', 'none')),
  featured       boolean not null default false,
  sort_order     integer not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists products_public_idx  on public.products (published, sort_order);
create index if not exists products_category_idx on public.products (category_id);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 5. FAQs (shown on /custom-order)
-- -----------------------------------------------------------------------------

create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null check (char_length(btrim(question)) between 1 and 500),
  answer      text not null check (char_length(btrim(answer)) between 1 and 5000),
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists faqs_public_idx on public.faqs (published, sort_order);

drop trigger if exists faqs_updated_at on public.faqs;
create trigger faqs_updated_at
  before update on public.faqs
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 6. Site settings (single row, JSONB)
-- -----------------------------------------------------------------------------
-- Holds only PUBLIC website content (contact details, hero text, footer, SEO).
-- Never store secrets here: everyone can read this row.

create table if not exists public.site_settings (
  id         smallint primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Partial update: deep-merges `patch` into the stored settings so changing one
-- field never wipes unrelated settings. Runs as the caller (RLS applies) and
-- additionally refuses non-admins with a clear error.
create or replace function public.merge_site_settings(patch jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if patch is null or jsonb_typeof(patch) <> 'object' then
    raise exception 'invalid_settings' using errcode = '22023';
  end if;

  update public.site_settings
     set data = public.jsonb_deep_merge(data, patch)
   where id = 1
  returning data into result;

  if result is null then
    insert into public.site_settings (id, data) values (1, patch)
    returning data into result;
  end if;

  return result;
end;
$$;

revoke all on function public.merge_site_settings(jsonb) from public;
grant execute on function public.merge_site_settings(jsonb) to authenticated;


-- -----------------------------------------------------------------------------
-- 7. Inquiries (contact + custom-order forms)
-- -----------------------------------------------------------------------------
-- Visitors cannot SELECT or INSERT directly. They submit through the
-- submit_inquiry() function below, which validates and rate-limits.

create table if not exists public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  type       text not null default 'contact'
             check (type in ('contact', 'custom_order', 'general')),
  name       text not null check (char_length(name) between 1 and 200),
  email      text not null check (char_length(email) <= 320 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone      text check (phone is null or char_length(phone) <= 50),
  subject    text check (subject is null or char_length(subject) <= 300),
  message    text not null default '' check (char_length(message) <= 5000),
  details    jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  status     text not null default 'new'
             check (status in ('new', 'in_progress', 'replied', 'closed', 'spam')),
  is_read    boolean not null default false,
  ip_hash    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx  on public.inquiries (status, is_read);
create index if not exists inquiries_ratelimit_idx on public.inquiries (ip_hash, created_at);

drop trigger if exists inquiries_updated_at on public.inquiries;
create trigger inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

create or replace function public.submit_inquiry(
  p_type     text,
  p_name     text,
  p_email    text,
  p_message  text,
  p_phone    text  default null,
  p_subject  text  default null,
  p_details  jsonb default '{}'::jsonb,
  p_honeypot text  default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_message text := btrim(coalesce(p_message, ''));
  v_phone   text := nullif(btrim(coalesce(p_phone, '')), '');
  v_subject text := nullif(btrim(coalesce(p_subject, '')), '');
  v_details jsonb := coalesce(p_details, '{}'::jsonb);
  v_headers json;
  v_ip      text;
  v_ip_hash text;
  v_id      uuid;
begin
  -- Bots fill hidden fields. Pretend success, store nothing.
  if coalesce(btrim(p_honeypot), '') <> '' then
    return gen_random_uuid();
  end if;

  if p_type is null or p_type not in ('contact', 'custom_order', 'general') then
    raise exception 'invalid_type' using errcode = '22023';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 200 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if char_length(v_email) > 320 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if char_length(v_message) > 5000 then
    raise exception 'message_too_long' using errcode = '22023';
  end if;
  if (v_phone is not null and char_length(v_phone) > 50)
     or (v_subject is not null and char_length(v_subject) > 300) then
    raise exception 'invalid_field' using errcode = '22023';
  end if;
  if jsonb_typeof(v_details) <> 'object' or char_length(v_details::text) > 5000 then
    raise exception 'invalid_details' using errcode = '22023';
  end if;

  -- Rate limiting. PostgREST exposes request headers; on Supabase the client IP
  -- is the first entry of x-forwarded-for. We only keep a hash of it.
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    v_headers := null;
  end;
  v_ip := nullif(btrim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1)), '');
  v_ip_hash := case when v_ip is null then null else md5('matka-cms:' || v_ip) end;

  if v_ip_hash is not null and (
    select count(*) from public.inquiries
     where ip_hash = v_ip_hash and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.inquiries
     where email = v_email and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  -- Global safety valve against floods.
  if (
    select count(*) from public.inquiries where created_at > now() - interval '10 minutes'
  ) >= 100 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.inquiries (type, name, email, phone, subject, message, details, ip_hash)
  values (p_type, v_name, v_email, v_phone, v_subject, v_message, v_details, v_ip_hash)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_inquiry(text, text, text, text, text, text, jsonb, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text, text, text, jsonb, text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 8. Content status (lets the public site know whether to use built-in
--    default content). Only reveals whether rows exist — nothing else.
-- -----------------------------------------------------------------------------

create or replace function public.cms_content_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'products',   exists (select 1 from public.products),
    'categories', exists (select 1 from public.product_categories),
    'faqs',       exists (select 1 from public.faqs)
  );
$$;

revoke all on function public.cms_content_status() from public;
grant execute on function public.cms_content_status() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 9. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.product_categories enable row level security;
alter table public.products           enable row level security;
alter table public.faqs               enable row level security;
alter table public.site_settings      enable row level security;
alter table public.inquiries          enable row level security;

-- Table privileges (RLS still filters rows on top of these).
-- Supabase grants broad default privileges to anon/authenticated; tighten them.
-- TRUNCATE in particular bypasses RLS, so nobody but the owner may use it.
revoke all on public.product_categories, public.products, public.faqs, public.site_settings,
              public.inquiries, public.admin_users
  from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.product_categories, public.products, public.faqs, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.product_categories, public.products, public.faqs
  to authenticated;
grant insert, update on public.site_settings to authenticated;
revoke all on public.inquiries from anon;
revoke insert on public.inquiries from authenticated;
grant select, update, delete on public.inquiries to authenticated;

-- product_categories
drop policy if exists "categories: public read published" on public.product_categories;
create policy "categories: public read published"
  on public.product_categories for select
  to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "categories: admin insert" on public.product_categories;
create policy "categories: admin insert"
  on public.product_categories for insert to authenticated
  with check (public.is_admin());

drop policy if exists "categories: admin update" on public.product_categories;
create policy "categories: admin update"
  on public.product_categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "categories: admin delete" on public.product_categories;
create policy "categories: admin delete"
  on public.product_categories for delete to authenticated
  using (public.is_admin());

-- products
drop policy if exists "products: public read published" on public.products;
create policy "products: public read published"
  on public.products for select
  to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "products: admin insert" on public.products;
create policy "products: admin insert"
  on public.products for insert to authenticated
  with check (public.is_admin());

drop policy if exists "products: admin update" on public.products;
create policy "products: admin update"
  on public.products for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "products: admin delete" on public.products;
create policy "products: admin delete"
  on public.products for delete to authenticated
  using (public.is_admin());

-- faqs
drop policy if exists "faqs: public read published" on public.faqs;
create policy "faqs: public read published"
  on public.faqs for select
  to anon, authenticated
  using (published or public.is_admin());

drop policy if exists "faqs: admin insert" on public.faqs;
create policy "faqs: admin insert"
  on public.faqs for insert to authenticated
  with check (public.is_admin());

drop policy if exists "faqs: admin update" on public.faqs;
create policy "faqs: admin update"
  on public.faqs for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "faqs: admin delete" on public.faqs;
create policy "faqs: admin delete"
  on public.faqs for delete to authenticated
  using (public.is_admin());

-- site_settings
drop policy if exists "settings: public read" on public.site_settings;
create policy "settings: public read"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "settings: admin insert" on public.site_settings;
create policy "settings: admin insert"
  on public.site_settings for insert to authenticated
  with check (public.is_admin());

drop policy if exists "settings: admin update" on public.site_settings;
create policy "settings: admin update"
  on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- inquiries: admins only. No insert policy — submissions go via submit_inquiry().
drop policy if exists "inquiries: admin read" on public.inquiries;
create policy "inquiries: admin read"
  on public.inquiries for select to authenticated
  using (public.is_admin());

drop policy if exists "inquiries: admin update" on public.inquiries;
create policy "inquiries: admin update"
  on public.inquiries for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "inquiries: admin delete" on public.inquiries;
create policy "inquiries: admin delete"
  on public.inquiries for delete to authenticated
  using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 10. Storage: cms-media bucket
-- -----------------------------------------------------------------------------
-- Public bucket: files are readable through their public URL (needed for the
-- website). Listing, uploading, replacing and deleting are admin-only.
-- 8 MB per file, JPEG / PNG / WebP only (no SVG: it can carry scripts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-media', 'cms-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "cms-media: admin list" on storage.objects;
create policy "cms-media: admin list"
  on storage.objects for select to authenticated
  using (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "cms-media: admin upload" on storage.objects;
create policy "cms-media: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "cms-media: admin update" on storage.objects;
create policy "cms-media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'cms-media' and public.is_admin())
  with check (bucket_id = 'cms-media' and public.is_admin());

drop policy if exists "cms-media: admin delete" on storage.objects;
create policy "cms-media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cms-media' and public.is_admin());
