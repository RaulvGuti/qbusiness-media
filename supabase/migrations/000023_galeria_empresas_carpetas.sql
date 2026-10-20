-- ==========================================
-- Migración: galeria_empresas_carpetas
-- Modelo de galería por carpetas (como en el esquema v2), con la convención de
-- nombres de esta base (creado_en, actualizado_en, valores en minúscula):
--   * empresas          : clientes/marcas con logo
--   * carpetas_galeria  : agrupan archivos por módulo del sitio
--   * archivos_galeria  : fotos, videos o enlaces dentro de una carpeta
--   * destacados        : carpeta o empresa fijada en una posición del sitio
-- La tabla `portafolio` NO se borra aquí; sus datos se copian en 000024.
-- ==========================================

create table empresas (
    id          uuid primary key default gen_random_uuid(),
    nombre      varchar not null unique,
    logo_ruta   varchar,
    descripcion text,
    activa      boolean not null default true
);

create table carpetas_galeria (
    id             uuid primary key default gen_random_uuid(),
    modulo         varchar not null
                   check (modulo in ('portafolio','backstage','estudio','apoyo_social')),
    nombre         varchar not null,
    etiqueta       varchar,
    descripcion    text,
    filtro         varchar,
    categoria      varchar,
    equipo_usado   varchar,
    lugar          varchar,
    empresa_id     uuid references empresas(id) on delete set null,
    estado         varchar not null default 'borrador'
                   check (estado in ('borrador','publicado')),
    publicada_en   timestamptz,
    creado_por     uuid references administradores(id) on delete set null,
    creado_en      timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);

create index idx_carpetas_empresa on carpetas_galeria (empresa_id);
create index idx_carpetas_estado  on carpetas_galeria (estado);
create index idx_carpetas_modulo  on carpetas_galeria (modulo, publicada_en desc);

create trigger trg_carpetas_actualizado
before update on carpetas_galeria
for each row execute function public.set_actualizado_en();

-- Fija publicada_en al pasar a 'publicado' y lo limpia al volver a 'borrador'
create or replace function public.set_publicada_en()
returns trigger
language plpgsql
as $$
begin
    if new.estado = 'publicado' then
        if tg_op = 'INSERT' then
            new.publicada_en := coalesce(new.publicada_en, now());
        elsif old.estado is distinct from 'publicado' then
            new.publicada_en := coalesce(new.publicada_en, now());
        end if;
    else
        new.publicada_en := null;
    end if;
    return new;
end;
$$;

create trigger trg_carpetas_publicada_en
before insert or update of estado on carpetas_galeria
for each row execute function public.set_publicada_en();

-- Ayuda para RLS: ¿la carpeta está publicada?
create or replace function public.carpeta_publicada(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from public.carpetas_galeria where id = p_id and estado = 'publicado');
$$;

revoke all on function public.carpeta_publicada(uuid) from public;
grant execute on function public.carpeta_publicada(uuid) to anon, authenticated;

create table archivos_galeria (
    id              uuid primary key default gen_random_uuid(),
    carpeta_id      uuid not null references carpetas_galeria(id) on delete cascade,
    tipo            varchar not null check (tipo in ('imagen','video','enlace')),
    ruta_storage    varchar,
    url_externa     varchar,
    url_miniatura   varchar,
    nombre_original varchar,
    pie_foto        varchar,
    orientacion     varchar not null check (orientacion in ('vertical','horizontal','cuadrada')),
    ancho_px        integer check (ancho_px > 0),
    alto_px         integer check (alto_px > 0),
    orden           integer not null default 0,
    creado_en       timestamptz not null default now(),
    constraint archivos_origen_check check (ruta_storage is not null or url_externa is not null)
);

create index idx_archivos_carpeta on archivos_galeria (carpeta_id, orden);

create table destacados (
    id         uuid primary key default gen_random_uuid(),
    carpeta_id uuid references carpetas_galeria(id) on delete cascade,
    empresa_id uuid references empresas(id) on delete cascade,
    posicion   integer not null unique,
    constraint destacados_xor_check check (
        (carpeta_id is not null and empresa_id is null)
        or (carpeta_id is null and empresa_id is not null)
    )
);

-- ---------- RLS ----------
alter table empresas enable row level security;

create policy "empresas_lectura_publica"
    on empresas for select
    using (activa = true or public.es_admin());

create policy "empresas_admin_all"
    on empresas for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

alter table carpetas_galeria enable row level security;

create policy "carpetas_lectura_publica"
    on carpetas_galeria for select
    using (estado = 'publicado' or public.es_admin());

create policy "carpetas_admin_all"
    on carpetas_galeria for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

alter table archivos_galeria enable row level security;

create policy "archivos_lectura_publica"
    on archivos_galeria for select
    using (public.carpeta_publicada(carpeta_id) or public.es_admin());

create policy "archivos_admin_all"
    on archivos_galeria for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- Solo se ven los destacados cuyo destino es público
alter table destacados enable row level security;

create policy "destacados_lectura_publica"
    on destacados for select
    using (
        public.es_admin()
        or (carpeta_id is not null and public.carpeta_publicada(carpeta_id))
        or (empresa_id is not null and exists (
              select 1 from empresas e where e.id = destacados.empresa_id and e.activa))
    );

create policy "destacados_admin_all"
    on destacados for all to authenticated
    using (public.es_admin()) with check (public.es_admin());
