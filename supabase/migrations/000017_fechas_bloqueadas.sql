-- ==========================================
-- Migración: fechas_bloqueadas
-- Bloqueos del calendario que pone el administrador (vacaciones, mantenimiento,
-- evento privado).
--   * hora_desde / hora_hasta en null -> se bloquean los días completos
--     (desde..hasta).
--   * con valor -> se bloquea SOLO ese horario en cada día del rango, y el resto
--     del día sigue disponible.
-- Las reservas ya bloquean solo su tramo horario por la restricción de
-- exclusión de `reservas`.
-- ==========================================

create table fechas_bloqueadas (
    id          uuid primary key default gen_random_uuid(),
    desde       date not null,
    hasta       date not null,
    hora_desde  time,
    hora_hasta  time,
    motivo      varchar,
    creado_por  uuid not null references administradores(id) on delete restrict,
    creado_en   timestamptz not null default now(),
    constraint fechas_rango_check check (hasta >= desde),
    constraint fechas_horas_check check (
        (hora_desde is null and hora_hasta is null)
        or (hora_desde is not null and hora_hasta is not null and hora_hasta > hora_desde)
    )
);

create index idx_fechas_bloqueadas on fechas_bloqueadas (desde, hasta);
