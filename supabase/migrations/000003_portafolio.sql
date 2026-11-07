-- ==========================================
-- Migración: portafolio
-- Galería de piezas publicadas (foto/video) del estudio. `es_backstage` marca
-- el material aun no publicado, que no debe mostrarse en el sitio público.
-- ==========================================

create table portafolio (
    id                 uuid primary key default gen_random_uuid(),
    usuario_id         uuid not null references usuarios(id) on delete restrict,
    titulo             varchar not null,
    descripcion        text,
    tipo               varchar not null check (tipo in ('foto','video')),
    orientacion        varchar not null check (orientacion in ('vertical','horizontal')),
    url_archivo        varchar not null,
    url_miniatura      varchar,
    fecha_publicacion  date not null default current_date,
    es_backstage       boolean not null default false,
    creado_en          timestamptz not null default now()
);

-- La galería pública siempre se ordena de la pieza más reciente a la más antigua.
create index idx_portafolio_fecha on portafolio (fecha_publicacion desc);
