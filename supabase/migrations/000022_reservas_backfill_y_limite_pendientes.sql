-- ==========================================
-- Migración: reservas_backfill_y_limite_pendientes
-- 1) Las reservas migradas en 000015 quedaron con creado_por en null aunque las
--    haya creado un administrador. Se cruza por correo con `administradores`.
--    (tarifa_hora_aplicada NO se rellena: el total antiguo incluía extras y
--     no se puede deducir la tarifa real. Queda en null para las reservas
--     previas a esta migración.)
-- 2) Las reservas 'pendiente' bloquean el horario (restricción de 000006 y
--    horarios_ocupados). Para que un cliente no pueda acaparar el calendario
--    se limita cuántas solicitudes pendientes y futuras puede tener a la vez.
--    El límite se edita en configuracion_sitio (estudio / max_pendientes_por_cliente).
-- ==========================================

update reservas r
set creado_por = a.id
from administradores a
where lower(a.correo) = lower(r.correo)
  and r.cliente_id is null
  and r.creado_por is null;

insert into configuracion_sitio (grupo, clave, valor)
values ('estudio', 'max_pendientes_por_cliente', '3')
on conflict (grupo, clave) do nothing;

create or replace function public.limitar_pendientes_por_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_max       int;
    v_pendientes int;
begin
    -- Solo aplica a solicitudes de clientes (no a reservas creadas por un admin)
    if new.cliente_id is null or new.creado_por is not null or new.estado <> 'pendiente' then
        return new;
    end if;

    select coalesce(nullif(valor, '')::int, 3) into v_max
    from public.configuracion_sitio
    where grupo = 'estudio' and clave = 'max_pendientes_por_cliente';
    v_max := coalesce(v_max, 3);

    select count(*) into v_pendientes
    from public.reservas
    where cliente_id = new.cliente_id
      and estado = 'pendiente'
      and fecha_hora_fin > now();

    if v_pendientes >= v_max then
        raise exception 'Ya tienes % solicitudes pendientes. Espera a que se confirmen o cancélalas antes de pedir otra.', v_max;
    end if;

    return new;
end;
$$;

create trigger trg_limitar_pendientes
before insert on reservas
for each row execute function public.limitar_pendientes_por_cliente();
