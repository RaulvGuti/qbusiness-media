-- ==========================================
-- Migración: roles_y_permisos_administrativos
-- Agrega roles al equipo interno y separa lo que puede hacer cada uno.
--
--   * admin_principal: acceso total (contenido, tarifas, configuración,
--     cuentas del equipo y toda la operación).
--   * secretaria: operación del día a día (contactos, apoyo social, reseñas y
--     reservas) sin poder tocar contenido, tarifas, configuración ni cuentas.
--
-- Decisiones:
--   * Las cuentas que ya existían quedan como `admin_principal` para no quitar
--     acceso a nadie; las nuevas nacen como `secretaria` (mínimo privilegio).
--   * `es_admin()` conserva su significado histórico ("es del equipo") para las
--     políticas que solo piden pertenencia. La escritura sensible pasa a
--     `es_admin_principal()`.
--   * Los triggers de `auth.uid() is null` dejan pasar a la consola SQL y al
--     service role, igual que en 000032, 000033 y 000037.
--   * Un trigger impide que una secretaria se ascienda sola editando su fila.
--   * Las RPC de la galería son `security definer`: por eso además de las
--     políticas se agrega un trigger de tabla que exige admin principal.
--
-- Requiere: 000012, 000013, 000014, 000020, 000028 y 000032.
-- ==========================================

-- ---------- 1) columna de rol ----------

alter table public.administradores
    add column if not exists rol varchar;

-- Quien ya estaba dentro conserva el acceso completo.
update public.administradores
   set rol = 'admin_principal'
 where rol is null;

alter table public.administradores
    alter column rol set default 'secretaria';

alter table public.administradores
    alter column rol set not null;

alter table public.administradores
    drop constraint if exists administradores_rol_check;

alter table public.administradores
    add constraint administradores_rol_check
    check (rol in ('admin_principal', 'secretaria'));

comment on column public.administradores.rol is
    'admin_principal: acceso total. secretaria: solo operación (contactos, apoyo social, reseñas y reservas).';

-- ---------- 2) helpers de rol ----------

-- Pertenencia al equipo interno (mismo significado que tenía `es_admin()`).
create or replace function public.es_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.administradores where id = auth.uid()
    );
$$;

-- Rol activo del usuario conectado; null si no es del equipo.
create or replace function public.rol_actual()
returns varchar
language sql
stable
security definer
set search_path = public
as $$
    select a.rol
    from public.administradores a
    where a.id = auth.uid();
$$;

create or replace function public.es_admin_principal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.administradores a
        where a.id = auth.uid()
          and a.rol = 'admin_principal'
    );
$$;

-- Compatibilidad: todas las políticas y funciones anteriores siguen llamando a
-- `es_admin()`, que ahora significa "es del equipo".
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.es_staff();
$$;

revoke all on function public.es_staff() from public;
revoke all on function public.rol_actual() from public;
revoke all on function public.es_admin_principal() from public;
revoke all on function public.es_admin() from public;

grant execute on function public.es_staff() to anon, authenticated;
grant execute on function public.rol_actual() to authenticated;
grant execute on function public.es_admin_principal() to anon, authenticated;
grant execute on function public.es_admin() to anon, authenticated;

-- ---------- 3) políticas: lectura y escritura por rol ----------

-- administradores: cada quien ve su fila; solo el principal ve y administra al
-- resto del equipo.
drop policy if exists "administradores_lectura_propia_o_admin" on public.administradores;
create policy "administradores_lectura_propia_o_principal"
    on public.administradores for select to authenticated
    using (id = auth.uid() or public.es_admin_principal());

drop policy if exists "administradores_alta" on public.administradores;
create policy "administradores_alta"
    on public.administradores for insert to authenticated
    with check (public.es_admin_principal());

drop policy if exists "administradores_baja" on public.administradores;
create policy "administradores_baja"
    on public.administradores for delete to authenticated
    using (public.es_admin_principal());

-- portafolio legado: el equipo lo consulta, solo el principal lo edita.
drop policy if exists "portafolio_admin_all" on public.portafolio;
create policy "portafolio_admin_all"
    on public.portafolio for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

-- catálogo de tarifas y equipo: solo el principal.
drop policy if exists "servicios_admin_all" on public.servicios_estudio;
create policy "servicios_admin_all"
    on public.servicios_estudio for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

drop policy if exists "equipos_admin_all" on public.inventario_equipos;
create policy "equipos_admin_all"
    on public.inventario_equipos for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

-- configuración y textos del sitio: solo el principal.
drop policy if exists "configuracion_admin_all" on public.configuracion_sitio;
create policy "configuracion_admin_all"
    on public.configuracion_sitio for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

