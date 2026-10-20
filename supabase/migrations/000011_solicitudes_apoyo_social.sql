-- ==========================================
-- Migración: solicitudes_apoyo_social
-- Solicitudes de apoyo social (fundaciones, bomberos, etc). A diferencia de
-- leads_contacto, el flujo no es comercial sino de evaluación, por eso el
-- estado arranca en 'nueva' y no lleva índice: el volumen es bajo y se
-- consulta por fecha de creación.
-- ==========================================

create table solicitudes_apoyo_social (
    id                    uuid primary key default gen_random_uuid(),
    gestionado_por_id     uuid references usuarios(id) on delete set null,
    nombre_entidad        varchar not null,
    persona_contacto      varchar not null,
    correo                varchar not null,
    telefono              varchar,
    descripcion_proyecto  text,
    estado                varchar not null default 'nueva'
                          check (estado in ('nueva','en_revision','aprobada','rechazada')),
    notificado_en         timestamptz,
    creado_en             timestamptz not null default now()
);
