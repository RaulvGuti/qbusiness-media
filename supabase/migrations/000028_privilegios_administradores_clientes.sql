-- ==========================================
-- Migración: privilegios_administradores_clientes
-- Corrección sobre 000020 sin editarla (migración sobre migración):
--
--   * administradores: el UPDATE de la tabla queda SOLO para el propio
--     usuario sobre su perfil. Las altas y bajas siguen siendo de administrador
--     y la consola SQL / el service role no se limitan (auth.uid() es null).
--     La contraseña NO vive aquí: está en auth.users.encrypted_password, a la
--     que anon y authenticated no tienen ningún privilegio. Solo cambia por el
--     SDK de Supabase Auth (exige la contraseña actual) o con service role
--     para reset. El correo de acceso tampoco se edita en esta tabla.
--
--   * clientes: 000020 hizo `revoke update` + `grant update (columnas)` lo que
--     limitó a TODOS los autenticados (también al administrador) a dos columnas.
--     Aquí se devuelve el UPDATE completo de la tabla y la limitación de
--     columnas pasa a un trigger que solo aplica a quien no es administrador.
--     Así el cliente sigue editando su nombre y teléfono desde su perfil, y el
--     administrador puede corregir correo, teléfono y datos de cualquier
--     cliente.
-- ==========================================

-- ---------- administradores ----------

drop policy "administradores_admin_all" on administradores;

create policy "administradores_alta"
    on administradores for insert to authenticated
    with check (public.es_admin());

create policy "administradores_baja"
    on administradores for delete to authenticated
    using (public.es_admin());

create policy "administradores_update_propio"
    on administradores for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());

-- El SELECT ya estaba: "administradores_lectura_propia_o_admin" (000020).
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
    return new;
end;
$$;

create trigger trg_administradores_guardar_perfil
before update on administradores
for each row execute function public.administradores_guardar_perfil();

-- ---------- clientes ----------

-- Devuelve el UPDATE de tabla completa (quita los privilegios por columna de
-- 000020 y otorga la columna entera, que es la que necesita el administrador).
revoke update (nombre_completo, telefono) on clientes from authenticated;
grant update on clientes to authenticated;

create or replace function public.clientes_guardar_perfil()
returns trigger
language plpgsql
as $$
begin
    -- consola SQL / service role y administradores no se limitan
    if auth.uid() is null or public.es_admin() then
        return new;
    end if;

    if new.id is distinct from old.id
        or new.correo is distinct from old.correo
        or new.creado_en is distinct from old.creado_en then
        raise exception 'Desde tu perfil solo puedes actualizar tu nombre y tu teléfono.';
    end if;
    return new;
end;
$$;

create trigger trg_clientes_guardar_perfil
before update on clientes
for each row execute function public.clientes_guardar_perfil();
