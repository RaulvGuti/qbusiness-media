-- ==========================================
-- Migración: galeria_backend
-- Piezas que le faltaban al Gestor de galería y a Destacados:
--   1) Empresas únicas sin distinguir mayúsculas/minúsculas.
--   2) crear_carpeta_galeria(): crea la carpeta y, en inicio/portafolio, busca o
--      crea la empresa y la enlaza (empresa_id) en una sola transacción.
--   3) agregar_archivo_galeria(): inserta el archivo con su orden y, si la
--      carpeta aún no tiene portada, deja como portada al primer archivo que
--      no sea enlace.
--   4) reordenar_archivos(): fija `orden` según la lista de ids recibida.
--   5) eliminar_archivo_galeria(): borra el registro, reasigna la portada y
--      devuelve las rutas de Storage para que el servidor borre los objetos.
--   6) guardar_destacados(): reemplaza TODOS los destacados (agrega, quita y
--      ordena) en una sola transacción.
--
-- Requiere: 000023, 000033.
-- Todas validan es_admin() cuando hay sesión (auth.uid() no nulo); consola SQL
-- y service role no se limitan, igual que en 000032 y 000033.
-- NOTA: si ya existen dos empresas que solo difieren en mayúsculas, el índice
-- del paso 1 falla. Revisa antes con:
--   select lower(btrim(nombre)), count(*) from empresas group by 1 having count(*) > 1;
-- ==========================================

-- ---------- 1) empresas únicas sin importar mayúsculas ----------

create unique index if not exists empresas_nombre_lower_key
    on public.empresas (lower(btrim(nombre)));

-- ---------- 2) crear carpeta (+ empresa) ----------

create or replace function public.crear_carpeta_galeria(
    p_modulo      varchar,
    p_nombre      varchar,
    p_etiqueta    varchar default null,
    p_descripcion text    default null,
    p_filtro      varchar default null
)
returns table (o_carpeta_id uuid, o_empresa_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_nombre  varchar := nullif(btrim(p_nombre), '');
    v_desc    text    := nullif(btrim(p_descripcion), '');
    v_empresa uuid;
    v_carpeta uuid;
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede crear carpetas.';
    end if;

    if v_nombre is null then
        raise exception 'Indica el nombre de la carpeta.';
    end if;

    -- Inicio y Portafolio representan una empresa (cliente o campaña)
    if p_modulo in ('inicio', 'portafolio') then
        select e.id into v_empresa
        from public.empresas e
        where lower(btrim(e.nombre)) = lower(v_nombre);

        if v_empresa is null then
            insert into public.empresas (nombre, descripcion)
            values (v_nombre, v_desc)
            returning id into v_empresa;
        end if;
    end if;

    insert into public.carpetas_galeria (
        modulo, nombre, etiqueta, descripcion, filtro, empresa_id, creado_por
    ) values (
        p_modulo, v_nombre, nullif(btrim(p_etiqueta), ''), v_desc,
        nullif(btrim(p_filtro), ''), v_empresa, auth.uid()
    )
    returning id into v_carpeta;

    return query select v_carpeta, v_empresa;
end;
$$;

revoke all on function public.crear_carpeta_galeria(varchar, varchar, varchar, text, varchar)
    from public, anon;
grant execute on function public.crear_carpeta_galeria(varchar, varchar, varchar, text, varchar)
    to authenticated, service_role;

-- ---------- 3) agregar archivo ----------

create or replace function public.agregar_archivo_galeria(
    p_carpeta_id      uuid,
    p_tipo            varchar,
    p_ruta_storage    varchar default null,
    p_url_externa     varchar default null,
    p_url_miniatura   varchar default null,
    p_nombre_original varchar default null,
    p_orientacion     varchar default 'horizontal',
    p_ancho_px        integer default null,
    p_alto_px         integer default null
)
returns public.archivos_galeria
language plpgsql
security definer
set search_path = public
as $$
declare
    v_orden   integer;
    v_portada boolean;
    v_fila    public.archivos_galeria;
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede agregar archivos.';
    end if;

    if not exists (select 1 from public.carpetas_galeria where id = p_carpeta_id) then
        raise exception 'La carpeta no existe.';
    end if;

    -- serializa altas simultáneas en la misma carpeta (orden y portada únicos)
    perform pg_advisory_xact_lock(hashtext(p_carpeta_id::text));

    select coalesce(max(a.orden), 0) + 1 into v_orden
    from public.archivos_galeria a
    where a.carpeta_id = p_carpeta_id;

    v_portada := p_tipo <> 'enlace'
        and not exists (
            select 1 from public.archivos_galeria a
            where a.carpeta_id = p_carpeta_id and a.es_portada
        );

    insert into public.archivos_galeria (
        carpeta_id, tipo, ruta_storage, url_externa, url_miniatura,
        nombre_original, orientacion, ancho_px, alto_px, orden, es_portada
    ) values (
        p_carpeta_id, p_tipo, nullif(btrim(p_ruta_storage), ''),
        nullif(btrim(p_url_externa), ''), nullif(btrim(p_url_miniatura), ''),
        nullif(btrim(p_nombre_original), ''), p_orientacion,
        nullif(p_ancho_px, 0), nullif(p_alto_px, 0), v_orden, v_portada
    )
    returning * into v_fila;

    return v_fila;