-- galería y destacados: el equipo los consulta, solo el principal los edita.
drop policy if exists "empresas_admin_all" on public.empresas;
create policy "empresas_admin_all"
    on public.empresas for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

drop policy if exists "carpetas_admin_all" on public.carpetas_galeria;
create policy "carpetas_admin_all"
    on public.carpetas_galeria for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

drop policy if exists "archivos_admin_all" on public.archivos_galeria;
create policy "archivos_admin_all"
    on public.archivos_galeria for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

drop policy if exists "destacados_admin_all" on public.destacados;
create policy "destacados_admin_all"
    on public.destacados for all to authenticated
    using (public.es_admin_principal()) with check (public.es_admin_principal());

-- Storage: los buckets públicos se leen sin sesión y solo el principal escribe.
drop policy if exists "galeria_insert_admin" on storage.objects;
create policy "galeria_insert_admin"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'galeria' and public.es_admin_principal());

drop policy if exists "galeria_update_admin" on storage.objects;
create policy "galeria_update_admin"
    on storage.objects for update to authenticated
    using (bucket_id = 'galeria' and public.es_admin_principal())
    with check (bucket_id = 'galeria' and public.es_admin_principal());

drop policy if exists "galeria_delete_admin" on storage.objects;
create policy "galeria_delete_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'galeria' and public.es_admin_principal());

drop policy if exists "logos_insert_admin" on storage.objects;
create policy "logos_insert_admin"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'logos' and public.es_admin_principal());

drop policy if exists "logos_update_admin" on storage.objects;
create policy "logos_update_admin"
    on storage.objects for update to authenticated
    using (bucket_id = 'logos' and public.es_admin_principal())
    with check (bucket_id = 'logos' and public.es_admin_principal());

drop policy if exists "logos_delete_admin" on storage.objects;
create policy "logos_delete_admin"
    on storage.objects for delete to authenticated
    using (bucket_id = 'logos' and public.es_admin_principal());

-- ---------- 4) trigger para las RPC security definer de galería ----------
-- Las RPC de 000033 y 000037 corren con los privilegios del dueño y por eso
-- saltan RLS. Este trigger vuelve a comprobar el rol antes de escribir.

create or replace function public.exigir_admin_principal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and not public.es_admin_principal() then
        raise exception 'Tu rol no permite modificar %. Solo el administrador principal puede hacerlo.', TG_TABLE_NAME
            using errcode = '42501',
                  hint = 'Solicita el cambio a un administrador principal.';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_empresas_solo_principal on public.empresas;
create trigger trg_empresas_solo_principal
before insert or update or delete on public.empresas
for each row execute function public.exigir_admin_principal();

drop trigger if exists trg_carpetas_solo_principal on public.carpetas_galeria;
create trigger trg_carpetas_solo_principal
before insert or update or delete on public.carpetas_galeria
for each row execute function public.exigir_admin_principal();

drop trigger if exists trg_archivos_solo_principal on public.archivos_galeria;
create trigger trg_archivos_solo_principal
before insert or update or delete on public.archivos_galeria
for each row execute function public.exigir_admin_principal();

drop trigger if exists trg_destacados_solo_principal on public.destacados;
create trigger trg_destacados_solo_principal
before insert or update or delete on public.destacados
for each row execute function public.exigir_admin_principal();

-- ---------- 5) el perfil propio no puede cambiar el rol ----------

create or replace function public.administradores_guardar_perfil()
returns trigger
language plpgsql
as $$
begin
    -- consola SQL y service role (sin sesión de usuario) no se limitan
    if auth.uid() is null then
        return new;
    end if;

    if new.id is distinct from old.id then
        raise exception 'No se puede cambiar el identificador de la cuenta.';
    end if;
    if new.correo is distinct from old.correo then
        raise exception 'El correo de acceso se cambia desde la autenticación, no desde el perfil.';
    end if;
    if new.creado_en is distinct from old.creado_en then
        raise exception 'No se puede modificar la fecha de creación de la cuenta.';
    end if;

    -- Solo el principal mueve roles; una secretaria no puede ascenderse sola.
    if new.rol is distinct from old.rol and not public.es_admin_principal() then
        raise exception 'Solo el administrador principal puede cambiar el rol de una cuenta.';
    end if;

    return new;
end;
$$;

-- ---------- 6) alta y cambios de rol de cuentas del equipo ----------

-- Se elimina la firma anterior para no dejar dos funciones ambiguas al llamar
-- con un solo argumento.
drop function if exists public.crear_administrador(varchar);

