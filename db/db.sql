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

-- Usuario de demo (Admin / Admin123), equivalente al actual mongo_usr.sql.
insert into public.users (username, password, initials)
values ('Admin', 'Admin123', 'AD')
on conflict (username) do nothing;