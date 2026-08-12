-- ============================================================================
-- BillBox — Supabase schema, RLS policies, storage bucket and triggers.
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- ============================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  address     text,
  vat_number  text,
  logo_url    text,
  country     text not null default 'DE',
  language    text not null default 'en',
  plan        text not null default 'free',
  created_at  timestamptz not null default now()
);

-- ---------- clients ----------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  address     text,
  vat_number  text,
  country     text not null,
  email       text,
  created_at  timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients(user_id);

-- ---------- invoices ----------
create table if not exists public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  client_id          uuid references public.clients(id) on delete set null,
  invoice_number     text not null,
  client_name        text,
  client_address     text,
  client_vat         text,
  client_country     text,
  issue_date         date not null,
  due_date           date,
  service_description text not null,
  quantity           int not null default 1,
  unit_price         numeric(10,2) not null,
  vat_rate           numeric(5,2) not null default 0,
  vat_amount         numeric(10,2) not null default 0,
  total_amount       numeric(10,2) not null,
  currency           text not null default 'EUR',
  status             text not null default 'draft',
  country_code       text not null,
  created_at         timestamptz not null default now()
);
create index if not exists invoices_user_id_idx on public.invoices(user_id);
create index if not exists invoices_issue_date_idx on public.invoices(issue_date);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles  enable row level security;
alter table public.clients   enable row level security;
alter table public.invoices  enable row level security;

-- profiles: a user can read / insert / update only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- clients: full ownership by user.
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients
  for select using (auth.uid() = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients
  for insert with check (auth.uid() = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients
  for delete using (auth.uid() = user_id);

-- invoices: full ownership by user.
drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own" on public.invoices
  for select using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own" on public.invoices
  for insert with check (auth.uid() = user_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own" on public.invoices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own" on public.invoices
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- Auto-create a profiles row when a new auth user signs up.
-- (Defensive: the Auth page also inserts a profile, this guarantees one exists.)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Storage bucket for company logos.
-- Run in Supabase Dashboard → Storage, OR execute here if storage schema exists.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Allow authenticated users to manage their own logos (path = <user_id>/...).
drop policy if exists "logos_select_all" on storage.objects;
create policy "logos_select_all" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_insert_own" on storage.objects;
create policy "logos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_update_own" on storage.objects;
create policy "logos_update_own" on storage.objects
  for update using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "logos_delete_own" on storage.objects;
create policy "logos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
