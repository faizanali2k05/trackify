-- ============================================================================
-- TRACKIFY — Supabase database schema
-- ============================================================================
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Paste this entire file and click "Run".
--   3. Copy Project URL + anon key (Settings → API) into the app's .env as
--      EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
--
-- Safe to re-run: everything uses IF NOT EXISTS / CREATE OR REPLACE / DROP-then-CREATE.
-- Every table has Row Level Security so each user only ever sees their own data —
-- that is why it is safe to ship the public anon key inside the app.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type budget_type as enum ('monthly', 'travel', 'business', 'event', 'family');
exception when duplicate_object then null; end $$;

do $$ begin
  create type expense_kind as enum ('fixed', 'variable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_tier as enum ('free', 'pro', 'ultra');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helper: keep updated_at fresh on every UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles  (1 row per auth user)
-- ===========================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text default '',
  avatar_url  text,
  currency    text not null default 'USD',
  locale      text not null default 'en',
  theme       text not null default 'system',
  plan        plan_tier not null default 'free',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- categories  (user-customizable; app ships sensible defaults locally too)
-- ===========================================================================
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  label       text not null,
  icon        text not null default 'Tag',
  accent      text not null default 'accentEmerald',
  created_at  timestamptz not null default now(),
  unique (user_id, key)
);
create index if not exists idx_categories_user on public.categories(user_id);

-- ===========================================================================
-- budgets
-- ===========================================================================
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        budget_type not null default 'monthly',
  amount      numeric(14,2) not null default 0,
  spent       numeric(14,2) not null default 0,
  currency    text not null default 'USD',
  color       text not null default 'accentViolet',
  icon        text not null default 'Wallet',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_budgets_user on public.budgets(user_id);

drop trigger if exists trg_budgets_updated on public.budgets;
create trigger trg_budgets_updated before update on public.budgets
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- expenses
-- ===========================================================================
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  budget_id   uuid references public.budgets(id) on delete set null,
  amount      numeric(14,2) not null default 0,
  currency    text not null default 'USD',
  merchant    text not null default '',
  category    text not null default 'Other',
  kind        expense_kind not null default 'variable',
  note        text,
  tags        text[] not null default '{}',
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_expenses_user on public.expenses(user_id);
create index if not exists idx_expenses_budget on public.expenses(budget_id);
create index if not exists idx_expenses_date on public.expenses(user_id, date desc);

drop trigger if exists trg_expenses_updated on public.expenses;
create trigger trg_expenses_updated before update on public.expenses
  for each row execute function public.set_updated_at();

-- Keep budgets.spent in sync as expenses change (server-side source of truth).
create or replace function public.sync_budget_spent()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    if new.budget_id is not null then
      update public.budgets set spent = spent + new.amount where id = new.budget_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.budget_id is not null then
      update public.budgets set spent = greatest(0, spent - old.amount) where id = old.budget_id;
    end if;
  elsif (tg_op = 'UPDATE') then
    if old.budget_id is not null then
      update public.budgets set spent = greatest(0, spent - old.amount) where id = old.budget_id;
    end if;
    if new.budget_id is not null then
      update public.budgets set spent = spent + new.amount where id = new.budget_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_expenses_sync_spent on public.expenses;
create trigger trg_expenses_sync_spent
  after insert or update or delete on public.expenses
  for each row execute function public.sync_budget_spent();

-- ===========================================================================
-- ai_chats + ai_messages  (Copilot history)
-- ===========================================================================
create table if not exists public.ai_chats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New chat',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_ai_chats_user on public.ai_chats(user_id);

drop trigger if exists trg_ai_chats_updated on public.ai_chats;
create trigger trg_ai_chats_updated before update on public.ai_chats
  for each row execute function public.set_updated_at();

create table if not exists public.ai_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid not null references public.ai_chats(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        chat_role not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_ai_messages_chat on public.ai_messages(chat_id, created_at);

-- ===========================================================================
-- notifications
-- ===========================================================================
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, created_at desc);

-- ===========================================================================
-- subscriptions  (billing state mirror)
-- ===========================================================================
create table if not exists public.subscriptions (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  plan           plan_tier not null default 'free',
  status         text not null default 'active',
  provider       text,
  current_period_end timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_subscriptions_updated on public.subscriptions;
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- family_members  (Ultra: shared budget spaces)
-- ===========================================================================
create table if not exists public.family_members (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  member_id   uuid references auth.users(id) on delete set null,
  email       text,
  role        text not null default 'member',
  status      text not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (owner_id, email)
);
create index if not exists idx_family_owner on public.family_members(owner_id);
create index if not exists idx_family_member on public.family_members(member_id);

-- ===========================================================================
-- tasks  (lightweight financial to-dos)
-- ===========================================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  done        boolean not null default false,
  due_date    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_tasks_user on public.tasks(user_id);

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- ROW LEVEL SECURITY
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.budgets        enable row level security;
alter table public.expenses       enable row level security;
alter table public.ai_chats       enable row level security;
alter table public.ai_messages    enable row level security;
alter table public.notifications  enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.family_members enable row level security;
alter table public.tasks          enable row level security;

-- profiles: a user can see/update only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Generic per-user tables: owner-only full access via user_id = auth.uid().
-- (categories, budgets, expenses, ai_chats, ai_messages, notifications, tasks)
do $$
declare t text;
begin
  foreach t in array array[
    'categories','budgets','expenses','ai_chats','ai_messages','notifications','tasks'
  ]
  loop
    execute format('drop policy if exists "%1$s_owner_all" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_owner_all" on public.%1$s
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- subscriptions: owner-only.
drop policy if exists "subscriptions_owner_all" on public.subscriptions;
create policy "subscriptions_owner_all" on public.subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- family_members: the owner manages rows; an invited member can see rows that
-- reference them.
drop policy if exists "family_owner_all" on public.family_members;
create policy "family_owner_all" on public.family_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "family_member_select" on public.family_members;
create policy "family_member_select" on public.family_members
  for select using (auth.uid() = member_id);

-- ===========================================================================
-- REALTIME  (lets the app receive live row changes across devices)
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['budgets','expenses','ai_chats','ai_messages','notifications','tasks']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ============================================================================
-- Done. Sign up a user in the app, then check Table Editor → expenses/budgets.
-- ============================================================================
