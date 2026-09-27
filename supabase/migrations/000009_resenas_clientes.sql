-- ==========================================
-- Migración: resenas_clientes
-- Reseñas de una reserva. `reserva_id` es único: como máximo una reseña por
-- reserva, lo que además garantiza que solo reservas completadas con
-- comentario real puedan ser reseñadas. `publicado` permite moderar antes de
-- que la reseña aparezca en el sitio.
-- ==========================================

create table resenas_clientes (
    id           uuid primary key default gen_random_uuid(),
    reserva_id   uuid not null unique references reservas(id) on delete cascade,
    comentario   text not null,
    calificacion smallint check (calificacion between 1 and 5),
    publicado    boolean not null default false,
    creado_en    timestamptz not null default now()
);

-- El sitio solo consulta las reseñas publicadas.
create index idx_resenas_publicado on resenas_clientes (publicado);
