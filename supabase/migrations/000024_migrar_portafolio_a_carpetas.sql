-- ==========================================
-- Migración: migrar_portafolio_a_carpetas
-- Copia cada fila de `portafolio` a una carpeta con un archivo:
--   es_backstage = false -> modulo 'portafolio', estado 'publicado'
--   es_backstage = true  -> modulo 'backstage',  estado 'borrador'
--                           (en 000003 es material aún no publicado)
-- La carpeta conserva el id de la fila original, y creado_por el autor.
-- foto -> imagen. url_archivo se guarda como url_externa.
-- Es re-ejecutable: no duplica lo ya copiado.
-- `portafolio` NO se borra: cuando el frontend lea de carpetas_galeria,
-- elimínala a mano (drop table portafolio;).
-- ==========================================

insert into carpetas_galeria (
    id, modulo, nombre, descripcion, estado, publicada_en, creado_por, creado_en
)
select
    p.id,
    case when p.es_backstage then 'backstage' else 'portafolio' end,
    p.titulo,
    p.descripcion,
    case when p.es_backstage then 'borrador' else 'publicado' end,
    case when p.es_backstage then null
         else (p.fecha_publicacion::timestamp at time zone 'America/Guatemala') end,
    p.usuario_id,
    p.creado_en
from portafolio p
on conflict (id) do nothing;

insert into archivos_galeria (
    carpeta_id, tipo, url_externa, url_miniatura, orientacion, orden, creado_en
)
select
    p.id,
    case p.tipo when 'foto' then 'imagen' else 'video' end,
    p.url_archivo,
    p.url_miniatura,
    p.orientacion,
    0,
    p.creado_en
from portafolio p
where not exists (
    select 1 from archivos_galeria a where a.carpeta_id = p.id
);
