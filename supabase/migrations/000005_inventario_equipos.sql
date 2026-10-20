-- ==========================================
-- Migración: inventario_equipos
-- Catálogo de equipos rentables. `cantidad_total` es el stock disponible y
-- `activo` permite retirar un equipo del catálogo sin perder sus reservas.
-- ==========================================

create table inventario_equipos (
    id              uuid primary key default gen_random_uuid(),
    nombre          varchar not null,
    descripcion     text,
    cantidad_total  int not null check (cantidad_total >= 0),
    precio_por_hora decimal(10,2) not null check (precio_por_hora >= 0),
    activo          boolean not null default true
);
