-- ==========================================
-- Migración: galeria_inicio_portada_destacados
-- El panel usaba 'login' para el módulo de la página principal. 'login' nunca
-- existió en la base: 000023 solo admitía portafolio, backstage, estudio y
-- apoyo_social. Aquí se renombra el módulo a 'inicio'; no hay datos que migrar.
--
-- También agrega lo necesario para portadas y destacados:
--   * empresas.portada_ruta (ruta de Storage para la portada de una empresa)
--   * archivos_galeria.es_portada, con una sola portada por carpeta y sin enlaces
--   * definir_portada() para cambiar la portada de forma atómica
--   * reordenar_destacados() con posiciones diferibles
--   * vistas carpetas_con_portada y destacados_detalle, respetando RLS
--
-- Requiere: 000023.
-- ==========================================

-- ---------- módulo 'inicio' ----------

alter table public.carpetas_galeria
    drop constraint if exists carpetas_galeria_modulo_check;

alter table public.carpetas_galeria
    add constraint carpetas_galeria_modulo_check
    check (modulo in ('inicio', 'portafolio', 'backstage', 'estudio', 'apoyo_social'));

-- ---------- portadas ----------

alter table public.empresas
    add column if not exists portada_ruta varchar;

comment on column public.empresas.portada_ruta is
    'Ruta de Storage (bucket galeria o logos) con la portada de la empresa.';

alter table public.archivos_galeria
    add column if not exists es_portada boolean not null default false;

comment on column public.archivos_galeria.es_portada is
    'Marca el archivo que representa la portada de la carpeta. Una sola por carpeta.';

alter table public.archivos_galeria
    drop constraint if exists archivos_portada_no_enlace_check;

alter table public.archivos_galeria
    add constraint archivos_portada_no_enlace_check
    check (not es_portada or tipo <> 'enlace');

create unique index if not exists archivos_portada_unica_por_carpeta
    on public.archivos_galeria (carpeta_id)
    where es_portada;

