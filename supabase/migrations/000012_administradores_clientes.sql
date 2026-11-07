-- ==========================================
-- Migración: administradores_clientes
-- Reemplaza a `usuarios` por dos tablas ligadas a Supabase Auth:
--   * administradores: equipo interno con acceso al panel (incluye a quien
--     antes tenía rol 'colaborador').
--   * clientes: personas que reservan el estudio y dejan reseñas.
-- El `id` es el mismo de auth.users, así que quien inicia sesión se
-- identifica con auth.uid() sin tablas intermedias.
--
-- Los datos de `usuarios` se copian cruzando por correo con auth.users. Quien
-- no tenga cuenta de Auth con el mismo correo NO se copia (se avisa con NOTICE).
-- ==========================================

create table administradores (
    id              uuid primary key references auth.users(id) on delete cascade,
    nombre_completo varchar not null,
    correo          varchar not null unique,
    telefono        varchar,
    creado_en       timestamptz not null default now()
);

create table clientes (
    id              uuid primary key references auth.users(id) on delete cascade,
    nombre_completo varchar not null,
    correo          varchar not null unique,
    telefono        varchar,
    creado_en       timestamptz not null default now()
);

-- ¿El usuario actual es administrador? Se usa en todas las políticas RLS.
-- security definer evita recursión con las políticas de `administradores`.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from public.administradores where id = auth.uid());
$$;

revoke all on function public.es_admin() from public;
grant execute on function public.es_admin() to anon, authenticated;

-- Copia de los datos existentes (admin y colaborador -> administradores)
insert into administradores (id, nombre_completo, correo, telefono, creado_en)
select au.id, u.nombre_completo, u.correo, u.telefono, u.creado_en
from usuarios u
join auth.users au on lower(au.email) = lower(u.correo)
where u.rol in ('admin', 'colaborador')
on conflict do nothing;

insert into clientes (id, nombre_completo, correo, telefono, creado_en)
select au.id, u.nombre_completo, u.correo, u.telefono, u.creado_en
from usuarios u
join auth.users au on lower(au.email) = lower(u.correo)
where u.rol = 'cliente'
on conflict do nothing;

do $$
declare
    v_sin_cuenta int;
begin
    select count(*) into v_sin_cuenta
    from usuarios u
    where not exists (select 1 from auth.users au where lower(au.email) = lower(u.correo));

    if v_sin_cuenta > 0 then
        raise notice '% usuario(s) de la tabla usuarios no tienen cuenta en auth.users con el mismo correo y NO se copiaron.', v_sin_cuenta;
    end if;
end $$;

-- Para crear un administrador nuevo (ejecutar a mano en el SQL Editor):
-- insert into administradores (id, nombre_completo, correo)
-- select id,
--        coalesce(nullif(raw_user_meta_data->>'nombre_completo',''), split_part(email,'@',1)),
--        email
-- from auth.users
-- where email = 'admin@tucorreo.com';