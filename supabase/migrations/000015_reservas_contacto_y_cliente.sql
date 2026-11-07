-- ==========================================
-- Migración: reservas_contacto_y_cliente
-- La reserva deja de depender de `usuarios` y pasa a guardar:
--   * cliente_id : cliente que la solicitó (null si la creó un administrador)
--   * creado_por : administrador que la creó a mano (null si la pidió un cliente)
--   * nombre / correo / telefono : datos que el cliente escribió en el
--     formulario, congelados en la reserva (pueden diferir de los de su cuenta).
--   * tarifa_hora_aplicada : tarifa del salón vigente al momento de reservar.
-- El traslape de horarios ya lo impide la restricción de exclusión de la
-- migración 000006; no se toca.
-- ==========================================

alter table reservas
    add column cliente_id           uuid references clientes(id) on delete set null,
    add column creado_por           uuid references administradores(id) on delete set null,
    add column nombre               varchar,
    add column correo               varchar,
    add column telefono             varchar,
    add column tarifa_hora_aplicada decimal(10,2) check (tarifa_hora_aplicada >= 0);

-- Rellena las reservas existentes con los datos del usuario anterior
update reservas r
set nombre     = u.nombre_completo,
    correo     = u.correo,
    telefono   = coalesce(u.telefono, 'N/D'),
    cliente_id = c.id
from usuarios u
left join clientes c on lower(c.correo) = lower(u.correo)
where r.usuario_id = u.id;

alter table reservas
    alter column nombre   set not null,
    alter column correo   set not null,
    alter column telefono set not null;

alter table reservas drop column usuario_id;

create index idx_reservas_cliente on reservas (cliente_id);
create index idx_reservas_inicio  on reservas (fecha_hora_inicio);
