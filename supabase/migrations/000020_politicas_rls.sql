-- ==========================================
-- Migración: politicas_rls
-- Activa RLS en todas las tablas (hasta ahora no estaba activo en ninguna) y
-- define quién puede qué:
--   * Público (anon): solo lectura de contenido publicable.
--   * Cliente: lee solo lo suyo; reserva con solicitar_reserva(); reseña sus
--     reservas completadas.
--   * Administrador: acceso total.
-- Los formularios públicos (leads, apoyo social) insertan desde el servidor con
-- la service role key, que no pasa por RLS.
-- ==========================================

-- ---------- administradores ----------
alter table administradores enable row level security;

create policy "administradores_lectura_propia_o_admin"
    on administradores for select to authenticated
    using (id = auth.uid() or public.es_admin());

create policy "administradores_admin_all"
    on administradores for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- clientes ----------
alter table clientes enable row level security;

create policy "clientes_lectura_propia_o_admin"
    on clientes for select to authenticated
    using (id = auth.uid() or public.es_admin());

create policy "clientes_update_propio"
    on clientes for update to authenticated
    using (id = auth.uid()) with check (id = auth.uid());

create policy "clientes_admin_all"
    on clientes for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- El cliente solo puede editar su nombre y teléfono (no id ni correo)
revoke update on clientes from authenticated;
grant update (nombre_completo, telefono) on clientes to authenticated;

-- ---------- portafolio (el backstage no es público) ----------
alter table portafolio enable row level security;

create policy "portafolio_lectura_publica"
    on portafolio for select
    using (es_backstage = false or public.es_admin());

create policy "portafolio_admin_all"
    on portafolio for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- servicios_estudio ----------
alter table servicios_estudio enable row level security;

create policy "servicios_lectura_activos"
    on servicios_estudio for select
    using (activo = true or public.es_admin());

create policy "servicios_admin_all"
    on servicios_estudio for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- inventario_equipos ----------
alter table inventario_equipos enable row level security;

create policy "equipos_lectura_activos"
    on inventario_equipos for select
    using (activo = true or public.es_admin());

create policy "equipos_admin_all"
    on inventario_equipos for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- reservas ----------
-- Los clientes NO insertan directo: usan solicitar_reserva() para que el precio
-- lo calcule el servidor.
alter table reservas enable row level security;

create policy "reservas_cliente_lectura_propia"
    on reservas for select to authenticated
    using (cliente_id = auth.uid());

create policy "reservas_admin_all"
    on reservas for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- reserva_servicios ----------
alter table reserva_servicios enable row level security;

create policy "reserva_servicios_cliente_lectura_propia"
    on reserva_servicios for select to authenticated
    using (exists (
        select 1 from reservas r
        where r.id = reserva_servicios.reserva_id and r.cliente_id = auth.uid()
    ));

create policy "reserva_servicios_admin_all"
    on reserva_servicios for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- reserva_equipos ----------
alter table reserva_equipos enable row level security;

create policy "reserva_equipos_cliente_lectura_propia"
    on reserva_equipos for select to authenticated
    using (exists (
        select 1 from reservas r
        where r.id = reserva_equipos.reserva_id and r.cliente_id = auth.uid()
    ));

create policy "reserva_equipos_admin_all"
    on reserva_equipos for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- resenas_clientes ----------
alter table resenas_clientes enable row level security;

-- Público: solo las publicadas
create policy "resenas_lectura_publicadas"
    on resenas_clientes for select
    using (publicado = true);

-- Cliente: ve las reseñas de sus reservas
create policy "resenas_cliente_lectura_propia"
    on resenas_clientes for select to authenticated
    using (exists (
        select 1 from reservas r
        where r.id = resenas_clientes.reserva_id and r.cliente_id = auth.uid()
    ));

-- Cliente: reseña solo sus reservas COMPLETADAS, siempre sin publicar
-- (el administrador modera). reserva_id único = máximo una reseña por reserva.
create policy "resenas_cliente_insert"
    on resenas_clientes for insert to authenticated
    with check (
        publicado = false
        and exists (
            select 1 from reservas r
            where r.id = resenas_clientes.reserva_id
              and r.cliente_id = auth.uid()
              and r.estado = 'completada'
        )
    );

create policy "resenas_admin_all"
    on resenas_clientes for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- leads_contacto (solo admin; insert desde el servidor) ----------
alter table leads_contacto enable row level security;

create policy "leads_solo_admin"
    on leads_contacto for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- solicitudes_apoyo_social (solo admin; insert desde el servidor) ----------
alter table solicitudes_apoyo_social enable row level security;

create policy "solicitudes_solo_admin"
    on solicitudes_apoyo_social for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- configuracion_sitio ----------
alter table configuracion_sitio enable row level security;

create policy "configuracion_lectura_publica"
    on configuracion_sitio for select using (true);

create policy "configuracion_admin_all"
    on configuracion_sitio for all to authenticated
    using (public.es_admin()) with check (public.es_admin());

-- ---------- fechas_bloqueadas ----------
-- Solo admin. El público consulta la disponibilidad con horarios_ocupados().
alter table fechas_bloqueadas enable row level security;

create policy "fechas_bloqueadas_solo_admin"
    on fechas_bloqueadas for all to authenticated
    using (public.es_admin()) with check (public.es_admin());
