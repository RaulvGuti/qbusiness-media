-- ==========================================
-- Migración: reservas
-- Reserva del salón. La restricción de exclusión impide traslapes de horario
-- entre reservas: el salón es un único recurso, así que dos reservas no pueden
-- compartir intervalo de tiempo. Se construye sobre tstzrange con límites
-- '[)' para que una reserva que termina a las 12:00 no choque con otra que
-- empieza a las 12:00.
--
-- La condición `where (estado <> 'cancelada')` deja fuera las canceladas, de
-- modo que una reserva cancelada libera su horario sin tener que borrarla.
-- ==========================================

create table reservas (
    id                    uuid primary key default gen_random_uuid(),
    usuario_id            uuid not null references usuarios(id) on delete restrict,
    fecha_hora_inicio     timestamptz not null,
    fecha_hora_fin        timestamptz not null check (fecha_hora_fin > fecha_hora_inicio),
    estado                varchar not null default 'pendiente'
                           check (estado in ('pendiente','confirmada','cancelada','completada')),
    total_calculado       decimal(10,2) check (total_calculado >= 0),
    url_comprobante_pago  varchar,
    notas_cliente         text,
    creado_en             timestamptz not null default now(),
    -- evita traslape de horarios del salón (ignora las canceladas)
    exclude using gist (
        tstzrange(fecha_hora_inicio, fecha_hora_fin, '[)') with &&
    ) where (estado <> 'cancelada')
);
