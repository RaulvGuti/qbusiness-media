-- ==========================================
-- Migración: leads_contacto
-- Solicitudes que llegan por el formulario de contacto. `gestionado_por_id`
-- queda en null si el usuario que las atendió se elimina (on delete set null),
-- de modo que el historial comercial no se pierde.
-- ==========================================

create table leads_contacto (
    id                 uuid primary key default gen_random_uuid(),
    gestionado_por_id  uuid references usuarios(id) on delete set null,
    nombre             varchar not null,
    correo             varchar not null,
    telefono           varchar,
    mensaje            text,
    estado             varchar not null default 'nuevo'
                       check (estado in ('nuevo','contactado','cerrado')),
    notificado_en      timestamptz,
    creado_en          timestamptz not null default now()
);

-- El panel filtra los leads por estado del funnel.
create index idx_leads_estado on leads_contacto (estado);