create or replace function public.crear_administrador(
    p_correo varchar,
    p_rol    varchar default 'secretaria'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_correo  varchar := lower(nullif(btrim(p_correo), ''));
    v_rol     varchar := nullif(btrim(p_rol), '');
    v_usuario auth.users%rowtype;
begin
    if auth.uid() is not null and not public.es_admin_principal() then
        raise exception 'Solo el administrador principal puede dar acceso al panel.';
    end if;

    if v_correo is null then
        raise exception 'Indica el correo de la cuenta.';
    end if;

    v_rol := coalesce(v_rol, 'secretaria');
    if v_rol not in ('admin_principal', 'secretaria') then
        raise exception 'El rol % no es válido. Usa admin_principal o secretaria.', v_rol;
    end if;

    select * into v_usuario
    from auth.users
    where lower(email) = v_correo;

    if not found then
        raise exception 'No existe una cuenta con el correo %. Créala primero.', v_correo;
    end if;

    if exists (select 1 from public.administradores where id = v_usuario.id) then
        raise exception 'La cuenta % ya tiene acceso al panel.', v_correo;
    end if;

    insert into public.administradores (id, nombre_completo, correo, telefono, rol)
    values (
        v_usuario.id,
        coalesce(
            nullif(btrim(v_usuario.raw_user_meta_data->>'nombre_completo'), ''),
            split_part(v_usuario.email, '@', 1)
        ),
        v_usuario.email,
        nullif(btrim(v_usuario.raw_user_meta_data->>'telefono'), ''),
        v_rol
    );

    return v_usuario.id;
end;
$$;

revoke all on function public.crear_administrador(varchar, varchar) from public, anon;
grant execute on function public.crear_administrador(varchar, varchar) to authenticated, service_role;

-- Cambio de rol con protección del último administrador principal.
create or replace function public.cambiar_rol_administrador(
    p_id  uuid,
    p_rol varchar
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_rol   varchar := nullif(btrim(p_rol), '');
    v_actual varchar;
begin
    if auth.uid() is not null and not public.es_admin_principal() then
        raise exception 'Solo el administrador principal puede cambiar roles.';
    end if;

    if v_rol is null or v_rol not in ('admin_principal', 'secretaria') then
        raise exception 'El rol indicado no es válido. Usa admin_principal o secretaria.';
    end if;

    select rol into v_actual
    from public.administradores
    where id = p_id;

    if not found then
        raise exception 'La cuenta indicada no pertenece al equipo.';
    end if;

    if v_actual = 'admin_principal' and v_rol <> 'admin_principal' then
        if (select count(*) from public.administradores where rol = 'admin_principal') <= 1 then
            raise exception 'Debe quedar al menos un administrador principal.';
        end if;
    end if;

    update public.administradores
       set rol = v_rol
     where id = p_id;
end;
$$;

revoke all on function public.cambiar_rol_administrador(uuid, varchar) from public, anon;
grant execute on function public.cambiar_rol_administrador(uuid, varchar) to authenticated, service_role;

-- Quitar acceso al panel: no borra la cuenta de Auth ni la ficha de cliente.
create or replace function public.quitar_administrador(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_rol varchar;
begin
    if auth.uid() is not null and not public.es_admin_principal() then
        raise exception 'Solo el administrador principal puede quitar accesos.';
    end if;

    if p_id = auth.uid() then
        raise exception 'No puedes quitarte tu propio acceso al panel.';
    end if;

    select rol into v_rol
    from public.administradores
    where id = p_id;

    if not found then
        raise exception 'La cuenta indicada no pertenece al equipo.';
    end if;

    if v_rol = 'admin_principal'
       and (select count(*) from public.administradores where rol = 'admin_principal') <= 1 then
        raise exception 'Debe quedar al menos un administrador principal.';
    end if;

    delete from public.administradores where id = p_id;
end;
$$;

revoke all on function public.quitar_administrador(uuid) from public, anon;
grant execute on function public.quitar_administrador(uuid) to authenticated, service_role;

-- ---------- 7) documentación operativa ----------

-- Crear el primer administrador principal desde la consola SQL (auth.uid() es null):
--   insert into public.administradores (id, nombre_completo, correo, rol)
--   select id, coalesce(nullif(raw_user_meta_data->>'nombre_completo', ''), split_part(email, '@', 1)), email, 'admin_principal'
--   from auth.users
--   where lower(email) = 'admin@tucorreo.com';
--
-- Dar acceso a una cuenta que ya existe en Authentication > Users:
--   select public.crear_administrador('secretaria@tucorreo.com', 'secretaria');
