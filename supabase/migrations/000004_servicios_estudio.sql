-- ==========================================
-- Migración: servicios_estudio
-- Catálogo de servicios adicionales al alquiler del salón (fotógrafo,
-- operador de video, etc.) con su tarifa por hora. `activo` permite ocultar un
-- servicio del catálogo sin borrar el histórico de reservas.
-- ==========================================

create table servicios_estudio (
    id              uuid primary key default gen_random_uuid(),
    nombre          varchar not null unique,
    descripcion     text,
    precio_por_hora decimal(10,2) not null check (precio_por_hora >= 0),
    activo          boolean not null default true
);
