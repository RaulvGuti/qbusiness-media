-- ==========================================
-- Migración: administradores_alta_y_sincronizacion_auth
-- 1) crear_administrador(correo): alta de un administrador sin pegar SQL a mano.
--    * Desde la consola SQL o con service role (auth.uid() es null) sirve para
--      crear al PRIMER administrador.
--    * Con sesión, solo la puede usar quien ya es administrador.
--    * La cuenta debe existir antes en Authentication > Users.
--    * No la quita de `clientes` (una persona puede ser admin y cliente).
--
--    Primer administrador:
--      select public.crear_administrador('admin@tucorreo.com');
--
-- 2) Sincronización auth.users -> perfiles. 000028 dice que el correo "se
--    cambia desde la autenticación", pero nada lo propagaba. Ahora:
--    * si cambia el correo en auth.users, se actualiza en clientes y administradores
--    * si cambian nombre_completo o telefono en los metadatos, se actualizan en
--      los perfiles (solo cuando el valor nuevo no está vacío y cambió).
--
-- Requiere: 000012, 000013 y 000028.
-- No toca contraseñas, tokens ni columnas internas de GoTrue: solo lee
-- `email` y `raw_user_meta_data` y actualiza los perfiles públicos.
-- ==========================================

create or replace function public.crear_administrador(p_correo varchar)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_correo  varchar := lower(nullif(btrim(p_correo), ''));
    v_usuario auth.users%rowtype;
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede dar de alta a otro administrador.';
    end if;

    if v_correo is null then
        raise exception 'Indica el correo de la cuenta.';
    end if;

    select * into v_usuario
    from auth.users
    where lower(email) = v_correo;

    if not found then
        raise exception 'No existe una cuenta con el correo %. Créala primero en Authentication > Users.', v_correo;
    end if;

    insert into public.administradores (id, nombre_completo, correo, telefono)
    values (
        v_usuario.id,
        coalesce(
            nullif(btrim(v_usuario.raw_user_meta_data->>'nombre_completo'), ''),
            split_part(v_usuario.email, '@', 1)
        ),
        v_usuario.email,
        nullif(btrim(v_usuario.raw_user_meta_data->>'telefono'), '')
    )
    on conflict (id) do nothing;

    return v_usuario.id;
end;
$$;

revoke all on function public.crear_administrador(varchar) from public, anon;
grant execute on function public.crear_administrador(varchar) to authenticated, service_role;

-- ---------- sincronización de perfiles ----------

create or replace function public.sincronizar_perfil_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre   text := nullif(btrim(new.raw_user_meta_data->>'nombre_completo'), '');
    v_telefono text := nullif(btrim(new.raw_user_meta_data->>'telefono'), '');
begin
    if new.email is not null and new.email is distinct from old.email then
        update public.clientes        set correo = new.email where id = new.id;
        update public.administradores set correo = new.email where id = new.id;
    end if;

    if v_nombre is not null
       and v_nombre is distinct from nullif(btrim(old.raw_user_meta_data->>'nombre_completo'), '') then
        update public.clientes        set nombre_completo = v_nombre where id = new.id;
        update public.administradores set nombre_completo = v_nombre where id = new.id;
    end if;

    if v_telefono is not null
       and v_telefono is distinct from nullif(btrim(old.raw_user_meta_data->>'telefono'), '') then
        update public.clientes        set telefono = v_telefono where id = new.id;
        update public.administradores set telefono = v_telefono where id = new.id;
    end if;

    return new;
end;
$$;

-- Coexiste con on_auth_user_created (000013, solo INSERT).
-- No toca encrypted_password, tokens de confirmación ni recuperación.
drop trigger if exists trg_sincronizar_perfil_auth on auth.users;
create trigger trg_sincronizar_perfil_auth
after update of email, raw_user_meta_data on auth.users
for each row execute function public.sincronizar_perfil_auth();
