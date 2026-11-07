-- ==========================================
-- Migración: solicitar_reserva
-- Único camino para que un cliente cree una reserva. El cliente NO manda
-- precios: el total se calcula aquí con
--   (tarifa del salón + servicios + equipos x cantidad) x horas
-- usando configuracion_sitio, servicios_estudio e inventario_equipos.
-- La reserva queda 'pendiente' hasta que un administrador la confirme.
--
-- Parámetros (los del formulario):
--   p_nombre, p_correo, p_telefono   obligatorios
--   p_fecha, p_hora_inicio, p_hora_fin   obligatorios (mismo día, hora de Guatemala)
--   p_notas                          opcional
--   p_servicios                      ids de servicios_estudio
--   p_equipos                        [{"equipo_id":"<uuid>","cantidad":2}, ...]
-- Devuelve el id de la reserva.
-- ==========================================

create or replace function public.solicitar_reserva(
    p_nombre       varchar,
    p_correo       varchar,
    p_telefono     varchar,
    p_fecha        date,
    p_hora_inicio  time,
    p_hora_fin     time,
    p_notas        text    default null,
    p_servicios    uuid[]  default '{}',
    p_equipos      jsonb   default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cliente    public.clientes%rowtype;
    v_nombre     varchar;
    v_correo     varchar;
    v_telefono   varchar;
    v_inicio     timestamptz;
    v_fin        timestamptz;
    v_horas      numeric;
    v_tarifa     decimal(10,2);
    v_serv       decimal(10,2);
    v_equip      decimal(10,2);
    v_total      decimal(10,2);
    v_servicios  uuid[] := coalesce(p_servicios, '{}');
    v_equipos    jsonb  := coalesce(p_equipos, '[]'::jsonb);
    v_reserva_id uuid;
begin
    select * into v_cliente from public.clientes where id = auth.uid();
    if not found then
        raise exception 'Debes iniciar sesión con una cuenta de cliente para reservar.';
    end if;

    v_nombre   := nullif(trim(p_nombre), '');
    v_correo   := nullif(trim(p_correo), '');
    v_telefono := nullif(trim(p_telefono), '');

    if v_nombre is null then
        raise exception 'Indica tu nombre completo.';
    end if;
    if v_correo is null or v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
        raise exception 'Indica un correo electrónico válido.';
    end if;
    if v_telefono is null then
        raise exception 'Indica un teléfono o WhatsApp de contacto.';
    end if;

    if p_hora_fin <= p_hora_inicio then
        raise exception 'La hora de fin debe ser posterior a la hora de inicio.';
    end if;

    v_inicio := (p_fecha + p_hora_inicio) at time zone 'America/Guatemala';
    v_fin    := (p_fecha + p_hora_fin)    at time zone 'America/Guatemala';

    if v_inicio <= now() then
        raise exception 'No se puede reservar en una fecha u hora pasada.';
    end if;

    select nullif(valor, '')::numeric(10,2) into v_tarifa
    from public.configuracion_sitio
    where grupo = 'estudio' and clave = 'tarifa_hora';

    if v_tarifa is null or v_tarifa <= 0 then
        raise exception 'La tarifa por hora aún no está configurada.';
    end if;

    -- Servicios: todos deben existir y estar activos
    if (select count(*) from public.servicios_estudio where id = any(v_servicios) and activo)
       <> (select count(distinct x) from unnest(v_servicios) as x) then
        raise exception 'Alguno de los servicios no existe o no está disponible.';
    end if;

    -- Equipos: cantidades válidas, equipo activo y dentro del stock
    if exists (
        select 1
        from jsonb_to_recordset(v_equipos) as e(equipo_id uuid, cantidad int)
        where e.equipo_id is null or e.cantidad is null or e.cantidad <= 0
    ) then
        raise exception 'Cada equipo debe indicar equipo_id y una cantidad mayor a 0.';
    end if;

    if exists (
        select 1
        from (
            select e.equipo_id, sum(e.cantidad) as cantidad
            from jsonb_to_recordset(v_equipos) as e(equipo_id uuid, cantidad int)
            group by e.equipo_id
        ) q
        left join public.inventario_equipos i on i.id = q.equipo_id
        where i.id is null or not i.activo or q.cantidad > i.cantidad_total
    ) then
        raise exception 'Alguno de los equipos no existe, no está activo o supera el stock disponible.';
    end if;

    -- Total = (tarifa salón + servicios + equipos x cantidad) x horas
    v_horas := extract(epoch from (v_fin - v_inicio)) / 3600;

    select coalesce(sum(precio_por_hora), 0) into v_serv
    from public.servicios_estudio
    where id = any(v_servicios) and activo;

    select coalesce(sum(i.precio_por_hora * q.cantidad), 0) into v_equip
    from (
        select e.equipo_id, sum(e.cantidad) as cantidad
        from jsonb_to_recordset(v_equipos) as e(equipo_id uuid, cantidad int)
        group by e.equipo_id
    ) q
    join public.inventario_equipos i on i.id = q.equipo_id;

    v_total := round((v_tarifa + v_serv + v_equip) * v_horas, 2);

    -- El trigger validar_reserva rechaza horarios ocupados o bloqueados
    insert into public.reservas (
        cliente_id, nombre, correo, telefono,
        fecha_hora_inicio, fecha_hora_fin,
        tarifa_hora_aplicada, total_calculado, notas_cliente
    ) values (
        v_cliente.id, v_nombre, v_correo, v_telefono,
        v_inicio, v_fin,
        v_tarifa, v_total, p_notas
    )
    returning id into v_reserva_id;

    -- precio_congelado = precio por hora vigente al momento de reservar
    insert into public.reserva_servicios (reserva_id, servicio_id, precio_congelado)
    select v_reserva_id, id, precio_por_hora
    from public.servicios_estudio
    where id = any(v_servicios) and activo;

    insert into public.reserva_equipos (reserva_id, equipo_id, cantidad_rentada, precio_congelado)
    select v_reserva_id, i.id, q.cantidad, i.precio_por_hora
    from (
        select e.equipo_id, sum(e.cantidad) as cantidad
        from jsonb_to_recordset(v_equipos) as e(equipo_id uuid, cantidad int)
        group by e.equipo_id
    ) q
    join public.inventario_equipos i on i.id = q.equipo_id;

    return v_reserva_id;
end;
$$;

-- Solo usuarios con sesión pueden ejecutarla
revoke all on function public.solicitar_reserva(varchar, varchar, varchar, date, time, time, text, uuid[], jsonb) from public, anon;
grant execute on function public.solicitar_reserva(varchar, varchar, varchar, date, time, time, text, uuid[], jsonb) to authenticated;
