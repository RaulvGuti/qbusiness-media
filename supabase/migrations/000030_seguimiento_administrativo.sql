-- ==========================================
-- Migración: seguimiento_administrativo
-- Cubre lo que necesita el panel para dar seguimiento a contactos, apoyo social
-- y reseñas:
--   * campos comerciales del lead (empresa, servicio, presupuesto)
--   * campos de la solicitud de apoyo (organización, ubicación, objetivo...)
--   * nota interna y autor de revisión en cada registro
--   * historial de acciones (cambio de estado y notas)
-- Reemplaza a la migración homónima que traía el número 000012 duplicado y que
-- referenciaba la tabla `usuarios` (eliminada en 000021) y la columna
-- `publicado` de `resenas_clientes` (eliminada en 000026).
-- El estado de las reseñas ya vive en `estado` (000026); aquí solo se agrega la
-- nota del administrador y quién la revisó.
-- ==========================================

alter table leads_contacto
    add column empresa        varchar,
    add column tipo_servicio  varchar,
    add column presupuesto    varchar,
    add column notas_admin    text,
    add column actualizado_en timestamptz not null default now();

alter table leads_contacto
    drop constraint if exists leads_contacto_estado_check;

alter table leads_contacto
    add constraint leads_contacto_estado_check
    check (estado in (
        'nuevo', 'contactado', 'cotizado',
        'en_proceso', 'cerrado', 'descartado'
    ));

alter table solicitudes_apoyo_social
    add column tipo_organizacion   varchar,
    add column cargo_contacto      varchar,
    add column ubicacion           varchar,
    add column objetivo_apoyo      text,
    add column fecha_tentativa     date,
    add column publico_beneficiario text,
    add column alcance_solicitado  varchar,
    add column presupuesto_propio  varchar,
    add column comentarios         text,
    add column notas_admin         text,
    add column actualizado_en      timestamptz not null default now();

alter table solicitudes_apoyo_social
    drop constraint if exists solicitudes_apoyo_social_estado_check;

alter table solicitudes_apoyo_social
    add constraint solicitudes_apoyo_social_estado_check
    check (estado in (
        'nueva', 'en_revision', 'aprobada',
        'rechazada', 'completada'
    ));

alter table resenas_clientes
    add column notas_admin      text,
    add column revisado_por_id  uuid references administradores(id) on delete set null,
    add column revisado_en      timestamptz;

-- Historial de acciones administrativas
create table seguimiento_administrativo (
    id              uuid primary key default gen_random_uuid(),
    entidad         varchar not null check (
        entidad in ('contacto', 'apoyo_social', 'resena')
    ),
    entidad_id      uuid not null,
    accion          varchar not null check (
        accion in ('nota', 'cambio_estado', 'revision')
    ),
    estado_anterior varchar,
    estado_nuevo    varchar,
    nota            text,
    creado_por_id   uuid references administradores(id) on delete set null,
    creado_en       timestamptz not null default now()
);

create index idx_seguimiento_entidad
    on seguimiento_administrativo (entidad, entidad_id);

alter table seguimiento_administrativo enable row level security;

create policy "seguimiento_solo_admin"
    on seguimiento_administrativo for all to authenticated
    using (public.es_admin()) with check (public.es_admin());
