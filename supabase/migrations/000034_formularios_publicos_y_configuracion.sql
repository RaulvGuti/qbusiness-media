-- ==========================================
-- Migración: formularios_publicos_y_configuracion
-- Requiere: 000010, 000011, 000016, 000025 y 000030.
--
-- 1) Funciones de alta para los formularios de contacto y de apoyo social,
--    pensadas para uso del SERVIDOR con la service role key (AGENTS.md §4.5):
--        select public.enviar_contacto(...);
--        select public.enviar_solicitud_apoyo(...);
--    Validan los campos obligatorios, normalizan el correo a minúsculas y
--    limitan el tamaño de cada campo (254 para correo y campos cortos, 5000
--    para los textos largos, como las rutas del servidor).
--    leads_contacto y solicitudes_apoyo_social siguen siendo solo-admin: no se
--    agrega ninguna política de INSERT y anon/authenticated NO pueden ejecutar
--    las funciones.
--    La solicitud de apoyo guarda tipo_organizacion y fecha_tentativa (000030),
--    que son las columnas que lee el panel; tipo_entidad y fecha_evento (000025)
--    quedan sin usar para los registros nuevos.
--
-- 2) Filas iniciales de configuracion_sitio para las pantallas "Contacto y
--    redes" y "Ubicación" (valor null hasta que el administrador las llene).
-- ==========================================

create or replace function public.enviar_contacto(
    p_nombre         varchar,
    p_correo         varchar,
    p_telefono       varchar default null,
    p_mensaje        text    default null,
    p_empresa        varchar default null,
    p_tipo_servicio  varchar default null,
    p_presupuesto    varchar default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre varchar := nullif(btrim(p_nombre), '');
    v_correo varchar := lower(nullif(btrim(p_correo), ''));
    v_id     uuid;
begin
    if v_nombre is null then
        raise exception 'Indica tu nombre.';
    end if;
    if v_correo is null or v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Indica un correo electrónico válido.';
    end if;
    if greatest(length(v_nombre), length(v_correo), length(coalesce(p_telefono, '')),
                length(coalesce(p_empresa, '')), length(coalesce(p_tipo_servicio, '')),
                length(coalesce(p_presupuesto, ''))) > 254
       or length(coalesce(p_mensaje, '')) > 5000 then
        raise exception 'Alguno de los textos es demasiado largo.';
    end if;

    insert into public.leads_contacto (
        nombre, correo, telefono, mensaje, empresa, tipo_servicio, presupuesto
    ) values (
        v_nombre, v_correo, nullif(btrim(p_telefono), ''), nullif(btrim(p_mensaje), ''),
        nullif(btrim(p_empresa), ''), nullif(btrim(p_tipo_servicio), ''),
        nullif(btrim(p_presupuesto), '')
    )
    returning id into v_id;

    return v_id;
end;
$$;

revoke all on function public.enviar_contacto(varchar, varchar, varchar, text, varchar, varchar, varchar)
    from public, anon, authenticated;
grant execute on function public.enviar_contacto(varchar, varchar, varchar, text, varchar, varchar, varchar)
    to service_role;

create or replace function public.enviar_solicitud_apoyo(
    p_nombre_entidad       varchar,
    p_persona_contacto     varchar,
    p_correo               varchar,
    p_telefono             varchar default null,
    p_descripcion_proyecto text    default null,
    p_tipo_organizacion    varchar default null,
    p_cargo_contacto       varchar default null,
    p_ubicacion            varchar default null,
    p_objetivo_apoyo       text    default null,
    p_fecha_tentativa      date    default null,
    p_publico_beneficiario text    default null,
    p_alcance_solicitado   varchar default null,
    p_presupuesto_propio   varchar default null,
    p_comentarios          text    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_entidad varchar := nullif(btrim(p_nombre_entidad), '');
    v_persona varchar := nullif(btrim(p_persona_contacto), '');
    v_correo  varchar := lower(nullif(btrim(p_correo), ''));
    v_id      uuid;
begin
    if v_entidad is null then
        raise exception 'Indica el nombre de la organización.';
    end if;
    if v_persona is null then
        raise exception 'Indica la persona de contacto.';
    end if;
    if v_correo is null or v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Indica un correo electrónico válido.';
    end if;
    if greatest(length(v_entidad), length(v_persona), length(v_correo),
                length(coalesce(p_telefono, '')), length(coalesce(p_tipo_organizacion, '')),
                length(coalesce(p_cargo_contacto, '')), length(coalesce(p_ubicacion, '')),
                length(coalesce(p_alcance_solicitado, '')),
                length(coalesce(p_presupuesto_propio, ''))) > 254
       or greatest(length(coalesce(p_descripcion_proyecto, '')), length(coalesce(p_objetivo_apoyo, '')),
                   length(coalesce(p_publico_beneficiario, '')), length(coalesce(p_comentarios, ''))) > 5000 then
        raise exception 'Alguno de los textos es demasiado largo.';
    end if;

    insert into public.solicitudes_apoyo_social (
        nombre_entidad, persona_contacto, correo, telefono, descripcion_proyecto,
        tipo_organizacion, cargo_contacto, ubicacion, objetivo_apoyo, fecha_tentativa,
        publico_beneficiario, alcance_solicitado, presupuesto_propio, comentarios
    ) values (
        v_entidad, v_persona, v_correo, nullif(btrim(p_telefono), ''),
        nullif(btrim(p_descripcion_proyecto), ''), nullif(btrim(p_tipo_organizacion), ''),
        nullif(btrim(p_cargo_contacto), ''), nullif(btrim(p_ubicacion), ''),
        nullif(btrim(p_objetivo_apoyo), ''), p_fecha_tentativa,
        nullif(btrim(p_publico_beneficiario), ''), nullif(btrim(p_alcance_solicitado), ''),
        nullif(btrim(p_presupuesto_propio), ''), nullif(btrim(p_comentarios), '')
    )
    returning id into v_id;

    return v_id;
end;
$$;

revoke all on function public.enviar_solicitud_apoyo(varchar, varchar, varchar, varchar, text, varchar, varchar, varchar, text, date, text, varchar, varchar, text)
    from public, anon, authenticated;
grant execute on function public.enviar_solicitud_apoyo(varchar, varchar, varchar, varchar, text, varchar, varchar, varchar, text, date, text, varchar, varchar, text)
    to service_role;

-- ---------- configuración inicial de contacto, redes y ubicación ----------

insert into public.configuracion_sitio (grupo, clave, valor) values
    ('contacto',  'whatsapp',  null),
    ('contacto',  'correo',    null),
    ('redes',     'instagram', null),
    ('redes',     'tiktok',    null),
    ('redes',     'youtube',   null),
    ('ubicacion', 'direccion', null)
on conflict (grupo, clave) do nothing;
