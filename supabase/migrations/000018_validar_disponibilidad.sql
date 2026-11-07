-- ==========================================
-- Migración: validar_disponibilidad
-- Tres piezas:
--   1) intervalos_bloqueados(): convierte fechas_bloqueadas en intervalos
--      concretos (timestamptz) dentro de un rango. Uso interno.
--   2) trigger validar_reserva: rechaza reservas pendientes/confirmadas que
--      choquen con otra reserva o con un bloqueo, con mensaje legible. Solo
--      valida al crear o al cambiar estado/horario, para no estorbar ediciones
--      menores (por ejemplo, agregar una nota).
--   3) horarios_ocupados(): lo que el sitio público consulta para pintar el
--      calendario. Devuelve solo horarios, sin datos personales.
-- Zona horaria del negocio: America/Guatemala (UTC-6, sin horario de verano).
-- ==========================================

create or replace function public.intervalos_bloqueados(p_desde timestamptz, p_hasta timestamptz)
returns table (inicio timestamptz, fin timestamptz)
language sql
stable
set search_path = public
as $$
    select
        (d::date + coalesce(b.hora_desde, time '00:00')) at time zone 'America/Guatemala',
        (case when b.hora_hasta is null
              then (d::date + 1)::timestamp
              else d::date + b.hora_hasta
         end) at time zone 'America/Guatemala'
    from public.fechas_bloqueadas b
    cross join lateral generate_series(
        greatest(b.desde, (p_desde at time zone 'America/Guatemala')::date)::timestamp,
        least(b.hasta,    (p_hasta at time zone 'America/Guatemala')::date)::timestamp,
        interval '1 day'
    ) as d;
$$;

revoke all on function public.intervalos_bloqueados(timestamptz, timestamptz) from public, anon, authenticated;

create or replace function public.validar_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_validar boolean := true;
begin
    if tg_op = 'UPDATE' then
        v_validar := (old.estado, old.fecha_hora_inicio, old.fecha_hora_fin)
                     is distinct from (new.estado, new.fecha_hora_inicio, new.fecha_hora_fin);
    end if;

    if v_validar and new.estado in ('pendiente', 'confirmada') then

        if exists (
            select 1 from public.reservas r
            where r.id <> new.id
              and r.estado <> 'cancelada'
              and tstzrange(r.fecha_hora_inicio, r.fecha_hora_fin, '[)')
                  && tstzrange(new.fecha_hora_inicio, new.fecha_hora_fin, '[)')
        ) then
            raise exception 'Ese horario ya está reservado.';
        end if;

        if exists (
            select 1
            from public.intervalos_bloqueados(new.fecha_hora_inicio, new.fecha_hora_fin) b
            where tstzrange(b.inicio, b.fin, '[)')
                  && tstzrange(new.fecha_hora_inicio, new.fecha_hora_fin, '[)')
        ) then
            raise exception 'Ese horario no está disponible.';
        end if;

    end if;

    return new;
end;
$$;

create trigger trg_validar_reserva
before insert or update on reservas
for each row execute function public.validar_reserva();

create or replace function public.horarios_ocupados(p_desde date, p_hasta date)
returns table (inicio timestamptz, fin timestamptz, tipo text)
language sql
stable
security definer
set search_path = public
as $$
    with rango as (
        select (p_desde::timestamp at time zone 'America/Guatemala') as d0,
               ((least(p_hasta, p_desde + 366) + 1)::timestamp at time zone 'America/Guatemala') as d1
    )
    select r.fecha_hora_inicio, r.fecha_hora_fin, 'RESERVA'::text
    from public.reservas r, rango
    where r.estado <> 'cancelada'
      and tstzrange(r.fecha_hora_inicio, r.fecha_hora_fin, '[)')
          && tstzrange(rango.d0, rango.d1, '[)')
    union all
    select b.inicio, b.fin, 'BLOQUEO'::text
    from rango, public.intervalos_bloqueados(rango.d0, rango.d1 - interval '1 second') b
    order by 1;
$$;

grant execute on function public.horarios_ocupados(date, date) to anon, authenticated;
