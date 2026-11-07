-- ==========================================
-- Migración: contactos_notas_y_campos
-- Se mantienen `leads_contacto` y `solicitudes_apoyo_social` separadas (no se
-- unifican en una tabla `contactos`), pero se cubre lo que faltaba:
--   * notas internas sobre un lead o una solicitud (solo administradores)
--   * campos de la solicitud de apoyo: tipo de entidad y fecha del evento
-- ==========================================

alter table solicitudes_apoyo_social
    add column tipo_entidad varchar,
    add column fecha_evento date;

create table notas_contacto (
    id           uuid primary key default gen_random_uuid(),
    lead_id      uuid references leads_contacto(id) on delete cascade,
    solicitud_id uuid references solicitudes_apoyo_social(id) on delete cascade,
    autor_id     uuid not null references administradores(id) on delete restrict,
    texto        text not null,
    creado_en    timestamptz not null default now(),
    -- la nota pertenece a un lead O a una solicitud, nunca a ambos ni a ninguno
    constraint notas_destino_check check (
        (lead_id is not null and solicitud_id is null)
        or (lead_id is null and solicitud_id is not null)
    )
);

create index idx_notas_lead      on notas_contacto (lead_id)      where lead_id is not null;
create index idx_notas_solicitud on notas_contacto (solicitud_id) where solicitud_id is not null;

alter table notas_contacto enable row level security;

create policy "notas_solo_admin"
    on notas_contacto for all to authenticated
    using (public.es_admin()) with check (public.es_admin());
