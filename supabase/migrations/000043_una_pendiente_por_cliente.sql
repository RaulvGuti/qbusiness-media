-- ==========================================
-- Migración: una_pendiente_por_cliente
-- Requiere: 000022 y 000042.
--
-- La regla de negocio cambia: cada cliente puede tener una sola solicitud
-- pendiente y futura a la vez. Las reservas confirmadas, canceladas o
-- completadas no cuentan para el límite; al confirmar una solicitud, el
-- cliente vuelve a poder pedir otra.
--
-- El valor sigue siendo configurable desde el panel
-- (estudio / max_pendientes_por_cliente), pero el valor inicial pasa de 3 a 1.
-- El trigger existente se conserva y solo se reemplaza su función para que el
-- respaldo también sea 1 y el mensaje sea claro.
-- ==========================================

insert into configuracion_sitio (grupo, clave, valor)
values ('estudio', 'max_pendientes_por_cliente', '1')
on conflict (grupo, clave) do update set valor = excluded.valor;

create or replace function public.limitar_pendientes_por_cliente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_max        int;
    v_pendientes int;
begin
    -- Solo aplica a solicitudes creadas por el cliente. Un administrador puede
    -- seguir creando reservas directamente sin esta restricción.
    if new.cliente_id is null or new.creado_por is not null or new.estado <> 'pendiente' then
        return new;
    end if;

    select coalesce(nullif(valor, '')::int, 1) into v_max
    from public.configuracion_sitio
    where grupo = 'estudio' and clave = 'max_pendientes_por_cliente';
    v_max := greatest(coalesce(v_max, 1), 1);

    select count(*) into v_pendientes
    from public.reservas
    where cliente_id = new.cliente_id
      and estado = 'pendiente'
      and fecha_hora_fin > now();

    if v_pendientes >= v_max then
        if v_max = 1 then
            raise exception 'Ya tienes una solicitud pendiente. Espera a que el equipo la confirme o cancélala antes de solicitar otra.';
        else
            raise exception 'Ya tienes % solicitudes pendientes. Espera a que el equipo las confirme o cancélalas antes de solicitar otra.', v_max;
        end if;
    end if;

    return new;
end;
$$;
