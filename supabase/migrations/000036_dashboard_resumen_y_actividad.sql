-- ==========================================
-- Migración: dashboard_resumen_y_actividad
-- Datos del panel en una sola llamada cada uno (solo administradores):
--   select * from public.dashboard_resumen();
--   select * from public.actividad_reciente(20);
-- dashboard_resumen: contadores de pendientes (reseñas, mensajes nuevos,
--   reservas pendientes, apoyo social nuevo y pagos con comprobante por revisar).
-- actividad_reciente: lista unificada y cronológica (más reciente primero) de
--   contactos, solicitudes de apoyo, reseñas y reservas. Límite entre 1 y 100.
-- Corren con los permisos de quien llama y además verifican es_admin().
-- ==========================================

create or replace function public.dashboard_resumen()
returns table (
    resenas_pendientes  bigint,
    mensajes_nuevos     bigint,
    reservas_pendientes bigint,
    apoyo_social_nuevo  bigint,
    pagos_por_revisar   bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
    if not public.es_admin() then
        raise exception 'Solo los administradores pueden ver el resumen.';
    end if;

    return query
    select
        (select count(*) from public.resenas_clientes          where estado = 'pendiente'),
        (select count(*) from public.leads_contacto            where estado = 'nuevo'),
        (select count(*) from public.reservas                  where estado = 'pendiente'),
        (select count(*) from public.solicitudes_apoyo_social  where estado = 'nueva'),
        (select count(*) from public.reservas
          where estado_pago = 'comprobante_subido' and estado in ('pendiente', 'confirmada'));
end;
$$;

create or replace function public.actividad_reciente(p_limite int default 20)
returns table (
    tipo       text,
    entidad_id uuid,
    titulo     text,
    detalle    text,
    estado     text,
    creado_en  timestamptz
)
language plpgsql
stable
set search_path = public
as $$
begin
    if not public.es_admin() then
        raise exception 'Solo los administradores pueden ver la actividad.';
    end if;

    return query
    select * from (
        select 'contacto'::text, l.id, l.nombre::text,
               coalesce(l.tipo_servicio, left(l.mensaje, 80))::text,
               l.estado::text, l.creado_en
        from public.leads_contacto l
        union all
        select 'apoyo_social', s.id, s.nombre_entidad::text,
               left(s.descripcion_proyecto, 80),
               s.estado::text, s.creado_en
        from public.solicitudes_apoyo_social s
        union all
        select 'resena', r.id, r.autor::text,
               left(r.comentario, 80),
               r.estado::text, r.creado_en
        from public.resenas_clientes r
        union all
        select 'reserva', b.id, b.nombre::text,
               to_char(b.fecha_hora_inicio at time zone 'America/Guatemala', 'DD/MM/YYYY HH24:MI'),
               b.estado::text, b.creado_en
        from public.reservas b
    ) a
    order by 6 desc
    limit least(greatest(coalesce(p_limite, 20), 1), 100);
end;
$$;

revoke all on function public.dashboard_resumen()        from public, anon;
revoke all on function public.actividad_reciente(int)    from public, anon;
grant execute on function public.dashboard_resumen()     to authenticated;
grant execute on function public.actividad_reciente(int) to authenticated;

create index if not exists idx_leads_creado      on leads_contacto (creado_en desc);
create index if not exists idx_solicitudes_creado on solicitudes_apoyo_social (creado_en desc);
create index if not exists idx_resenas_creado    on resenas_clientes (creado_en desc);
create index if not exists idx_reservas_creado   on reservas (creado_en desc);
