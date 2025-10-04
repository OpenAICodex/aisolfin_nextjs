-- Enable required extensions
create extension if not exists "vector";

-- Profiles table mirrors Supabase auth.users and stores a role per user.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  role text not null default 'user'
);

-- Evaluations table stores raw inputs and LLM outputs.
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  input jsonb not null,
  outputs jsonb not null,
  created_at timestamptz not null default now()
);

-- Rate limits table keeps track of the number of evaluations per user per day.
create table if not exists rate_limits (
  user_id uuid primary key references profiles (id) on delete cascade,
  date date not null,
  count integer not null default 0
);

-- Admin settings holds editable prompt templates and active document version.
create table if not exists admin_settings (
  id integer primary key default 1,
  prompts jsonb not null default '{}',
  active_doc_version integer
);

-- Documents represent uploaded regulation PDFs and their metadata.
create table if not exists documents (
  id serial primary key,
  version integer not null,
  title text,
  file_url text,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Doc chunks store text chunks and embeddings derived from documents.
create table if not exists doc_chunks (
  id serial primary key,
  doc_id integer not null references documents (id) on delete cascade,
  chunk text not null,
  embedding vector(1536),
  meta jsonb
);

-- Ensure a single row exists in admin_settings
insert into admin_settings (id) values (1) on conflict (id) do nothing;

-- Enable row level security on all tables
alter table profiles enable row level security;
alter table evaluations enable row level security;
alter table rate_limits enable row level security;
alter table admin_settings enable row level security;
alter table documents enable row level security;
alter table doc_chunks enable row level security;



-- Profiles: users can view their own profile. Admin role is determined by a role column.
drop policy if exists "Profiles: Self read" on profiles;

create policy "Profiles: Self read"
on profiles
for select
using (id = auth.uid());

drop policy if exists "Profiles: Self write" on profiles;

create policy "Profiles: Self write"
on profiles
for select
using (id = auth.uid());



-- Rate limits row level security policies

-- Allow each user to view their own rate limit row.  This is not strictly
-- required for the evaluation flow but enables debugging and admin
-- interfaces to show the current quota usage.  Only the owner can
-- select their record.

drop policy if exists "Rate limits: Self read" on rate_limits;

create policy "Rate limits: Self read"
on rate_limits
for select
using (user_id = auth.uid());

-- Permit users to insert a rate limit record for themselves.  The
-- primary key on rate_limits is user_id so at most one row exists per
-- user.  When a new user performs their first evaluation we insert a
-- record with the current date and count.

drop policy if exists "Rate limits: Self write" on rate_limits;

create policy "Rate limits: Self write"
on rate_limits
for select
using (user_id = auth.uid());

-- Allow users to update their own rate limit row.  Updates are used
-- during the evaluation flow to increment the count and roll over to a
-- new date at midnight.  Without this policy the anonymous key would
-- fail to update the row when no service key is present.



drop policy if exists "Rate limits: Self update" on rate_limits;

create policy "Rate limits: Self update"
on rate_limits
for update
using (user_id = auth.uid());


-- Profiles: users can view their own profile. Admin role is determined by a role column.
drop policy if exists "Profiles: Admin manage" on profiles;

create policy "Profiles: Admin manage"
on profiles
for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));



-- Evaluations: users can insert and view their own evaluations.
drop policy if exists "Evaluations: Self read" on evaluations;

create policy "Evaluations: Self read"
on evaluations
for select
using (user_id = auth.uid());


drop policy if exists "Evaluations: Self write" on evaluations;

create policy "Evaluations: Self write"
on evaluations
for insert
with check (user_id = auth.uid());



-- Admin settings: only admins can read and write.
drop policy if exists "Admin settings: Admin manage" on admin_settings;

create policy "Admin settings: Admin manage"
on admin_settings
for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));




-- Documents: only admins can manage documents.

drop policy if exists "Documents: Admin manage" on documents;

create policy "Documents: Admin manage"
on documents
for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));


-- Doc chunks: only admins can manage doc chunks.
drop policy if exists "Doc chunks: Admin manage" on doc_chunks;

create policy "Doc chunks: Admin manage"
on doc_chunks
for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