end;
$$;

revoke all on function public.agregar_archivo_galeria(uuid, varchar, varchar, varchar, varchar, varchar, varchar, integer, integer)
    from public, anon;
grant execute on function public.agregar_archivo_galeria(uuid, varchar, varchar, varchar, varchar, varchar, varchar, integer, integer)
    to authenticated, service_role;

-- ---------- 4) reordenar archivos de una carpeta ----------

create or replace function public.reordenar_archivos(
    p_carpeta_id uuid,
    p_orden      uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede reordenar archivos.';
    end if;

    if p_orden is null or cardinality(p_orden) = 0 then
        raise exception 'Indica el orden de los archivos.';
    end if;

    if (select count(distinct x) from unnest(p_orden) as x) <> cardinality(p_orden) then
        raise exception 'No se puede repetir un archivo en el orden.';
    end if;

    if exists (
        select 1
        from unnest(p_orden) as x
        where not exists (
            select 1 from public.archivos_galeria a
            where a.id = x and a.carpeta_id = p_carpeta_id
        )
    ) then
        raise exception 'Alguno de los archivos no pertenece a la carpeta indicada.';
    end if;

    update public.archivos_galeria a
       set orden = t.pos
      from unnest(p_orden) with ordinality as t(id, pos)
     where a.id = t.id;
end;
$$;

revoke all on function public.reordenar_archivos(uuid, uuid[]) from public, anon;
grant execute on function public.reordenar_archivos(uuid, uuid[]) to authenticated, service_role;

-- ---------- 5) eliminar archivo ----------
-- Los objetos de Storage NO se borran desde SQL (Supabase lo desaconseja): la
-- función devuelve las rutas y el servidor los elimina con la API de Storage.

create or replace function public.eliminar_archivo_galeria(p_archivo_id uuid)
returns table (o_ruta_storage varchar, o_url_miniatura varchar)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_carpeta uuid;
    v_portada boolean;
    v_ruta    varchar;
    v_mini    varchar;
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede eliminar archivos.';
    end if;

    select a.carpeta_id, a.es_portada, a.ruta_storage, a.url_miniatura
      into v_carpeta, v_portada, v_ruta, v_mini
    from public.archivos_galeria a
    where a.id = p_archivo_id;

    if not found then
        raise exception 'El archivo no existe.';
    end if;

    delete from public.archivos_galeria where id = p_archivo_id;

    -- si era la portada, la toma el primer archivo (no enlace) por orden
    if v_portada then
        update public.archivos_galeria
           set es_portada = true
         where id = (
             select a.id from public.archivos_galeria a
             where a.carpeta_id = v_carpeta and a.tipo <> 'enlace'
             order by a.orden, a.creado_en
             limit 1
         );
    end if;

    return query select v_ruta, v_mini;
end;
$$;

revoke all on function public.eliminar_archivo_galeria(uuid) from public, anon;
grant execute on function public.eliminar_archivo_galeria(uuid) to authenticated, service_role;

-- ---------- 6) guardar destacados (reemplazo completo) ----------
-- p_items: [{"tipo":"carpeta"|"empresa","id":"<uuid>"}, ...]
-- La posición es el lugar en el arreglo (1..n).

create or replace function public.guardar_destacados(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is not null and not public.es_admin() then
        raise exception 'Solo un administrador puede guardar los destacados.';
    end if;

    if p_items is null or jsonb_typeof(p_items) <> 'array' then
        raise exception 'Los destacados deben enviarse como un arreglo JSON.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) as e(valor)
        where e.valor ->> 'tipo' not in ('carpeta', 'empresa')
           or e.valor ->> 'id' is null
    ) then
        raise exception 'Cada destacado necesita tipo (carpeta o empresa) e id.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) as e(valor)
        group by e.valor ->> 'tipo', e.valor ->> 'id'
        having count(*) > 1
    ) then
        raise exception 'No se puede repetir un destacado.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) as e(valor)
        where (e.valor ->> 'tipo' = 'carpeta'
               and not exists (select 1 from public.carpetas_galeria c
                               where c.id = (e.valor ->> 'id')::uuid))
           or (e.valor ->> 'tipo' = 'empresa'
               and not exists (select 1 from public.empresas m
                               where m.id = (e.valor ->> 'id')::uuid))
    ) then
        raise exception 'Alguno de los destacados ya no existe.';
    end if;

    delete from public.destacados where true;

    insert into public.destacados (carpeta_id, empresa_id, posicion)
    select
        case when e.valor ->> 'tipo' = 'carpeta' then (e.valor ->> 'id')::uuid end,
        case when e.valor ->> 'tipo' = 'empresa' then (e.valor ->> 'id')::uuid end,
        e.pos
    from jsonb_array_elements(p_items) with ordinality as e(valor, pos);
end;
$$;

revoke all on function public.guardar_destacados(jsonb) from public, anon;
grant execute on function public.guardar_destacados(jsonb) to authenticated, service_role;
