-- Vezu: схема на будущее (Supabase / Postgres).
-- Это справочный SQL, его НЕ нужно применять к существующим проектам.
-- Текущее демо работает без бэкенда, на localStorage.
-- Перед применением на рабочем контуре схема и политики должны пройти ревью
-- и размещаться только на серверах в Республике Казахстан.

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
  created_at timestamptz not null default now()
);

-- Телефон хранится отдельно, чтобы его нельзя было прочитать
-- вместе с «публичным» профилем через расширенные политики.
create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  updated_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key references public.profiles (id) on delete cascade,
  vehicle_id public.vehicle_id not null default 'gazelle',
  plate text not null default '',
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
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  anonymised_at timestamptz
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

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  privacy_version text not null,
  terms_version text not null,
  privacy_accepted_at timestamptz not null,
  terms_accepted_at timestamptz not null,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create index consents_user_idx on public.consents (user_id, created_at desc);

create table public.personal_data_access_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  subject_id uuid,
  action text not null,
  resource_type text,
  resource_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create index personal_data_access_log_subject_idx
  on public.personal_data_access_log (subject_id, created_at desc);

create type public.subscription_kind as enum ('trial', 'day', 'week', 'month');
create type public.sub_payment_method as enum ('kaspi', 'halyk', 'freedom', 'trial');

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

-- Храним факт оплаты и сумму, но никогда — номер карты, срок или CVV.
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.drivers enable row level security;
alter table public.orders enable row level security;
alter table public.offers enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;
alter table public.status_events enable row level security;
alter table public.consents enable row level security;
alter table public.personal_data_access_log enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Профили: владелец видит и меняет свою запись; имя водителя видно
-- клиенту, если водитель откликнулся или принял заказ (без телефона).
create policy "profiles owner select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles visible to order counterparties" on public.profiles
  for select using (
    exists (
      select 1
      from public.orders o
      where
        (o.client_id = auth.uid() and o.assigned_driver_id = profiles.id)
        or (
          o.assigned_driver_id = auth.uid()
          and o.client_id = profiles.id
          and o.status in ('accepted', 'enroute_pickup', 'loading', 'enroute_drop')
        )
    )
    or exists (
      select 1
      from public.offers off
      join public.orders o on o.id = off.order_id
      where off.driver_id = profiles.id and o.client_id = auth.uid()
    )
  );

create policy "profiles owner insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles owner update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles owner delete" on public.profiles
  for delete using (auth.uid() = id);

-- Телефоны только владельцу. Другая сторона получает номер через функцию.
create policy "contacts owner only select" on public.profile_contacts
  for select using (auth.uid() = user_id);

create policy "contacts owner only insert" on public.profile_contacts
  for insert with check (auth.uid() = user_id);

create policy "contacts owner only update" on public.profile_contacts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts owner only delete" on public.profile_contacts
  for delete using (auth.uid() = user_id);

create policy "drivers owner select" on public.drivers
  for select using (auth.uid() = id);

create policy "drivers visible when assigned or offering" on public.drivers
  for select using (
    exists (
      select 1 from public.orders o
      where o.assigned_driver_id = drivers.id and o.client_id = auth.uid()
    )
    or exists (
      select 1
      from public.offers off
      join public.orders o on o.id = off.order_id
      where off.driver_id = drivers.id and o.client_id = auth.uid()
    )
  );

create policy "drivers owner insert" on public.drivers
  for insert with check (auth.uid() = id);

create policy "drivers owner update" on public.drivers
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "drivers owner delete" on public.drivers
  for delete using (auth.uid() = id);

-- Лента поиска: любой авторизованный водитель видит открытые заказы.
-- Телефона клиента в этой таблице нет.
create policy "orders readable by participants or open feed" on public.orders
  for select using (
    client_id = auth.uid()
    or assigned_driver_id = auth.uid()
    or status = 'searching'
  );

create policy "clients insert own orders" on public.orders
  for insert with check (client_id = auth.uid());

create policy "participants update orders" on public.orders
  for update using (client_id = auth.uid() or assigned_driver_id = auth.uid())
  with check (client_id = auth.uid() or assigned_driver_id = auth.uid());

create policy "clients delete own searching orders" on public.orders
  for delete using (client_id = auth.uid() and status in ('searching', 'cancelled'));

create policy "offers readable by client or author" on public.offers
  for select using (
    driver_id = auth.uid()
    or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid())
  );

create policy "drivers insert own offers" on public.offers
  for insert with check (driver_id = auth.uid());

create policy "messages readable by participants" on public.messages
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.assigned_driver_id = auth.uid())
    )
  );

create policy "participants insert messages" on public.messages
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.assigned_driver_id = auth.uid())
    )
  );

