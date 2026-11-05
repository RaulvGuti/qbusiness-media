-- ==========================================
-- Migración: paquetes_y_descuento_lealtad
-- Requiere: 000005, 000006, 000015, 000022, 000029, 000031, 000038 y 000041.
--
-- La renta del estudio deja de cobrarse por hora suelta y pasa a paquetes
-- cerrados de horas y precio:
--   * paquetes_estudio: nombre, horas, precio, activo y orden.
--   * reservas guarda el paquete congelado (id, nombre, horas y precio final)
--     para que un cambio de catálogo no altere lo que el cliente ya aceptó.
--   * Si el cliente acumula 5 o más reservas 'completada', el paquete recibe
--     25% de descuento. El descuento se calcula en el servidor y se mantiene
--     en las reservas siguientes mientras el historial siga cumpliendo.
--   * Servicios y equipos siguen cobrándose por hora, encima del paquete.
--   * Sin un paquete activo no se puede reservar: ya no hay tarifa por hora
--     de respaldo. La fila histórica estudio/tarifa_hora se conserva solo
--     para no romper configuraciones anteriores.
--
-- El precio definitivo lo calcula solicitar_reserva(); el frontend solo
-- muestra un estimado. RLS: lectura pública de paquetes activos y escritura
-- exclusiva de admin_principal, igual que servicios_estudio e inventario.
-- ==========================================

-- ---------- 1) catálogo de paquetes ----------

create table if not exists public.paquetes_estudio (
    id          uuid primary key default gen_random_uuid(),
    nombre      varchar not null unique,
    horas       numeric(4,1) not null check (horas > 0 and horas <= 24),
    precio      decimal(10,2) not null check (precio >= 0),
    activo      boolean not null default true,
    orden       integer not null default 0,
    creado_en   timestamptz not null default now()
);

create index if not exists idx_paquetes_estudio_orden
    on public.paquetes_estudio (activo, orden, nombre);

alter table public.paquetes_estudio enable row level security;

create policy "paquetes_lectura_activos"
    on public.paquetes_estudio for select
    using (activo = true or public.es_admin_principal());

create policy "paquetes_admin_all"
    on public.paquetes_estudio for all to authenticated
    using (public.es_admin_principal())
    with check (public.es_admin_principal());

grant select on public.paquetes_estudio to anon, authenticated;
grant insert, update, delete on public.paquetes_estudio to authenticated;

-- ---------- 2) paquete y descuento congelados en la reserva ----------

alter table public.reservas
    add column if not exists paquete_id              uuid references public.paquetes_estudio(id) on delete set null,
    add column if not exists paquete_nombre          varchar,
    add column if not exists paquete_horas           numeric(4,1),
    add column if not exists paquete_precio          decimal(10,2) check (paquete_precio >= 0),
    add column if not exists descuento_lealtad       boolean not null default false,
    add column if not exists descuento_monto         decimal(10,2) not null default 0 check (descuento_monto >= 0);

-- ---------- 3) solicitar_reserva() con paquete obligatorio ----------

-- La firma cambia: p_hora_fin desaparece y en su lugar viaja p_paquete_id.
-- El servidor deriva la hora de fin de las horas del paquete.
drop function if exists public.solicitar_reserva(
    varchar, varchar, varchar, date, time, time, text, uuid[], jsonb
);

