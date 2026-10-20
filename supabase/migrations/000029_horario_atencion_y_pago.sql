-- ==========================================
-- Migración: horario_atencion_y_pago
-- Sobre 000019/000020 sin editarlas (migración sobre migración). Tres piezas:
--
--   1) Horario de atención configurable: configuracion_sitio gana
--      estudio/hora_apertura y estudio/hora_cierre (defaults 08:00 y 18:00,
--      editables desde el panel). Un trigger en reservas impide crear o mover
--      reservas fuera de ese rango, interpretando las marcas en America/
--      Guatemala y exigiendo que terminen el mismo día.
--
--   2) estado_pago en reservas: pendiente -> comprobante_subido ->
--      pagado / rechazado. El enlace del comprobante ya existía como
--      url_comprobante_pago desde 000006.
--
--   3) RLS de actualización de reservas: el cliente autenticado puede
--      actualizar su propia reserva; el trigger acota esa edición a cancelar
--      (solo desde pendiente o confirmada) y a subir o actualizar el
--      comprobante de pago. El administrador conserva control total.
-- ==========================================

-- ---------- 1) horario de atención configurable ----------

insert into configuracion_sitio (grupo, clave, valor)
values ('estudio', 'hora_apertura', '08:00'),
       ('estudio', 'hora_cierre',   '18:00')
on conflict (grupo, clave) do nothing;

create or replace function public.validar_horario_atencion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_apertura      time;
    v_cierre        time;
    v_inicio_local  timestamp;
    v_fin_local     timestamp;
begin
    -- solo reservas activas; canceladas y completadas no se restringen
    if new.estado not in ('pendiente', 'confirmada') then
        return new;
    end if;

    select nullif(valor, '')::time into v_apertura
    from public.configuracion_sitio
    where grupo = 'estudio' and clave = 'hora_apertura';

    select nullif(valor, '')::time into v_cierre
    from public.configuracion_sitio
    where grupo = 'estudio' and clave = 'hora_cierre';

    -- sin horario configurado (o mal configurado) no se restringe
    if v_apertura is null or v_cierre is null or v_cierre <= v_apertura then
        return new;
    end if;

    v_inicio_local := new.fecha_hora_inicio at time zone 'America/Guatemala';
    v_fin_local    := new.fecha_hora_fin    at time zone 'America/Guatemala';

    if v_inicio_local::date <> v_fin_local::date then
        raise exception 'La reserva debe terminar el mismo día que empieza, dentro del horario de atención (de % a %).',
            v_apertura, v_cierre;
    end if;

    if v_inicio_local::time < v_apertura or v_fin_local::time > v_cierre then
        raise exception 'El horario de atención es de % a %. Elige un horario dentro de ese rango.',
            v_apertura, v_cierre;
    end if;

    return new;
end;
$$;

create trigger trg_validar_horario_atencion
before insert or update of fecha_hora_inicio, fecha_hora_fin, estado on reservas
for each row execute function public.validar_horario_atencion();

-- ---------- 2) estado de pago ----------

alter table reservas
    add column estado_pago varchar not null default 'pendiente'
    check (estado_pago in ('pendiente', 'comprobante_subido', 'pagado', 'rechazado'));

-- ---------- 3) RLS: el cliente actualiza su propia reserva ----------

create policy "reservas_cliente_update"
    on reservas for update to authenticated
    using (cliente_id = auth.uid() or public.es_admin())
    with check (cliente_id = auth.uid() or public.es_admin());

grant update on reservas to authenticated;

create or replace function public.reservas_update_cliente()
returns trigger
language plpgsql
as $$
begin
    -- consola SQL / service role y administradores no se limitan
    if auth.uid() is null or public.es_admin() then
        return new;
    end if;

    -- columnas vedadas para el cliente; solo pueden cambiar estado,
    -- url_comprobante_pago y estado_pago (estado se revisa más abajo)
    if new.id                    is distinct from old.id
        or new.cliente_id        is distinct from old.cliente_id
        or new.creado_por        is distinct from old.creado_por
        or new.nombre            is distinct from old.nombre
        or new.correo            is distinct from old.correo
        or new.telefono          is distinct from old.telefono
        or new.fecha_hora_inicio is distinct from old.fecha_hora_inicio
        or new.fecha_hora_fin    is distinct from old.fecha_hora_fin
        or new.total_calculado   is distinct from old.total_calculado
        or new.tarifa_hora_aplicada is distinct from old.tarifa_hora_aplicada
        or new.notas_cliente     is distinct from old.notas_cliente
        or new.creado_en         is distinct from old.creado_en then
        raise exception 'Solo puedes cancelar tu reserva o subir tu comprobante de pago.';
    end if;

    if new.estado is distinct from old.estado then
        if new.estado <> 'cancelada' then
            raise exception 'Desde tu cuenta solo puedes cancelar tu reserva.';
        end if;
        if old.estado not in ('pendiente', 'confirmada') then
            raise exception 'Una reserva en estado % ya no se puede cancelar.', old.estado;
        end if;
    end if;

    return new;
end;
$$;

create trigger trg_reservas_update_cliente
before update on reservas
for each row execute function public.reservas_update_cliente();