create policy "ratings readable by participants" on public.ratings
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.assigned_driver_id = auth.uid())
    )
  );

create policy "clients insert rating for own order" on public.ratings
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid())
  );

create policy "status events readable by participants or open feed" on public.status_events
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.assigned_driver_id = auth.uid() or o.status = 'searching')
    )
  );

create policy "consents owner select" on public.consents
  for select using (auth.uid() = user_id);

create policy "consents owner insert" on public.consents
  for insert with check (auth.uid() = user_id);

create policy "consents owner update" on public.consents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "audit log owner select" on public.personal_data_access_log
  for select using (auth.uid() = actor_id or auth.uid() = subject_id);

create policy "audit log owner insert" on public.personal_data_access_log
  for insert with check (auth.uid() = actor_id);

create policy "drivers read own subscription" on public.subscriptions
  for select using (driver_id = auth.uid());

create policy "drivers insert own subscription" on public.subscriptions
  for insert with check (driver_id = auth.uid());

create policy "drivers update own subscription" on public.subscriptions
  for update using (driver_id = auth.uid()) with check (driver_id = auth.uid());

create policy "drivers read own payments" on public.subscription_payments
  for select using (driver_id = auth.uid());

create policy "drivers insert own payments" on public.subscription_payments
  for insert with check (driver_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Функции: телефон контрагента, обезличивание, удаление аккаунта
-- ---------------------------------------------------------------------------

create or replace function public.order_counterparty_phone(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.orders%rowtype;
  subject uuid;
  phone text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into rec from public.orders where id = p_order_id;
  if not found then
    return null;
  end if;

  if rec.status not in ('accepted', 'enroute_pickup', 'loading', 'enroute_drop') then
    return null;
  end if;

  if auth.uid() = rec.client_id then
    subject := rec.assigned_driver_id;
  elsif auth.uid() = rec.assigned_driver_id then
    subject := rec.client_id;
  else
    return null;
  end if;

  if subject is null then
    return null;
  end if;

  select c.phone into phone from public.profile_contacts c where c.user_id = subject;

  insert into public.personal_data_access_log (actor_id, subject_id, action, resource_type, resource_id)
  values (auth.uid(), subject, 'view_phone', 'order', p_order_id);

  return phone;
end;
$$;

revoke all on function public.order_counterparty_phone(uuid) from public;
grant execute on function public.order_counterparty_phone(uuid) to authenticated;

-- Срок по умолчанию: 180 дней после завершения заказа.
create or replace function public.anonymise_stale_orders(p_retention_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with updated as (
    update public.orders
    set
      pickup_address = 'Адрес удалён',
      dropoff_address = 'Адрес удалён',
      pickup_lat = round(pickup_lat::numeric, 2),
      pickup_lng = round(pickup_lng::numeric, 2),
      dropoff_lat = round(dropoff_lat::numeric, 2),
      dropoff_lng = round(dropoff_lng::numeric, 2),
      cargo_description = '',
      cargo_photo_path = null,
      anonymised_at = now()
    where anonymised_at is null
      and status in ('delivered', 'cancelled', 'rated')
      and coalesce(completed_at, created_at) < now() - make_interval(days => p_retention_days)
    returning id
  )
  select count(*) into n from updated;

  delete from public.messages m
  using public.orders o
  where m.order_id = o.id and o.anonymised_at is not null;

  insert into public.messages (order_id, author, text)
  select id, 'system', 'Переписка и персональные данные заказа удалены по сроку хранения.'
  from public.orders
  where anonymised_at is not null
    and not exists (
      select 1 from public.messages m
      where m.order_id = orders.id
        and m.text like 'Переписка и персональные данные%'
    );

  return n;
end;
$$;

revoke all on function public.anonymise_stale_orders(integer) from public;
-- Вызов планировщиком от service_role, не от клиентского ключа.

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.personal_data_access_log (actor_id, subject_id, action, resource_type, resource_id)
  values (uid, uid, 'account_deleted', 'profile', uid);

  update public.orders
  set
    pickup_address = 'Адрес удалён',
    dropoff_address = 'Адрес удалён',
    cargo_description = '',
    cargo_photo_path = null,
    anonymised_at = coalesce(anonymised_at, now())
  where client_id = uid or assigned_driver_id = uid;

  delete from public.messages m
  using public.orders o
  where m.order_id = o.id and (o.client_id = uid or o.assigned_driver_id = uid);

  delete from public.consents where user_id = uid;
  delete from public.profile_contacts where user_id = uid;
  delete from public.profiles where id = uid;
  -- Запись auth.users удаляет администратор / Auth hook после этой функции.
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
