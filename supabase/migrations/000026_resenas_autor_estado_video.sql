-- ==========================================
-- Migración: resenas_autor_estado_video
-- Amplía `resenas_clientes` para poder mostrar la reseña en el sitio:
--   * autor / empresa_autor : quién firma la reseña (se copia del nombre de la
--     reserva en las existentes)
--   * cliente_id            : cliente dueño (se copia desde la reserva)
--   * estado                : pendiente / aprobada / rechazada (reemplaza a
--     `publicado`; true -> aprobada, false -> pendiente)
--   * carpeta_id, video_url, video_proporcion : material asociado
--   * origen                : 'cliente' (con reserva) o 'admin' (creada a mano)
-- reserva_id pasa a ser opcional para permitir reseñas creadas por un admin;
-- sigue siendo único (máximo una reseña por reserva) y obligatorio si el
-- origen es 'cliente'.
-- Depende de 000023 (carpetas_galeria).
-- Nota: `calificacion` sigue admitiendo null porque las reseñas existentes
-- pueden no tenerla; no se inventa un valor.
-- ==========================================

alter table resenas_clientes
    add column cliente_id       uuid references clientes(id) on delete set null,
    add column autor            varchar,
    add column empresa_autor    varchar,
    add column estado           varchar not null default 'pendiente'
                                check (estado in ('pendiente','aprobada','rechazada')),
    add column carpeta_id       uuid references carpetas_galeria(id) on delete set null,
    add column video_url        varchar,
    add column video_proporcion varchar check (video_proporcion in ('16/9','9/16')),
    add column origen           varchar not null default 'cliente'
                                check (origen in ('cliente','admin'));

update resenas_clientes rc
set cliente_id = r.cliente_id,
    autor      = r.nombre,
    estado     = case when rc.publicado then 'aprobada' else 'pendiente' end
from reservas r
where r.id = rc.reserva_id;

alter table resenas_clientes alter column autor set not null;

-- `publicado` es reemplazado por `estado`: primero salen las políticas e índice
-- que dependen de él
drop policy "resenas_lectura_publicadas"     on resenas_clientes;
drop policy "resenas_cliente_lectura_propia" on resenas_clientes;
drop policy "resenas_cliente_insert"         on resenas_clientes;
drop index  idx_resenas_publicado;

alter table resenas_clientes drop column publicado;

alter table resenas_clientes alter column reserva_id drop not null;

alter table resenas_clientes
    add constraint resenas_reserva_cliente_check
    check (origen = 'admin' or reserva_id is not null);

create index idx_resenas_estado  on resenas_clientes (estado);
create index idx_resenas_cliente on resenas_clientes (cliente_id);

-- Público: solo aprobadas
create policy "resenas_lectura_aprobadas"
    on resenas_clientes for select
    using (estado = 'aprobada');

-- Cliente: ve todas sus reseñas, en cualquier estado
create policy "resenas_cliente_lectura_propia"
    on resenas_clientes for select to authenticated
    using (cliente_id = auth.uid());

-- Cliente: reseña solo sus reservas COMPLETADAS, siempre pendiente (modera el admin)
create policy "resenas_cliente_insert"
    on resenas_clientes for insert to authenticated
    with check (
        cliente_id = auth.uid()
        and estado = 'pendiente'
        and origen = 'cliente'
        and carpeta_id is null
        and exists (
            select 1 from reservas r
            where r.id = resenas_clientes.reserva_id
              and r.cliente_id = auth.uid()
              and r.estado = 'completada'
        )
    );
-- "resenas_admin_all" (000020) se conserva.
