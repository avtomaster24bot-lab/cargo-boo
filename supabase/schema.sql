-- Vezu: схема на будущее (Supabase / Postgres).
-- Это справочный SQL, его НЕ нужно применять к существующим проектам.
-- Текущее демо работает без бэкенда, на localStorage.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('client', 'driver');
create type public.vehicle_id as enum ('kabluk', 'gazelle', 't3', 't5', 't10', 'truck', 'evac');
create type public.payment_method as enum ('cash', 'card', 'kaspi');
create type public.time_mode as enum ('now', 'scheduled');
create type public.order_status as enum (
  'searching',
  'accepted',
  'enroute_pickup',
  'loading',
  'enroute_drop',
  'delivered',
  'cancelled',
  'rated'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'client',
  display_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key references public.profiles (id) on delete cascade,
  vehicle_id public.vehicle_id not null default 'gazelle',
  plate text not null,
  rating numeric(3, 2) not null default 5.00,
  trips integer not null default 0,
  lat double precision,
  lng double precision,
  is_online boolean not null default false
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  short_id text not null unique,
  client_id uuid not null references public.profiles (id),
  assigned_driver_id uuid references public.drivers (id),
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  pickup_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  dropoff_address text not null,
  distance_km numeric(8, 2) not null default 0,
  duration_min numeric(8, 2) not null default 0,
  route jsonb not null default '[]'::jsonb,
  vehicle_id public.vehicle_id not null,
  loaders integer not null default 0,
  packaging boolean not null default false,
  insurance boolean not null default false,
  urgent boolean not null default false,
  time_mode public.time_mode not null default 'now',
  scheduled_at timestamptz,
  cargo_description text not null default '',
  cargo_photo_path text,
  estimated_price integer not null,
  client_price integer not null,
  agreed_price integer,
  payment public.payment_method not null default 'kaspi',
  status public.order_status not null default 'searching',
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  driver_id uuid not null references public.drivers (id),
  price integer not null,
  eta_min integer not null,
  kind text not null check (kind in ('accept', 'counter')),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  author text not null check (author in ('client', 'driver', 'system')),
  text text not null,
  created_at timestamptz not null default now()
);

create table public.ratings (
  order_id uuid primary key references public.orders (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table public.status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.drivers enable row level security;
alter table public.orders enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;
alter table public.status_events enable row level security;

create policy "profiles are readable by owners" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles are updatable by owners" on public.profiles
  for update using (auth.uid() = id);

create policy "orders readable by participants" on public.orders
  for select using (
    client_id = auth.uid()
    or assigned_driver_id = auth.uid()
    or status = 'searching'
  );

create policy "clients insert own orders" on public.orders
  for insert with check (client_id = auth.uid());

create policy "participants update orders" on public.orders
  for update using (client_id = auth.uid() or assigned_driver_id = auth.uid());

create type public.subscription_kind as enum ('trial', 'day', 'week', 'month');
create type public.sub_payment_method as enum ('kaspi', 'card', 'trial');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  kind public.subscription_kind not null,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  trial_used boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index subscriptions_one_current_per_driver
  on public.subscriptions (driver_id);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.drivers (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  plan_id text not null check (plan_id in ('trial', 'day', 'week', 'month')),
  amount integer not null default 0,
  method public.sub_payment_method not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'paid' check (status in ('paid', 'failed', 'pending')),
  created_at timestamptz not null default now()
);

create index subscription_payments_driver_idx
  on public.subscription_payments (driver_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

create policy "drivers read own subscription" on public.subscriptions
  for select using (driver_id = auth.uid());

create policy "drivers insert own subscription" on public.subscriptions
  for insert with check (driver_id = auth.uid());

create policy "drivers update own subscription" on public.subscriptions
  for update using (driver_id = auth.uid());

create policy "drivers read own payments" on public.subscription_payments
  for select using (driver_id = auth.uid());

create policy "drivers insert own payments" on public.subscription_payments
  for insert with check (driver_id = auth.uid());
