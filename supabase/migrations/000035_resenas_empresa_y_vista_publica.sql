-- ==========================================
-- Migración: resenas_empresa_y_vista_publica
-- Asocia una reseña con una empresa y publica una vista de solo lectura
-- para el sitio. La empresa y la carpeta se asignan desde el panel; el
-- cliente no puede fijarlas al insertar su reseña.
-- Refuerza la política de inserción del cliente para que tampoco pueda
-- escribir campos internos de moderación.
-- La vista usa security_invoker para que sigan aplicando las políticas RLS
-- de resenas_clientes, carpetas_galeria y empresas.
-- Depende de 000023, 000026 y 000030.
-- ==========================================

alter table public.resenas_clientes
    add column empresa_id uuid references public.empresas(id) on delete set null;

create index idx_resenas_empresa
    on public.resenas_clientes (empresa_id)
    where empresa_id is not null;

drop policy "resenas_cliente_insert" on public.resenas_clientes;

create policy "resenas_cliente_insert"
    on public.resenas_clientes for insert to authenticated
    with check (
        cliente_id = auth.uid()
        and estado = 'pendiente'
        and origen = 'cliente'
        and carpeta_id is null
        and empresa_id is null
        and notas_admin is null
        and revisado_por_id is null
        and revisado_en is null
        and exists (
            select 1 from public.reservas r
            where r.id = resenas_clientes.reserva_id
              and r.cliente_id = auth.uid()
              and r.estado = 'completada'
        )
    );

create or replace view public.resenas_publicas
with (security_invoker = true)
as
select
    r.id,
    r.autor,
    r.empresa_autor,
    r.comentario,
    r.calificacion,
    r.video_url,
    r.video_proporcion,
    r.origen,
    r.carpeta_id,
    c.nombre as carpeta_nombre,
    r.empresa_id,
    e.nombre as empresa_nombre,
    r.creado_en
from public.resenas_clientes r
left join public.carpetas_galeria c on c.id = r.carpeta_id
left join public.empresas e on e.id = r.empresa_id
where r.estado = 'aprobada';

revoke all on public.resenas_publicas from public, anon, authenticated;

grant select on public.resenas_publicas to anon, authenticated, service_role;
