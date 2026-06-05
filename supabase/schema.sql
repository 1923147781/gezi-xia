create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  avatar_seed text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.users(id) on delete set null,
  count integer not null default 0,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member',
  goose_rate integer not null default 50,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  author text not null,
  text text not null,
  message_type text not null default 'normal',
  created_at timestamptz not null default now()
);

create table if not exists public.shake_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  target_user_id uuid references public.users(id) on delete set null,
  target_name text not null,
  title text not null,
  detail text not null,
  progress integer not null default 68,
  created_at timestamptz not null default now()
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  from_user_id uuid references public.users(id) on delete set null,
  to_user_id uuid references public.users(id) on delete set null,
  invite_type text not null default 'shake',
  status text not null default 'pending',
  detail text not null,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.shake_events enable row level security;
alter table public.invites enable row level security;

create policy "public read users" on public.users for select using (true);
create policy "public write users" on public.users for insert with check (true);
create policy "public update users" on public.users for update using (true) with check (true);

create policy "public read groups" on public.groups for select using (true);
create policy "public write groups" on public.groups for insert with check (true);
create policy "public update groups" on public.groups for update using (true) with check (true);

create policy "public read group_members" on public.group_members for select using (true);
create policy "public write group_members" on public.group_members for insert with check (true);
create policy "public update group_members" on public.group_members for update using (true) with check (true);

create policy "public read messages" on public.messages for select using (true);
create policy "public write messages" on public.messages for insert with check (true);

create policy "public read shake_events" on public.shake_events for select using (true);
create policy "public write shake_events" on public.shake_events for insert with check (true);

create policy "public read invites" on public.invites for select using (true);
create policy "public write invites" on public.invites for insert with check (true);
create policy "public update invites" on public.invites for update using (true) with check (true);