create or replace function public.solicitar_reserva(
    p_nombre       varchar,
    p_correo       varchar,
    p_telefono     varchar,
    p_fecha        date,
    p_hora_inicio  time,
    p_paquete_id   uuid,
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
    v_cliente             public.clientes%rowtype;
    v_paquete             public.paquetes_estudio%rowtype;
    v_nombre              varchar;
    v_correo              varchar;
    v_telefono            varchar;
    v_inicio              timestamptz;
    v_fin                 timestamptz;
    v_horas               numeric;
    v_precio_paquete      decimal(10,2);
    v_descuento           decimal(10,2) := 0;
    v_descuento_lealtad   boolean := false;
    v_completadas         integer;
    v_serv                decimal(10,2);
    v_equip               decimal(10,2);
    v_total               decimal(10,2);
    v_servicios           uuid[] := coalesce(p_servicios, '{}');
    v_equipos             jsonb  := coalesce(p_equipos, '[]'::jsonb);
    v_reserva_id          uuid;
begin
    if auth.uid() is null then
        raise exception 'Debes iniciar sesión con una cuenta de cliente para reservar.';
    end if;

    select * into v_cliente from public.clientes where id = auth.uid();

    if not found then
        insert into public.clientes (id, nombre_completo, correo, telefono)
        select
            au.id,
            coalesce(
                nullif(btrim(au.raw_user_meta_data->>'nombre_completo'), ''),
                nullif(btrim(au.raw_user_meta_data->>'full_name'), ''),
                nullif(btrim(au.raw_user_meta_data->>'name'), ''),
                nullif(btrim(p_nombre), ''),
                split_part(au.email, '@', 1)
            ),
            coalesce(au.email, nullif(btrim(p_correo), '')),
            coalesce(
                nullif(btrim(au.raw_user_meta_data->>'telefono'), ''),
                nullif(btrim(p_telefono), '')
            )
        from auth.users au
        where au.id = auth.uid()
        on conflict (id) do nothing;

        select * into v_cliente from public.clientes where id = auth.uid();
    end if;

    if not found then
        raise exception 'Debes iniciar sesión con una cuenta de cliente para reservar.';
    end if;

    if p_paquete_id is null then
        raise exception 'Selecciona un paquete de renta del estudio.';
    end if;

    select * into v_paquete
    from public.paquetes_estudio
    where id = p_paquete_id and activo = true;

    if not found then
        raise exception 'El paquete seleccionado no existe o ya no está disponible.';
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

    if p_hora_inicio is null then
        raise exception 'Indica la hora de inicio de la renta.';
    end if;

    v_inicio := (p_fecha + p_hora_inicio) at time zone 'America/Guatemala';
    v_horas  := v_paquete.horas;
    v_fin    := v_inicio + (v_horas || ' hours')::interval;

    if v_inicio <= now() then
        raise exception 'No se puede reservar en una fecha u hora pasada.';
    end if;

    -- El trigger validar_horario_atencion rechaza que la renta cruce de día o
    -- salga del horario configurado.

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

    -- Lealtad: 5 o más reservas completadas antes de esta solicitud.
    select count(*) into v_completadas
    from public.reservas
    where cliente_id = v_cliente.id and estado = 'completada';

    v_precio_paquete := v_paquete.precio;

    if v_completadas >= 5 then
        v_descuento := round(v_precio_paquete * 0.25, 2);
        v_precio_paquete := v_precio_paquete - v_descuento;
        v_descuento_lealtad := true;
    end if;

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

    -- Paquete cerrado + (servicios + equipos por hora) x horas del paquete.
    v_total := round(v_precio_paquete + (v_serv + v_equip) * v_horas, 2);

    -- El trigger validar_reserva rechaza horarios ocupados o bloqueados.
    insert into public.reservas (
        cliente_id, nombre, correo, telefono,
        fecha_hora_inicio, fecha_hora_fin,
        tarifa_hora_aplicada, total_calculado, notas_cliente,
        paquete_id, paquete_nombre, paquete_horas, paquete_precio,
        descuento_lealtad, descuento_monto
    ) values (
        v_cliente.id, v_nombre, v_correo, v_telefono,
        v_inicio, v_fin,
        null, v_total, p_notas,
        v_paquete.id, v_paquete.nombre, v_horas, v_precio_paquete,
        v_descuento_lealtad, v_descuento
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

revoke all on function public.solicitar_reserva(
    varchar, varchar, varchar, date, time, uuid, text, uuid[], jsonb
) from public, anon;

grant execute on function public.solicitar_reserva(
    varchar, varchar, varchar, date, time, uuid, text, uuid[], jsonb
) to authenticated;
