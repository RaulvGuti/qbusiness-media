-- ==========================================
-- Migración: usuarios
-- Tabla base de identidad. Define los tres roles del negocio y es referenciada
-- por portafolio, reservas, leads_contacto y solicitudes_apoyo_social.
-- ==========================================

create table usuarios (
    id              uuid primary key default gen_random_uuid(),
    rol             varchar not null check (rol in ('admin','colaborador','cliente')),
    nombre_completo varchar not null,
    correo          varchar not null unique,
    telefono        varchar,
    creado_en       timestamptz not null default now()
);
