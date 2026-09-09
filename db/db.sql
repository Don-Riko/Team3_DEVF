-- Esquema de referencia para Midnight Cinema & Mood en Supabase.
-- Ejecuta este script en Supabase: SQL Editor -> New query -> Run.

-- Tabla de usuarios (login validado por el backend Express).
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  initials text not null default '',
  created_at timestamptz not null default now()
);

-- Tabla de selecciones de mood por usuario.
create table if not exists public.mood_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  mood text not null,
  created_at timestamptz not null default now()
);

-- Tabla de biblioteca por usuario (watchlist / vistas).
-- movie_id admite ids del catálogo local o ids de OMDB ("omdb-tt3896198").
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  movie_id text not null,
  source text not null default 'catalog',
  title text not null default '',
  poster text not null default '',
  year text not null default '',
  trailer_key text not null default '',
  status text not null default 'watchlist',
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

create index if not exists library_items_user_status_idx
  on public.library_items (user_id, status);

-- Migración para bases existentes.
alter table public.library_items
  add column if not exists trailer_key text not null default '';

-- Usuario de demo (Admin / Admin123), equivalente al actual mongo_usr.sql.
insert into public.users (username, password, initials)
values ('Admin', 'Admin123', 'AD')
on conflict (username) do nothing;