create or replace function public.definir_portada(
    p_carpeta_id uuid,
    p_archivo_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede cambiar la portada.';
    end if;

    if not exists (
        select 1
        from public.archivos_galeria
        where id = p_archivo_id
          and carpeta_id = p_carpeta_id
    ) then
        raise exception 'El archivo no pertenece a la carpeta indicada.';
    end if;

    if exists (
        select 1
        from public.archivos_galeria
        where id = p_archivo_id
          and tipo = 'enlace'
    ) then
        raise exception 'Un enlace no puede usarse como portada.';
    end if;

    update public.archivos_galeria
       set es_portada = false
     where carpeta_id = p_carpeta_id
       and es_portada
       and id <> p_archivo_id;

    update public.archivos_galeria
       set es_portada = true
     where id = p_archivo_id;
end;
$$;

revoke all on function public.definir_portada(uuid, uuid) from public, anon;
grant execute on function public.definir_portada(uuid, uuid) to authenticated, service_role;

-- ---------- orden de destacados ----------
-- La restricción pasa a diferible para poder intercambiar posiciones dentro de
-- una misma transacción. No se usa ON CONFLICT: PostgreSQL no acepta una
-- restricción diferible como árbitro de un upsert.

alter table public.destacados
    drop constraint if exists destacados_posicion_key;

alter table public.destacados
    add constraint destacados_posicion_key
    unique (posicion) deferrable initially immediate;

create or replace function public.reordenar_destacados(p_orden jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede reordenar los destacados.';
    end if;

    if p_orden is null or jsonb_typeof(p_orden) <> 'array' then
        raise exception 'El orden debe ser un arreglo JSON.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_orden) as elem(valor)
        group by elem.valor ->> 'id'
        having count(*) > 1
    ) then
        raise exception 'No se puede repetir un destacado en el orden.';
    end if;

    if exists (
        select 1
        from jsonb_to_recordset(p_orden) as x(id uuid, posicion integer)
        where x.id is null
           or x.posicion is null
           or x.posicion < 1
    ) then
        raise exception 'Cada elemento necesita id y posicion positiva.';
    end if;

    if exists (
        select 1
        from jsonb_to_recordset(p_orden) as x(id uuid, posicion integer)
        group by x.posicion
        having count(*) > 1
    ) then
        raise exception 'No se puede repetir una posición.';
    end if;

    if exists (
        select 1
        from jsonb_to_recordset(p_orden) as x(id uuid, posicion integer)
        where not exists (
            select 1 from public.destacados d where d.id = x.id
        )
    ) then
        raise exception 'Uno de los destacados no existe.';
    end if;

    set constraints destacados_posicion_key deferred;

    update public.destacados d
       set posicion = x.posicion
      from jsonb_to_recordset(p_orden) as x(id uuid, posicion integer)
     where d.id = x.id;

    set constraints destacados_posicion_key immediate;
end;
$$;

revoke all on function public.reordenar_destacados(jsonb) from public, anon;
grant execute on function public.reordenar_destacados(jsonb) to authenticated, service_role;

-- ---------- vistas de lectura pública ----------

create or replace view public.carpetas_con_portada
with (security_invoker = true)
as
select
    c.id,
    c.modulo,
    c.nombre,
    c.etiqueta,
    c.descripcion,
    c.filtro,
    c.categoria,
    c.equipo_usado,
    c.lugar,
    c.empresa_id,
    e.nombre as nombre_empresa,
    e.logo_ruta,
    c.estado,
    c.publicada_en,
    c.creado_por,
    c.creado_en,
    c.actualizado_en,
    a.id as portada_id,
    a.tipo as portada_tipo,
    a.ruta_storage as portada_ruta,
    a.url_externa as portada_url_externa,
    a.url_miniatura as portada_miniatura,
    a.orientacion as portada_orientacion,
    a.ancho_px as portada_ancho_px,
    a.alto_px as portada_alto_px
from public.carpetas_galeria c
left join public.empresas e on e.id = c.empresa_id
left join lateral (
    select id, tipo, ruta_storage, url_externa, url_miniatura,
           orientacion, ancho_px, alto_px
    from public.archivos_galeria
    where carpeta_id = c.id
      and es_portada
    limit 1
) a on true;

create or replace view public.destacados_detalle
with (security_invoker = true)
as
select
    d.id,
    d.posicion,
    case when d.carpeta_id is not null then 'carpeta' else 'empresa' end as tipo,
    d.carpeta_id,
    d.empresa_id,
    coalesce(c.nombre, e.nombre) as nombre,
    coalesce(c.descripcion, e.descripcion) as descripcion,
    c.modulo,
    c.etiqueta,
    c.categoria,
    coalesce(d.empresa_id, c.empresa_id) as empresa_vinculada_id,
    e.nombre as empresa_nombre,
    e.logo_ruta,
    a.id as portada_archivo_id,
    a.tipo as portada_tipo,
    coalesce(a.ruta_storage, a.url_externa, e.portada_ruta, e.logo_ruta) as portada_ruta,
    coalesce(a.url_miniatura, a.ruta_storage, a.url_externa,
             e.portada_ruta, e.logo_ruta) as portada_miniatura,
    a.orientacion as portada_orientacion,
    a.ancho_px as portada_ancho_px,
    a.alto_px as portada_alto_px,
    c.creado_por,
    c.creado_en,
    c.actualizado_en
from public.destacados d
left join public.carpetas_galeria c on c.id = d.carpeta_id
left join public.empresas e on e.id = coalesce(d.empresa_id, c.empresa_id)
left join lateral (
    select id, tipo, ruta_storage, url_externa, url_miniatura,
           orientacion, ancho_px, alto_px
    from public.archivos_galeria
    where carpeta_id = c.id
      and es_portada
    limit 1
) a on true;

revoke all on public.carpetas_con_portada from public, anon, authenticated;
revoke all on public.destacados_detalle from public, anon, authenticated;

grant select on public.carpetas_con_portada to anon, authenticated, service_role;
grant select on public.destacados_detalle to anon, authenticated, service_role;
